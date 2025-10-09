import { X, Timer, Mic, MicOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useVoiceChat } from "@/hooks/use-voice-chat";

interface GamePlayerProps {
  game: {
    id: string;
    title: string;
    game_code: string;
  };
  onClose: () => void;
}

export const GamePlayer = ({ game, onClose }: GamePlayerProps) => {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const roomId = `game-${game.id}`;
  const { isReady, isMicOn, remoteAudios, participants, toggleMic, error } = useVoiceChat(roomId);

  const AudioStream = ({ stream }: { stream: MediaStream }) => {
    const ref = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
      if (ref.current) {
        // @ts-expect-error - srcObject exists on HTMLMediaElement
        ref.current.srcObject = stream;
      }
    }, [stream]);
    return <audio ref={ref} autoPlay playsInline />;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{game.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1 mr-2">
              <Users className="h-4 w-4" /> {participants.length}
            </div>
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