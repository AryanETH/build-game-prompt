import { supabase } from "@/integrations/supabase/client";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  content: string;
  username?: string;
  avatarUrl?: string;
  gameId?: string;
  gameTitle?: string;
  gameThumbnail?: string;
  commentId?: string;
  count?: number;
  milestone?: number;
  amount?: number;
}

export type NotificationType =
  // Engagement
  | 'like'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'share'
  | 'save'
  // Social
  | 'follow'
  | 'follow_back'
  // Content
  | 'play'
  | 'remix'
  // Performance
  | 'trending'
  | 'viral'
  | 'milestone'
  // Gamification
  | 'achievement'
  | 'badge'
  | 'level_up'
  // Monetization
  | 'gift'
  | 'monetization'
  | 'payout'
  // System
  | 'system'
  | 'warning'
  | 'success';

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const payload = {
      type: params.type,
      content: params.content,
      read: false,
      ...(params.username && { username: params.username }),
      ...(params.avatarUrl && { avatar_url: params.avatarUrl }),
      ...(params.gameId && { game_id: params.gameId }),
      ...(params.gameTitle && { game_title: params.gameTitle }),
      ...(params.gameThumbnail && { game_thumbnail: params.gameThumbnail }),
      ...(params.commentId && { comment_id: params.commentId }),
      ...(params.count && { count: params.count }),
      ...(params.milestone && { milestone: params.milestone }),
      ...(params.amount && { amount: params.amount }),
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        payload: payload,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

/**
 * Notification Templates - Pre-built notification creators
 */

export async function notifyGameLike(
  gameOwnerId: string,
  likerUsername: string,
  likerAvatar: string,
  likerId: string,
  gameId: string,
  gameTitle: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'like',
    content: 'liked your game',
    username: likerUsername,
    avatarUrl: likerAvatar,
    gameId,
    gameTitle,
    gameThumbnail,
  });
}

export async function notifyGameComment(
  gameOwnerId: string,
  commenterUsername: string,
  commenterAvatar: string,
  commenterId: string,
  gameId: string,
  gameTitle: string,
  commentId: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'comment',
    content: 'commented on your game',
    username: commenterUsername,
    avatarUrl: commenterAvatar,
    gameId,
    gameTitle,
    commentId,
    gameThumbnail,
  });
}

export async function notifyCommentReply(
  commentOwnerId: string,
  replierUsername: string,
  replierAvatar: string,
  replierId: string,
  gameId: string,
  gameTitle: string,
  commentId: string
) {
  return createNotification({
    userId: commentOwnerId,
    type: 'reply',
    content: 'replied to your comment',
    username: replierUsername,
    avatarUrl: replierAvatar,
    gameId,
    gameTitle,
    commentId,
  });
}

export async function notifyCommentLike(
  commentOwnerId: string,
  likerUsername: string,
  likerAvatar: string,
  likerId: string,
  gameId: string,
  gameTitle: string,
  commentId: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: commentOwnerId,
    type: 'like',
    content: 'liked your comment',
    username: likerUsername,
    avatarUrl: likerAvatar,
    gameId,
    gameTitle,
    commentId,
    gameThumbnail,
  });
}

export async function notifyGameMention(
  gameOwnerId: string,
  mentionerUsername: string,
  mentionerAvatar: string,
  mentionerId: string,
  gameId: string,
  gameTitle: string,
  commentId: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'mention',
    content: 'mentioned your game',
    username: mentionerUsername,
    avatarUrl: mentionerAvatar,
    gameId,
    gameTitle,
    commentId,
    gameThumbnail,
  });
}

export async function notifyMention(
  mentionedUserId: string,
  mentionerUsername: string,
  mentionerAvatar: string,
  mentionerId: string,
  gameId: string,
  gameTitle: string,
  commentId?: string
) {
  return createNotification({
    userId: mentionedUserId,
    type: 'mention',
    content: 'mentioned you in a comment',
    username: mentionerUsername,
    avatarUrl: mentionerAvatar,
    gameId,
    gameTitle,
    commentId,
  });
}

export async function notifyNewFollower(
  followedUserId: string,
  followerUsername: string,
  followerAvatar: string,
  followerId: string
) {
  return createNotification({
    userId: followedUserId,
    type: 'follow',
    content: 'started following you',
    username: followerUsername,
    avatarUrl: followerAvatar,
  });
}

export async function notifyFollowBack(
  userId: string,
  username: string,
  avatarUrl: string
) {
  return createNotification({
    userId,
    type: 'follow_back',
    content: 'followed you back',
    username,
    avatarUrl,
  });
}

export async function notifyGamePlay(
  gameOwnerId: string,
  playerUsername: string,
  playerAvatar: string,
  playerId: string,
  gameId: string,
  gameTitle: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'play',
    content: 'played your game',
    username: playerUsername,
    avatarUrl: playerAvatar,
    gameId,
    gameTitle,
    gameThumbnail,
  });
}

export async function notifyGameRemix(
  gameOwnerId: string,
  remixerUsername: string,
  remixerAvatar: string,
  remixerId: string,
  originalGameId: string,
  originalGameTitle: string,
  newGameId: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'remix',
    content: 'remixed your game',
    username: remixerUsername,
    avatarUrl: remixerAvatar,
    gameId: originalGameId,
    gameTitle: originalGameTitle,
  });
}

