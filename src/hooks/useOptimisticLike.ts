import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseOptimisticLikeProps {
  gameId: string;
  initialLiked: boolean;
  initialCount: number;
  userId: string | null;
}

/**
 * Hook for optimistic like updates
 * Updates UI immediately, then syncs with server
 */
export const useOptimisticLike = ({
  gameId,
  initialLiked,
  initialCount,
  userId,
}: UseOptimisticLikeProps) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (!userId) throw new Error('Not authenticated');

      if (shouldLike) {
        const { error } = await supabase
          .from('game_likes')
          .insert({ game_id: gameId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_likes')
          .delete()
          .eq('game_id', gameId)
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onMutate: async (shouldLike) => {
      // Optimistic update
      setIsLiked(shouldLike);
      setLikeCount(prev => shouldLike ? prev + 1 : prev - 1);
    },
    onError: (error, shouldLike) => {
      // Revert on error
      setIsLiked(!shouldLike);
      setLikeCount(prev => shouldLike ? prev - 1 : prev + 1);
      toast.error('Failed to update like');
    },
    onSuccess: () => {
      // Invalidate queries to sync with server
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const toggleLike = useCallback(() => {
    if (!userId) {
      toast.error('Please sign in to like games');
      return;
    }
    likeMutation.mutate(!isLiked);
  }, [userId, isLiked, likeMutation]);

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading: likeMutation.isPending,
  };
};
