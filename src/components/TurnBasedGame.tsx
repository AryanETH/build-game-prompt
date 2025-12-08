import { Button } from './ui/button';
import { X, Trophy, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Player {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
}

interface TurnBasedGameProps {
  matchId: string;
  gameCode: string;
  player1: Player;
  player2: Player;
  currentTurn: string;
  myId: string;
  isMyTurn: boolean;
  onSwitchTurn: () => void;
  onUpdateScore: (score: number) => void;
  onEndMatch: (winnerId: string) => void;
  onClose: () => void;
}

export const TurnBasedGame = ({
  matchId,
  gameCode,
  player1,
  player2,
  currentTurn,
  myId,
  isMyTurn,
  onSwitchTurn,
  onUpdateScore,
  onEndMatch,
  onClose,
}: TurnBasedGameProps) => {
  const me = myId === player1.id ? player1 : player2;
  const opponent = myId === player1.id ? player2 : player1;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Player 1 */}
          <div className={`flex items-center gap-3 ${currentTurn === player1.id ? 'ring-2 ring-green-500 rounded-lg p-2' : 'p-2'}`}>
            <Avatar className="h-10 w-10 border-2 border-white/50">
              <AvatarImage className="object-cover" src={player1.avatar_url || undefined} />
              <AvatarFallback className="gradient-primary text-white">
                {player1.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-white font-semibold text-sm">{player1.username}</div>
              <div className="text-yellow-400 text-xs flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {player1.score}
              </div>
            </div>
          </div>

          {/* VS */}
          <div className="text-white font-bold text-xl">VS</div>

          {/* Player 2 */}
          <div className={`flex items-center gap-3 ${currentTurn === player2.id ? 'ring-2 ring-green-500 rounded-lg p-2' : 'p-2'}`}>
            <div className="text-right">
              <div className="text-white font-semibold text-sm">{player2.username}</div>
              <div className="text-yellow-400 text-xs flex items-center gap-1 justify-end">
                <Trophy className="h-3 w-3" />
                {player2.score}
              </div>
            </div>
            <Avatar className="h-10 w-10 border-2 border-white/50">
              <AvatarImage className="object-cover" src={player2.avatar_url || undefined} />
              <AvatarFallback className="gradient-primary text-white">
                {player2.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="absolute top-20 left-0 right-0 z-10 flex justify-center">
        <div className={`px-6 py-3 rounded-full ${isMyTurn ? 'bg-green-500' : 'bg-red-500'} text-white font-bold flex items-center gap-2 shadow-lg`}>
          {isMyTurn ? (
            <>
              <Users className="h-5 w-5" />
              Your Turn
            </>
          ) : (
            <>
              <Users className="h-5 w-5" />
              {opponent.username}'s Turn
            </>
          )}
        </div>
      </div>

      {/* Game iframe */}
      <div className="w-full h-full">
        <iframe
          srcDoc={gameCode}
          className="w-full h-full border-0"
          title="Game"
          sandbox="allow-scripts allow-same-origin"
          style={{ pointerEvents: isMyTurn ? 'auto' : 'none' }}
        />
      </div>

      {/* Spectator Overlay (when not your turn) */}
      {!isMyTurn && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
          <div className="bg-black/80 px-8 py-4 rounded-lg border border-white/20">
            <p className="text-white text-lg font-semibold">
              Watching {opponent.username} play...
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex justify-center gap-4 max-w-md mx-auto">
          {isMyTurn && (
            <Button
              onClick={onSwitchTurn}
              className="gradient-primary text-white font-semibold"
            >
              End Turn
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
