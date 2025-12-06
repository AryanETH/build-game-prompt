import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Users, Loader2, X } from 'lucide-react';

interface LookingForPlayerProps {
  queueCount: number;
  onCancel: () => void;
}

export const LookingForPlayer = ({ queueCount, onCancel }: LookingForPlayerProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md rounded-2xl p-8 md:p-12 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Users className="h-20 w-20 text-purple-400 opacity-75" />
            </div>
            <Users className="h-20 w-20 text-white relative z-10 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
          Looking for Player{dots}
        </h2>

        {/* Description */}
        <p className="text-white/80 text-center mb-6">
          Searching for an opponent to play with
        </p>

        {/* Queue Info */}
        <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Players in queue:</span>
            <span className="text-2xl font-bold text-white">{queueCount}</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Matching you with a player...</span>
          </div>
          <div className="text-xs text-white/40 text-center">
            This usually takes less than 30 seconds
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full border-white/30 text-white hover:bg-white/10"
        >
          Cancel Search
        </Button>
      </div>
    </div>
  );
};
