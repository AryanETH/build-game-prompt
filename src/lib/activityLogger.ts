import { supabase } from "@/integrations/supabase/client";

type ActivityType = 'game_published' | 'game_creating' | 'game_liked' | 'user_followed';

interface LogActivityParams {
  type: ActivityType;
  gameId?: string;
  targetUserId?: string;
  metadata?: any;
}

export const logActivity = async ({ type, gameId, targetUserId, metadata = {} }: LogActivityParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: type,
      game_id: gameId || null,
      target_user_id: targetUserId || null,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
