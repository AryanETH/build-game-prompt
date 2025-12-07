import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Achievement, UserAchievement } from '@/types';

export const useUserAchievements = (targetUserId: string | null) => {
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
    queryKey: ['userAchievements', targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', targetUserId);

      if (error) throw error;
      return data as UserAchievement[];
    },
  });

  // Fetch user's current stats for progress tracking
  const { data: userStats } = useQuery({
    queryKey: ['userStats', targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      if (!targetUserId) return null;

      try {
        // Fetch games created
        const { count: gamesCreated } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', targetUserId);

        // Fetch likes received (count likes on user's games)
        const { data: userGames } = await supabase
          .from('games')
          .select('id')
          .eq('creator_id', targetUserId);
        
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
          .eq('following_id', targetUserId);

        // Fetch remixes created
        const { count: remixesCreated } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', targetUserId)
          .not('original_game_id', 'is', null);

        // Fetch comments made
        const { count: commentsMade } = await supabase
          .from('game_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId);

        const stats = {
          games_created: gamesCreated || 0,
          likes_received: likesReceived || 0,
          followers: followers || 0,
          remixes_created: remixesCreated || 0,
          comments_made: commentsMade || 0,
        };
        
        console.log(`User ${targetUserId} stats:`, stats);
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
    getProgress,
    userStats,
  };
};
