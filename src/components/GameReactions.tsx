import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Smile } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

interface GameReactionsProps {
  gameId: string;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '😂', '😍', '🤯', '👏', '🎮', '⭐'];

export const GameReactions = ({ gameId }: GameReactionsProps) => {
  const { userId } = useUserStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch reactions for this game
  const { data: reactions = [] } = useQuery({
    queryKey: ['gameReactions', gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_reactions')
        .select('emoji, user_id')
        .eq('game_id', gameId);

      if (error) throw error;
      return data;
    },
  });

  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if user has reacted
  const userReaction = reactions.find((r) => r.user_id === userId);

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!userId) throw new Error('Not authenticated');

      // Remove existing reaction if any
      if (userReaction) {
        await supabase
          .from('game_reactions')
          .delete()
          .eq('game_id', gameId)
          .eq('user_id', userId);
      }

      // Add new reaction
      const { error } = await supabase
        .from('game_reactions')
        .insert({
          game_id: gameId,
          user_id: userId,
          emoji,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameReactions', gameId] });
      setOpen(false);
    },
    onError: (error: Error) => {
      console.error('Reaction error:', error);
      toast.error('Failed to add reaction');
    },
  });

  const handleReaction = (emoji: string) => {
    if (!userId) {
      toast.error('Please sign in to react');
      return;
    }
    addReactionMutation.mutate(emoji);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Display reaction counts */}
      <div className="flex gap-1">
        {Object.entries(reactionCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-all hover:scale-110 ${
                userReaction?.emoji === emoji
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <span>{emoji}</span>
              <span className="text-xs font-semibold">{count}</span>
            </button>
          ))}
      </div>

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Smile className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-2 rounded hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
