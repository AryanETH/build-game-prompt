import { toast } from 'sonner';
import { subscribeToPush, isPushSupported } from './pushNotifications';

// Function to prompt for notifications after successful signup
export const promptForNotificationsAfterSignup = async (): Promise<void> => {
  // Wait a bit for the user to settle in
  setTimeout(async () => {
    try {
      // Check if push is supported
      if (!isPushSupported()) {
        console.log('Push notifications not supported');
        return;
      }

      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        // Auto-subscribe if permission already granted
        await subscribeToPush();
        toast.success('🎉 Notifications enabled! You\'ll get updates about trending games.');
        return;
      }

      // Check if permission was denied
      if (Notification.permission === 'denied') {
        console.log('Notification permission denied');
        return;
      }

      // Show a friendly toast asking for permission
      toast('🎮 Welcome to Oplus!', {
        description: 'Enable notifications to never miss viral games and updates.',
        action: {
          label: '🔔 Enable',
          onClick: async () => {
            try {
              const subscription = await subscribeToPush();
              if (subscription) {
                toast.success('🎉 Perfect! You\'ll now get notified about trending games and updates.');
              }
            } catch (error) {
              console.error('Failed to enable notifications:', error);
              toast.error('Failed to enable notifications. You can try again later in settings.');
            }
          },
        },
        duration: 10000, // Show for 10 seconds
      });
    } catch (error) {
      console.error('Error prompting for notifications:', error);
    }
  }, 3000); // 3 second delay after signup to let user settle in
};

// Function to show a welcome notification after enabling
export const showWelcomeNotification = (): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Welcome to Oplus! 🎮', {
      body: 'You\'re all set! Start exploring amazing games created by our community.',
      icon: '/Oplus only.png',
      image: '/Oplus full logo.png',
      tag: 'welcome'
    });
  }
};