export async function notifyGameShare(
  gameOwnerId: string,
  sharerUsername: string,
  sharerAvatar: string,
  sharerId: string,
  gameId: string,
  gameTitle: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'share',
    content: 'shared your game',
    username: sharerUsername,
    avatarUrl: sharerAvatar,
    gameId,
    gameTitle,
    gameThumbnail,
  });
}

export async function notifyGameSave(
  gameOwnerId: string,
  saverUsername: string,
  saverAvatar: string,
  saverId: string,
  gameId: string,
  gameTitle: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId: gameOwnerId,
    type: 'save',
    content: 'saved your game',
    username: saverUsername,
    avatarUrl: saverAvatar,
    gameId,
    gameTitle,
    gameThumbnail,
  });
}

// Performance Notifications

export async function notifyGameTrending(
  userId: string,
  gameId: string,
  gameTitle: string,
  gameThumbnail?: string
) {
  return createNotification({
    userId,
    type: 'trending',
    content: 'Your game is trending! 🔥',
    gameId,
    gameTitle,
    gameThumbnail,
  });
}

export async function notifyGameViral(
  userId: string,
  gameId: string,
  gameTitle: string,
  views: number,
  gameThumbnail?: string
) {
  return createNotification({
    userId,
    type: 'viral',
    content: `Your game went viral! ${views.toLocaleString()} views 🚀`,
    gameId,
    gameTitle,
    gameThumbnail,
    count: views,
  });
}

export async function notifyMilestone(
  userId: string,
  milestoneType: 'likes' | 'plays' | 'followers' | 'views',
  count: number,
  gameId?: string,
  gameTitle?: string
) {
  const milestoneMessages = {
    likes: `Your game reached ${count.toLocaleString()} likes! ❤️`,
    plays: `Your game reached ${count.toLocaleString()} plays! 🎮`,
    followers: `You reached ${count.toLocaleString()} followers! 🎉`,
    views: `Your game reached ${count.toLocaleString()} views! 👀`,
  };

  return createNotification({
    userId,
    type: 'milestone',
    content: milestoneMessages[milestoneType],
    milestone: count,
    gameId,
    gameTitle,
  });
}

// Gamification Notifications

export async function notifyAchievementUnlocked(
  userId: string,
  achievementName: string,
  achievementIcon?: string
) {
  return createNotification({
    userId,
    type: 'achievement',
    content: `Achievement unlocked: ${achievementName}! 🏆`,
  });
}

export async function notifyBadgeEarned(
  userId: string,
  badgeName: string
) {
  return createNotification({
    userId,
    type: 'badge',
    content: `You earned the ${badgeName} badge! ⭐`,
  });
}

export async function notifyLevelUp(
  userId: string,
  newLevel: number
) {
  return createNotification({
    userId,
    type: 'level_up',
    content: `Level up! You're now level ${newLevel}! ⚡`,
    milestone: newLevel,
  });
}

// Monetization Notifications

export async function notifyGiftReceived(
  userId: string,
  gifterUsername: string,
  gifterAvatar: string,
  giftName: string,
  giftValue: number
) {
  return createNotification({
    userId,
    type: 'gift',
    content: `sent you a ${giftName}`,
    username: gifterUsername,
    avatarUrl: gifterAvatar,
    amount: giftValue,
  });
}

export async function notifyMonetizationEligible(
  userId: string
) {
  return createNotification({
    userId,
    type: 'monetization',
    content: 'Your game is now eligible for monetization! 💰',
  });
}

export async function notifyPayoutCompleted(
  userId: string,
  amount: number
) {
  return createNotification({
    userId,
    type: 'payout',
    content: `Payout completed: $${amount.toFixed(2)} 💵`,
    amount,
  });
}

// System Notifications

export async function notifySystemMessage(
  userId: string,
  message: string
) {
  return createNotification({
    userId,
    type: 'system',
    content: message,
  });
}

export async function notifyWarning(
  userId: string,
  message: string
) {
  return createNotification({
    userId,
    type: 'warning',
    content: message,
  });
}

export async function notifySuccess(
  userId: string,
  message: string
) {
  return createNotification({
    userId,
    type: 'success',
    content: message,
  });
}

/**
 * Batch notification creation for grouped notifications
 */
export async function createBatchNotifications(notifications: CreateNotificationParams[]) {
  try {
    const notificationData = notifications.map(params => ({
      user_id: params.userId,
      payload: {
        type: params.type,
        content: params.content,
        read: false,
        ...(params.username && { username: params.username }),
        ...(params.avatarUrl && { avatar_url: params.avatarUrl }),
        ...(params.gameId && { game_id: params.gameId }),
        ...(params.gameTitle && { game_title: params.gameTitle }),
        ...(params.gameThumbnail && { game_thumbnail: params.gameThumbnail }),
        ...(params.commentId && { comment_id: params.commentId }),
        ...(params.count && { count: params.count }),
        ...(params.milestone && { milestone: params.milestone }),
        ...(params.amount && { amount: params.amount }),
      },
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating batch notifications:', error);
    return { data: null, error };
  }
}
