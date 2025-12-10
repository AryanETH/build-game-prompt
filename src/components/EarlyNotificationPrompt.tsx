import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, X, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  isPushSupported,
  isSubscribed 
} from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

export const EarlyNotificationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAndShowPrompt = async () => {
      try {
        // Don't show if push is not supported
        if (!isPushSupported()) return;

        // Don't show if already subscribed
        const subscribed = await isSubscribed();
        if (subscribed) return;

        // Don't show if permission already denied
        if (Notification.permission === 'denied') return;

        // Check if user is new (created account in last 24 hours)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userCreatedAt = new Date(user.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);

        // Show for users who created account in last 24 hours
        if (hoursSinceCreation > 24) return;

        // Don't show if user already dismissed this
        const dismissed = localStorage.getItem(`notification-prompt-dismissed-${user.id}`);
        if (dismissed) return;

        // Show after a short delay
        setTimeout(() => {
          setIsVisible(true);
        }, 2000);
      } catch (error) {
        console.error('Error checking notification prompt:', error);
      }
    };

    checkAndShowPrompt();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        toast.success('🎉 Perfect! You\'ll now get notified about trending games and updates.');
        setIsVisible(false);
        
        // Mark as handled
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.setItem(`notification-prompt-dismissed-${user.id}`, 'allowed');
        }
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
    setIsVisible(false);
    
    // Mark as dismissed
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`notification-prompt-dismissed-${user.id}`, 'dismissed');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in slide-in-from-top-4 duration-500">
        <div className="p-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-full">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold">Stay Updated!</h3>
          </div>
          
          <p className="text-white/90 text-xs mb-3">
            Get instant alerts for viral games and new features
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleAllow}
              disabled={loading}
              size="sm"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-8"
            >
              {loading ? 'Enabling...' : '🔔 Enable'}
            </Button>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/10 text-xs h-8 px-3"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};