import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineIndicatorProps {
  userId: string;
  className?: string;
}

export const OnlineIndicator = ({ userId, className = "w-3 h-3" }: OnlineIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const presenceChannel = supabase.channel('presence:global');
    
    const updatePresence = () => {
      const presenceState = presenceChannel.presenceState();
      const userPresence = presenceState[userId];
      setIsOnline(!!userPresence && userPresence.length > 0);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === userId) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === userId) setIsOnline(false);
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') updatePresence();
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  if (!isOnline) return null;

  return (
    <div 
      className={`bg-green-500 rounded-full border-2 border-background ${className}`}
      title="Online"
    />
  );
};
