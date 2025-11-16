import { useState, useEffect } from 'react';

/**
 * Hook to format timestamps as relative time (e.g., "2m", "5h", "3d")
 * Updates every minute for live tracking
 */
export const useTimeAgo = (dateString: string) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const date = new Date(dateString);
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 60) {
        setTimeAgo(`${seconds}s`);
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)}m`);
      } else if (seconds < 86400) {
        setTimeAgo(`${Math.floor(seconds / 3600)}h`);
      } else if (seconds < 31536000) {
        setTimeAgo(`${Math.floor(seconds / 86400)}d`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 31536000)}y`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dateString]);

  return timeAgo;
};

/**
 * Static version without live updates (better performance)
 */
export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${days}d`;
  const years = Math.floor(days / 365);
  return `${years}y`;
};
