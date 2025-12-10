import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Bell, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  isPushSupported,
  requestNotificationPermission,
  isSubscribed,
  testDatabaseAccess 
} from '@/lib/pushNotifications';

interface NotificationPermissionPromptProps {
  onClose?: () => void;
}

export const NotificationPermissionPrompt = ({ onClose }: NotificationPermissionPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAndShowPrompt = async () => {
      // Don't show if push is not supported
      if (!isPushSupported()) return;

      // Don't show if already subscribed
      const subscribed = await isSubscribed();
      if (subscribed) return;

      // Don't show if permission already denied
      if (Notification.permission === 'denied') return;

      // Don't show if user already dismissed this session
      const dismissed = sessionStorage.getItem('notification-prompt-dismissed');
      if (dismissed) return;

      // Show after a short delay to not be intrusive
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    checkAndShowPrompt();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      // First test database access
      console.log('Testing database access before subscription...');
      const dbTest = await testDatabaseAccess();
      if (!dbTest.success) {
        console.error('Database access test failed:', dbTest.error);
        toast.error(`Database error: ${dbTest.error}`);
        return;
      }

      console.log('Database access OK, proceeding with subscription...');
      const subscription = await subscribeToPush();
      
      if (subscription) {
        toast.success('🔔 Notifications enabled! Stay updated with the latest games and updates.');
        setIsVisible(false);
        onClose?.();
      } else {
        toast.error('Failed to enable notifications. Check console for details.');
      }
    } catch (error) {
      console.error('Permission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to enable notifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-full">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Stay in the Loop!</h3>
          </div>
          
          <p className="text-white/90 text-sm">
            Get notified about new games, updates, and exciting features on Oplus
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-0.5">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">New Game Alerts</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Be the first to play trending games</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mt-0.5">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Feature Updates</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Stay updated with new features and improvements</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAllow}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
            >
              {loading ? 'Enabling...' : 'Allow Notifications'}
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="px-4"
            >
              Not Now
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            You can change this anytime in your browser settings
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook for triggering notification prompt after user actions
export const useNotificationPrompt = () => {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  const triggerAfterAction = useCallback(async (action?: string) => {
    // Don't show if push is not supported
    if (!isPushSupported()) return;

    // Don't show if already subscribed
    const subscribed = await isSubscribed();
    if (subscribed) return;

    // Don't show if permission already denied
    if (Notification.permission === 'denied') return;

    // Don't show if user already dismissed this session
    const dismissed = sessionStorage.getItem('notification-prompt-dismissed');
    if (dismissed) return;

    // Show after user performs an action (like, comment, play game)
    // Add a small delay to not interrupt the user's flow
    setTimeout(() => {
      setShouldPrompt(true);
    }, 1000);
  }, []);

  const handleClose = useCallback(() => {
    setShouldPrompt(false);
  }, []);

  return {
    triggerAfterAction,
    shouldPrompt,
    PromptComponent: shouldPrompt ? () => <NotificationPermissionPrompt onClose={handleClose} /> : null
  };
};