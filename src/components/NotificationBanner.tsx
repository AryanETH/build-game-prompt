import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  isPushSupported,
  isSubscribed 
} from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

export const NotificationBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAndShowBanner = async () => {
      try {
        // Don't show if push is not supported
        if (!isPushSupported()) return;

        // Don't show if already subscribed
        const subscribed = await isSubscribed();
        if (subscribed) return;

        // Don't show if permission already denied
        if (Notification.permission === 'denied') return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user has dismissed this banner
        const dismissed = localStorage.getItem(`notification-banner-dismissed-${user.id}`);
        if (dismissed) return;

        // Show for all users who haven't enabled notifications
        setIsVisible(true);
      } catch (error) {
        console.error('Error checking notification banner:', error);
      }
    };

    checkAndShowBanner();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        toast.success('🎉 Notifications enabled! You\'ll now get updates about trending games.');
        setIsVisible(false);
      } else {
        toast.error('Failed to enable notifications. Please try again.');
      }
    } catch (error) {
      console.error('Permission error:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`notification-banner-dismissed-${user.id}`, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/20 rounded-full">
          <Bell className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Stay Updated!</h3>
          <p className="text-white/90 text-sm">
            Enable notifications to get alerts about viral games and new features.
          </p>
        </div>
        
        <Button
          onClick={handleEnable}
          disabled={loading}
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-0"
        >
          {loading ? 'Enabling...' : 'Enable'}
        </Button>
      </div>
    </div>
  );
};