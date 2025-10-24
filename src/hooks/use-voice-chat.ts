import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RemoteAudio {
  userId: string;
  stream: MediaStream;
}

interface UseVoiceChatResult {
  isReady: boolean;
  isMicOn: boolean;
  participants: string[];
  remoteAudios: RemoteAudio[];
  toggleMic: () => Promise<void>;
  error: string | null;
}

export function useVoiceChat(roomId: string): UseVoiceChatResult {
  const [isReady, setIsReady] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [remoteAudios, setRemoteAudios] = useState<RemoteAudio[]>([]);
  const [error, setError] = useState<string | null>(null);

  const myUserIdRef = useRef<string>("");
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Avoid re-offering to same peer
  const offeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        const userId = (window as any).Clerk?.user?.id || `anon_${Math.random().toString(36).slice(2)}`;
        myUserIdRef.current = userId;

        const channel = supabase.channel(`voice:${roomId}`, {
          config: { broadcast: { self: true }, presence: { key: userId } },
        });
        channelRef.current = channel;

        channel.on("presence", { event: "sync" }, () => {
          const state = channel.presenceState() as Record<string, any[]>;
          const ids = Object.keys(state);
          setParticipants(ids);

          // Initiate calls to peers using deterministic rule
          ids
            .filter((id) => id !== myUserIdRef.current)
            .forEach((id) => {
              // Only one side should initiate: the lexicographically larger id
              if (myUserIdRef.current > id && !offeredRef.current.has(id)) {
                offeredRef.current.add(id);
                createPeerConnection(id, true).catch(() => {});
              }
            });
        });

        channel.on("broadcast", { event: "webrtc" }, async (payload: any) => {
          const { type, from, to, sdp, candidate } = payload.payload || payload;
          if (to && to !== myUserIdRef.current) return;

          let pc = peersRef.current.get(from);
          if (!pc) {
            pc = await createPeerConnection(from, false);
          }

          if (type === "offer" && sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await ensureLocalStream();
            localStreamRef.current?.getTracks().forEach((track) => pc!.addTrack(track, localStreamRef.current!));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: "broadcast",
              event: "webrtc",
              payload: { type: "answer", from: myUserIdRef.current, to: from, sdp: pc.localDescription },
            });
          } else if (type === "answer" && sdp) {
            if (pc.signalingState !== "stable") {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
          } else if (type === "ice" && candidate) {
            try {
              await pc.addIceCandidate(candidate);
            } catch (err) {
              // ignore
            }
          }
        });

        await channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            channel.track({ joined_at: new Date().toISOString() });
            setIsReady(true);
          }
        });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to initialize voice chat");
      }
    }

    setup();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId]);

  async function ensureLocalStream() {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setIsMicOn(true);
      } catch (e: any) {
        setError("Microphone permission denied");
        throw e;
      }
    }
  }

  async function createPeerConnection(remoteUserId: string, initiator: boolean) {
    const channel = channelRef.current!;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peersRef.current.set(remoteUserId, pc);

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        channel.send({
          type: "broadcast",
          event: "webrtc",
          payload: {
            type: "ice",
            from: myUserIdRef.current,
            to: remoteUserId,
            candidate: ev.candidate,
          },
        });
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      setRemoteAudios((prev) => {
        const exists = prev.find((p) => p.userId === remoteUserId);
        if (exists) {
          return prev.map((p) => (p.userId === remoteUserId ? { userId: remoteUserId, stream } : p));
        }
        return [...prev, { userId: remoteUserId, stream }];
      });
    };

    if (initiator) {
      await ensureLocalStream();
      localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channel.send({
        type: "broadcast",
        event: "webrtc",
        payload: { type: "offer", from: myUserIdRef.current, to: remoteUserId, sdp: offer },
      });
    }

    return pc;
  }

  const toggleMic = async () => {
    if (!localStreamRef.current) {
      await ensureLocalStream();
      // Add to all existing peers
      peersRef.current.forEach((pc) => {
        localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
      });
      return;
    }

    const current = localStreamRef.current.getAudioTracks()[0];
    const nextEnabled = !current.enabled;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = nextEnabled));
    setIsMicOn(nextEnabled);
  };

  return { isReady, isMicOn, participants, remoteAudios, toggleMic, error };
}
