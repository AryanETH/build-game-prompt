// Server-side push notification sender (for Supabase Edge Functions)
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string; // Large image in notification
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
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
      return { success: false, sent: 0, total: 0 };
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
    
    return { 
      success: successCount > 0, 
      sent: successCount, 
      total: subscriptions.length 
    };
  } catch (error) {
    console.error('Error sending push to all users:', error);
    return { success: false, sent: 0, total: 0 };
  }
}

// Send push notification to selected users
export async function sendPushToSelectedUsers(userIds: string[], payload: NotificationPayload) {
  try {
    if (userIds.length === 0) {
      return { success: false, sent: 0, total: 0, message: 'No users selected' };
    }

    // Get subscriptions for selected users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return { success: false, sent: 0, total: 0, message: 'Database error' };
    }

    if (!subscriptions?.length) {
      return { 
        success: false, 
        sent: 0, 
        total: 0, 
        message: 'None of the selected users have push notifications enabled' 
      };
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
    console.log(`Sent ${successCount}/${subscriptions.length} notifications to selected users`);
    
    return { 
      success: successCount > 0, 
      sent: successCount, 
      total: subscriptions.length,
      selectedCount: userIds.length
    };
  } catch (error) {
    console.error('Error sending push to selected users:', error);
    return { success: false, sent: 0, total: 0, message: 'Send failed' };
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

// Predefined notification templates with Oplus branding
export const NotificationTemplates = {
  newLike: (username: string, gameName: string, gameImage?: string): NotificationPayload => ({
    title: '❤️ New Like!',
    body: `${username} liked your game "${gameName}"`,
    icon: '/Oplus only.png',
    badge: '/Oplus only.png',
    image: gameImage, // Game thumbnail as large image
    tag: 'like',
    data: { type: 'like', username, gameName },
    actions: [
      { action: 'view', title: '👀 View Game' },
      { action: 'close', title: '✕ Close' }
    ]
  }),

  newComment: (username: string, gameName: string, gameImage?: string): NotificationPayload => ({
    title: '💬 New Comment!',
    body: `${username} commented on your game "${gameName}"`,
    icon: '/Oplus only.png',
    badge: '/Oplus only.png',
    image: gameImage,
    tag: 'comment',
    data: { type: 'comment', username, gameName },
    actions: [
      { action: 'reply', title: '💬 Reply' },
      { action: 'view', title: '👀 View' }
    ]
  }),

  newFollower: (username: string, userAvatar?: string): NotificationPayload => ({
    title: '👥 New Follower!',
    body: `${username} started following you`,
    icon: '/Oplus only.png',
    badge: '/Oplus only.png',
    image: userAvatar, // User's avatar as large image
    tag: 'follow',
    data: { type: 'follow', username },
    actions: [
      { action: 'follow_back', title: '👥 Follow Back' },
      { action: 'view_profile', title: '👤 View Profile' }
    ]
  }),

  gamePublished: (gameName: string, gameImage?: string): NotificationPayload => ({
    title: '🎮 Game Published!',
    body: `Your game "${gameName}" is now live!`,
    icon: '/Oplus only.png',
    badge: '/Oplus only.png',
    image: gameImage,
    tag: 'publish',
    data: { type: 'publish', gameName },
    actions: [
      { action: 'share', title: '📤 Share' },
      { action: 'view', title: '🎮 Play' }
    ]
  }),

  broadcast: (title: string, body: string, image?: string): NotificationPayload => ({
    title: `📢 ${title}`,
    body,
    icon: '/Oplus full logo.png', // Use full logo for broadcasts
    badge: '/Oplus only.png',
    image,
    tag: 'broadcast',
    data: { type: 'broadcast' },
    actions: [
      { action: 'open', title: '🚀 Open App' },
      { action: 'close', title: '✕ Close' }
    ]
  }),

  custom: (title: string, body: string, options?: { image?: string; data?: any }): NotificationPayload => ({
    title,
    body,
    icon: '/Oplus only.png',
    badge: '/Oplus only.png',
    image: options?.image,
    tag: 'custom',
    data: { type: 'custom', ...options?.data },
    actions: [
      { action: 'open', title: '🚀 Open' },
      { action: 'close', title: '✕ Close' }
    ]
  })
};