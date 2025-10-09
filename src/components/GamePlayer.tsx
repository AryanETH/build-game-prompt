import { X, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={game.game_code}
            className="w-full h-full border-0"
            title={game.title}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};