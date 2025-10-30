import { supabase } from '@/integrations/supabase/client';
import { type User } from '@supabase/supabase-js';

export function setupRealtimeSubscriptions(user: User, onMessage: (payload: any) => void) {
  console.log('Setting up real-time subscriptions for user:', user.id);

  const presenceChannel = supabase.channel('presence:global', {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      console.log('presence sync', presenceChannel.presenceState());
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('presence join', { key, newPresences });
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('presence leave', { key, leftPresences });
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });

  const dmChannel = supabase.channel(`user:${user.id}:messages`);
  dmChannel
    .on('broadcast', { event: 'message' }, (msg) => {
      console.log('direct message received', msg);
      onMessage(msg.payload);
    })
    .subscribe();

  const notificationsChannel = supabase.channel(`user:${user.id}:notifications`);
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User must be logged in to send direct messages.');
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert([
      {
        sender_id: session.user.id,
        recipient_id: recipientId,
        content: content,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error sending direct message:', error);
    return { data, error };
  }
  
  if (data) {
    const channel = supabase.channel(`user:${recipientId}:messages`);
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: { ...data },
    });
  }

  return { data, error };
}

export async function sendNotification(targetUserId: string, payload: object) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: targetUserId,
        payload: payload as any,
      },
    ]);
  if (error) console.error('Error sending notification:', error);
  return { data, error };
}
