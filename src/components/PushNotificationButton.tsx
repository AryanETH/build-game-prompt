import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  unsubscribeFromPush, 
  isSubscribed, 
  isPushSupported,
  showLocalNotification 
} from '@/lib/pushNotifications';

export const PushNotificationButton = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setSupported(isPushSupported());
    
    // Check current subscription status
    if (isPushSupported()) {
      isSubscribed().then(setSubscribed);
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        setSubscribed(true);
        toast.success('Push notifications enabled!');
        
        // Show a test notification
        showLocalNotification('Welcome!', {
          body: 'You will now receive push notifications',
          icon: '/notification-icon.svg'
        });
      } else {
        toast.error('Failed to enable notifications');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setSubscribed(false);
        toast.success('Push notifications disabled');
      } else {
        toast.error('Failed to disable notifications');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = () => {
    showLocalNotification('Test Notification', {
      body: 'This is a test notification from your game app!',
      icon: '/notification-icon.svg',
      tag: 'test'
    });
  };

  if (!supported) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        variant={subscribed ? "outline" : "default"}
        className="flex items-center gap-2"
      >
        {subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {loading ? 'Loading...' : subscribed ? 'Disable Notifications' : 'Enable Notifications'}
      </Button>
      
      {subscribed && (
        <Button
          onClick={handleTestNotification}
          variant="secondary"
          size="sm"
        >
          Test Notification
        </Button>
      )}
    </div>
  );
};