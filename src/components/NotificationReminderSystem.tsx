import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  isPushSupported,
  isSubscribed 
} from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

interface NotificationReminderSystemProps {
  // Different reminder strategies
  strategy?: 'gentle' | 'periodic' | 'achievement-based';
}

export const NotificationReminderSystem = ({ strategy = 'gentle' }: NotificationReminderSystemProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    const checkAndShowReminder = async () => {
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

        // Get reminder count for this user
        const reminderKey = `notification-reminder-count-${user.id}`;
        const storedCount = localStorage.getItem(reminderKey);
        const currentCount = storedCount ? parseInt(storedCount) : 0;
        setReminderCount(currentCount);

        // Don't show if user has seen too many reminders
        if (currentCount >= 3) return;

        // Check last reminder time
        const lastReminderKey = `notification-last-reminder-${user.id}`;
        const lastReminder = localStorage.getItem(lastReminderKey);
        
        if (lastReminder) {
          const lastReminderDate = new Date(lastReminder);
          const now = new Date();
          const hoursSinceLastReminder = (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60);
          
          // Different strategies for showing reminders
          let minHoursBetweenReminders = 24; // Default: once per day
          
          switch (strategy) {
            case 'gentle':
              minHoursBetweenReminders = 72; // Every 3 days
              break;
            case 'periodic':
              minHoursBetweenReminders = 24; // Every day
              break;
            case 'achievement-based':
              minHoursBetweenReminders = 48; // Every 2 days
              break;
          }
          
          if (hoursSinceLastReminder < minHoursBetweenReminders) return;
        }

        // Show reminder based on strategy
        let delay = 5000; // Default delay
        
        switch (strategy) {
          case 'gentle':
            delay = 15000; // Show after 15 seconds
            break;
          case 'periodic':
            delay = 8000; // Show after 8 seconds
            break;
          case 'achievement-based':
            // Only show after user has been active (e.g., liked or played games)
            delay = 12000;
            break;
        }

        setTimeout(() => {
          setIsVisible(true);
          
          // Update reminder count and last shown time
          localStorage.setItem(reminderKey, (currentCount + 1).toString());
          localStorage.setItem(lastReminderKey, new Date().toISOString());
        }, delay);
      } catch (error) {
        console.error('Error checking notification reminder:', error);
      }
    };

    checkAndShowReminder();
  }, [strategy]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        toast.success('🎉 Perfect! You\'ll now get notified about trending games and updates.');
        setIsVisible(false);
        
        // Clear reminder system since user enabled notifications
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.removeItem(`notification-reminder-count-${user.id}`);
          localStorage.removeItem(`notification-last-reminder-${user.id}`);
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

  const handleNeverShow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`notification-reminder-never-${user.id}`, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Different UI based on strategy
  const getReminderContent = () => {
    switch (strategy) {
      case 'gentle':
        return {
          title: "Quick reminder 💡",
          message: "Enable notifications to stay updated with trending games",
          icon: <Bell className="h-5 w-5" />
        };
      case 'periodic':
        return {
          title: "Don't miss out! 🔥",
          message: "New viral games are dropping daily - stay in the loop",
          icon: <Zap className="h-5 w-5" />
        };
      case 'achievement-based':
        return {
          title: "You're active! 🎮",
          message: "Since you love gaming, get alerts for the best new games",
          icon: <Bell className="h-5 w-5" />
        };
      default:
        return {
          title: "Stay updated",
          message: "Enable notifications for trending games",
          icon: <Bell className="h-5 w-5" />
        };
    }
  };

  const content = getReminderContent();

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-0.5">
            {content.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {content.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
              {content.message}
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleEnable}
                disabled={loading}
                size="sm"
                className="h-7 px-3 text-xs bg-purple-500 hover:bg-purple-600 text-white"
              >
                {loading ? 'Enabling...' : 'Enable'}
              </Button>
              
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
              >
                Later
              </Button>
            </div>
            
            {reminderCount >= 2 && (
              <button
                onClick={handleNeverShow}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2 underline"
              >
                Don't show again
              </button>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};