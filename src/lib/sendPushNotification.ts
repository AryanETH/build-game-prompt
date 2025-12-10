// Server-side push notification sender (for Supabase Edge Functions)
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

// Send push notification to a specific user
export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions?.length) {
      console.log('No push subscriptions found for user:', userId);
      return false;
    }

    // Send to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        sendPushToSubscription({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload)
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Sent ${successCount}/${subscriptions.length} notifications to user ${userId}`);
    
    return successCount > 0;
  } catch (error) {
    console.error('Error sending push to user:', error);
    return false;
  }
}

// Send push notification to all users
export async function sendPushToAllUsers(payload: NotificationPayload) {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error || !subscriptions?.length) {
      console.log('No push subscriptions found');
      return false;
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        sendPushToSubscription({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload)
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Sent ${successCount}/${subscriptions.length} notifications to all users`);
    
    return successCount > 0;
  } catch (error) {
    console.error('Error sending push to all users:', error);
    return false;
  }
}

// Send push to a specific subscription (this would typically be done server-side)
async function sendPushToSubscription(subscription: any, payload: NotificationPayload) {
  // This is a placeholder - in production, you'd call your backend API
  // that uses the web-push library to actually send the notification
  
  console.log('Would send push notification:', {
    subscription: subscription.endpoint,
    payload
  });
  
  // For now, we'll just resolve successfully
  return Promise.resolve();
}

// Predefined notification templates
export const NotificationTemplates = {
  newLike: (username: string, gameName: string): NotificationPayload => ({
    title: '❤️ New Like!',
    body: `${username} liked your game "${gameName}"`,
    tag: 'like',
    data: { type: 'like', username, gameName }
  }),

  newComment: (username: string, gameName: string): NotificationPayload => ({
    title: '💬 New Comment!',
    body: `${username} commented on your game "${gameName}"`,
    tag: 'comment',
    data: { type: 'comment', username, gameName }
  }),

  newFollower: (username: string): NotificationPayload => ({
    title: '👥 New Follower!',
    body: `${username} started following you`,
    tag: 'follow',
    data: { type: 'follow', username }
  }),

  gamePublished: (gameName: string): NotificationPayload => ({
    title: '🎮 Game Published!',
    body: `Your game "${gameName}" is now live!`,
    tag: 'publish',
    data: { type: 'publish', gameName }
  }),

  custom: (title: string, body: string, data?: any): NotificationPayload => ({
    title,
    body,
    tag: 'custom',
    data: { type: 'custom', ...data }
  })
};