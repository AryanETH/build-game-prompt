import { X, Timer, Mic, MicOff, Users, Volume2, VolumeX, Keyboard, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { supabase } from "@/integrations/supabase/client";

interface GamePlayerProps {
  game: {
    id: string;
    title: string;
    game_code: string;
    sound_url?: string | null;
  };
  onClose: () => void;
}

export const GamePlayer = ({ game, onClose }: GamePlayerProps) => {
  const roomId = `game-${game.id}`;
  const { isReady, isMicOn, remoteAudios, participants, toggleMic, error } = useVoiceChat(roomId);
  const [soundOn, setSoundOn] = useState(true);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const AudioStream = ({ stream }: { stream: MediaStream }) => {
    const ref = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    }, [stream]);
    return <audio ref={ref} autoPlay playsInline />;
  };

  useEffect(() => {
    // Respect user's default sound preference
    try {
      const raw = localStorage.getItem('playgen:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.enableSoundByDefault === 'boolean') {
          setSoundOn(!!parsed.enableSoundByDefault);
        }
      }
    } catch {}

    // Show desktop controls overlay briefly
    const isDesktop = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (isDesktop) {
      setShowControlsOverlay(true);
      const t = setTimeout(() => setShowControlsOverlay(false), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    // Mark this game as being actively played via presence
    const presenceKey = `player_${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(`playing:${game.id}`, {
      config: { presence: { key: presenceKey } },
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ started_at: new Date().toISOString() });
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [game.id]);



  useEffect(() => {
    if (!game.sound_url) return;
    if (!bgAudioRef.current) return;
    bgAudioRef.current.muted = !soundOn;
  }, [soundOn, game.sound_url]);

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{game.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participants.length} playing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1 mr-2">
              <Users className="h-4 w-4" /> {participants.length}
            </div>
            {game.sound_url && (
              <Button
                variant={soundOn ? "default" : "secondary"}
                size="icon"
                onClick={() => setSoundOn((v) => !v)}
                title={soundOn ? "Sound off" : "Sound on"}
                className={soundOn ? "gradient-primary" : ""}
              >
                {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            )}
            <Button
              variant={isMicOn ? "default" : "secondary"}
              size="icon"
              onClick={toggleMic}
              title={isMicOn ? "Mute mic" : "Unmute mic"}
              className={isMicOn ? "gradient-primary" : ""}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-destructive/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={game.game_code}
            className="w-full h-full border-0"
            title={game.title}
            sandbox="allow-scripts allow-same-origin"
          />
          {showControlsOverlay && (
            <div className="pointer-events-none absolute inset-x-4 top-20 z-10 rounded-xl bg-black/60 text-white p-3 md:p-4 flex items-center gap-3 justify-center">
              <Keyboard className="h-5 w-5" />
              <div className="text-xs md:text-sm">
                Use WASD or Arrow Keys to move, Space for action. Click inside the game to focus.
              </div>
              <MousePointer className="h-5 w-5 hidden md:block" />
            </div>
          )}
          {game.sound_url && (
            <audio ref={bgAudioRef} src={game.sound_url || undefined} autoPlay loop />
          )}
          {/* Hidden remote audio elements */}
          <div className="sr-only">
            {remoteAudios.map((ra) => (
              <AudioStream key={ra.userId} stream={ra.stream} />
            ))}
          </div>
        </div>
        {/* Fallback error message */}
        {error && (
          <div className="p-2 text-center text-xs text-destructive">{error}</div>
        )}
      </div>
    </div>
  );
};