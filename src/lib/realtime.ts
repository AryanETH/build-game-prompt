import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export function setupRealtimeSubscriptions(user: User) {
  console.log('Setting up real-time subscriptions for user:', user.id);

  // Presence channel
  const presenceChannel = supabase.channel('presence:global', { config: { private: true } });
  presenceChannel
    .on('broadcast', { event: 'presence_update' }, (payload) => {
      console.log('presence update', payload);
    })
    .subscribe();

  // User-specific channel for direct messages
  const dmChannel = supabase.channel(`user:${user.id}:messages`, { config: { private: true } });
  dmChannel
    .on('broadcast', { event: '*' }, (msg) => {
      console.log('direct message received', msg);
    })
    .subscribe();

  // User-specific channel for notifications
  const notificationsChannel = supabase.channel(`user:${user.id}:notifications`, { config: { private: true } });
  notificationsChannel
    .on('broadcast', { event: '*' }, (msg) => {
      console.log('notification', msg);
    })
    .subscribe();

  const cleanup = () => {
    console.log('Cleaning up real-time subscriptions');
    supabase.removeChannel(presenceChannel);
    supabase.removeChannel(dmChannel);
    supabase.removeChannel(notificationsChannel);
  };

  return cleanup;
}

export async function sendDirectMessage(recipientId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be logged in to send direct messages.');
  }
  const { data, error } = await supabase
    .from('direct_messages')
    .insert([
      {
        sender_id: user.id,
        recipient_id: recipientId,
        content: content
      }
    ]);
  if (error) console.error('Error sending direct message:', error);
  return { data, error };
}

export async function sendNotification(targetUserId: string, payload: object) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: targetUserId,
        payload: payload
      }
    ]);
  if (error) console.error('Error sending notification:', error);
  return { data, error };
}
