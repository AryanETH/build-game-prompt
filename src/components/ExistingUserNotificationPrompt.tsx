import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, X, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  isPushSupported,
  isSubscribed 
} from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

export const ExistingUserNotificationPrompt = () => {
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user is existing (created account more than 24 hours ago)
        const userCreatedAt = new Date(user.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);

        // Only show for existing users (more than 24 hours old)
        if (hoursSinceCreation <= 24) return;

        // Check if we've already shown this to the user recently
        const lastShown = localStorage.getItem(`existing-user-notification-prompt-${user.id}`);
        if (lastShown) {
          const lastShownDate = new Date(lastShown);
          const daysSinceLastShown = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
          
          // Only show again after 7 days
          if (daysSinceLastShown < 7) return;
        }

        // Show after user has been active for a bit
        setTimeout(() => {
          setIsVisible(true);
          // Mark as shown
          localStorage.setItem(`existing-user-notification-prompt-${user.id}`, now.toISOString());
        }, 10000); // Show after 10 seconds of activity
      } catch (error) {
        console.error('Error checking existing user notification prompt:', error);
      }
    };

    checkAndShowPrompt();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        toast.success('🎉 Awesome! You\'ll now get notified about trending games and updates.');
        setIsVisible(false);
        
        // Mark as permanently handled
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.setItem(`existing-user-notification-enabled-${user.id}`, 'true');
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

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header with gradient accent */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl p-4 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Don't Miss Out!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  New viral games are dropping daily
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-0">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-gray-700 dark:text-gray-300">Get alerts for trending games</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">Never miss new features</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEnable}
              disabled={loading}
              size="sm"
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
            >
              {loading ? 'Enabling...' : '🔔 Enable'}
            </Button>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="px-3"
            >
              Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            You can disable anytime in settings
          </p>
        </div>
      </div>
    </div>
  );
};