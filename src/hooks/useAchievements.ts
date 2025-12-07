import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Achievement, UserAchievement } from '@/types';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

export const useAchievements = () => {
  const queryClient = useQueryClient();
  
  // Get userId directly from Supabase auth
  const { data: authData } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data;
    },
  });
  
  const userId = authData?.user?.id || null;

  // Fetch all available achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch user's unlocked achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId);

      if (error) throw error;
      return data as UserAchievement[];
    },
  });

  // Fetch user's current stats for progress tracking
  const { data: userStats } = useQuery({
    queryKey: ['userStats', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      try {
        // Fetch games created
        const { count: gamesCreated } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', userId);

        // Fetch likes received (count likes on user's games)
        const { data: userGames } = await supabase
          .from('games')
          .select('id')
          .eq('creator_id', userId);
        
        const gameIds = userGames?.map(g => g.id) || [];
        const { count: likesReceived } = gameIds.length > 0
          ? await supabase
              .from('game_likes')
              .select('*', { count: 'exact', head: true })
              .in('game_id', gameIds)
          : { count: 0 };

        // Fetch followers
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);

        // Fetch remixes created
        const { count: remixesCreated } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', userId)
          .not('original_game_id', 'is', null);

        // Fetch comments made
        const { count: commentsMade } = await supabase
          .from('game_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const stats = {
          games_created: gamesCreated || 0,
          likes_received: likesReceived || 0,
          followers: followers || 0,
          remixes_created: remixesCreated || 0,
          comments_made: commentsMade || 0,
        };
        
        console.log('User stats fetched:', stats);
        return stats;
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
          games_created: 0,
          likes_received: 0,
          followers: 0,
          remixes_created: 0,
          comments_made: 0,
        };
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Check and unlock achievements
  const checkAchievementMutation = useMutation({
    mutationFn: async ({ 
      type, 
      value 
    }: { 
      type: string; 
      value: number 
    }) => {
      if (!userId) throw new Error('Not authenticated');

      // Find matching achievements
      const eligibleAchievements = achievements.filter(
        (a) => a.requirement_type === type && a.requirement_value <= value
      );

      const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
      const toUnlock = eligibleAchievements.filter((a) => !unlockedIds.has(a.id));

      if (toUnlock.length === 0) return [];

      // Unlock achievements
      const { data, error } = await supabase
        .from('user_achievements')
        .insert(
          toUnlock.map((a) => ({
            user_id: userId,
            achievement_id: a.id,
          }))
        )
        .select('*, achievement:achievements(*)');

      if (error) throw error;

      // Award coins
      const totalCoins = toUnlock.reduce((sum, a) => sum + a.coins_reward, 0);
      if (totalCoins > 0) {
        await supabase.rpc('increment_coins', {
          user_id: userId,
          amount: totalCoins,
        });
      }

      return { unlocked: data as UserAchievement[], coinsAwarded: totalCoins };
    },
    onSuccess: ({ unlocked, coinsAwarded }) => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      unlocked.forEach((ua) => {
        toast.success(`🏆 Achievement Unlocked: ${ua.achievement?.name}`, {
          description: `+${ua.achievement?.coins_reward} coins`,
        });
      });
    },
  });

  // Helper function to get current progress for an achievement
  const getProgress = (achievement: Achievement): number => {
    if (!userStats) return 0;
    return userStats[achievement.requirement_type as keyof typeof userStats] || 0;
  };

  return {
    achievements,
    userAchievements,
    unlockedCount: userAchievements.length,
    totalCount: achievements.length,
    checkAchievement: checkAchievementMutation.mutate,
    getProgress,
    userStats,
  };
};
