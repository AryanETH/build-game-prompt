import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, X, Sparkles, Zap, GamepadIcon, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  isPushSupported,
  isSubscribed 
} from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

interface NotificationOnboardingProps {
  trigger?: 'signup' | 'action' | 'early';
  onComplete?: () => void;
}

export const NotificationOnboarding = ({ trigger = 'signup', onComplete }: NotificationOnboardingProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const checkAndShowOnboarding = async () => {
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

        // Check if user already went through onboarding
        const onboardingKey = `notification-onboarding-${user.id}`;
        const completed = localStorage.getItem(onboardingKey);
        if (completed) return;

        // Show based on trigger type
        let shouldShow = false;
        let delay = 1000;

        switch (trigger) {
          case 'signup':
            // Show for new users (within 1 hour of signup)
            const userCreatedAt = new Date(user.created_at);
            const now = new Date();
            const hoursSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);
            shouldShow = hoursSinceCreation <= 1;
            delay = 3000;
            break;
          case 'early':
            // Show for users within 24 hours
            const userCreatedAt2 = new Date(user.created_at);
            const now2 = new Date();
            const hoursSinceCreation2 = (now2.getTime() - userCreatedAt2.getTime()) / (1000 * 60 * 60);
            shouldShow = hoursSinceCreation2 <= 24;
            delay = 2000;
            break;
          case 'action':
            // Show after user performs actions
            shouldShow = true;
            delay = 1500;
            break;
        }

        if (shouldShow) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      } catch (error) {
        console.error('Error checking notification onboarding:', error);
      }
    };

    checkAndShowOnboarding();
  }, [trigger]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        // Mark onboarding as completed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.setItem(`notification-onboarding-${user.id}`, 'completed');
        }

        toast.success('🎉 Awesome! You\'ll now get notified about the best games and updates.');
        setIsVisible(false);
        onComplete?.();
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

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`notification-onboarding-${user.id}`, 'skipped');
    }
    setIsVisible(false);
    onComplete?.();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 text-center">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {step === 1 && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <GamepadIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Never Miss a Hit Game!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get instant alerts when viral games drop and trending creators publish new content.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Stay Ahead of Trends
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to discover breakthrough games before they explode across social media.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ready to Enable?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Join thousands of gamers who never miss the next big thing. Enable notifications now!
              </p>
            </div>
          )}
        </div>

        {/* Features showcase */}
        <div className="px-6 pb-6">
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Viral Game Alerts</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Get notified when games are trending</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Creator Updates</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Follow your favorite game creators</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Feature Updates</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs">New tools and improvements</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {step < 3 ? (
              <>
                <Button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                >
                  Next
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="px-6"
                >
                  Skip
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                >
                  {loading ? 'Enabling...' : '🔔 Enable Notifications'}
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="px-4"
                >
                  Maybe Later
                </Button>
              </>
            )}
          </div>

          {step === 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              You can change this anytime in your browser settings
            </p>
          )}
        </div>
      </div>
    </div>
  );
};