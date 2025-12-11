import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, BellOff, Check, AlertCircle, Smartphone, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { 
  subscribeToPush, 
  unsubscribeFromPush,
  isSubscribed, 
  isPushSupported,
  getPushSupportDetails,
  showLocalNotification,
  testDatabaseAccess 
} from '@/lib/pushNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

export const NotificationSettings = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [supportDetails, setSupportDetails] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      setCheckingStatus(true);
      
      // Check if push notifications are supported
      const details = getPushSupportDetails();
      setSupported(details.isSupported);
      setSupportDetails(details);
      
      // Check current subscription status
      if (details.isSupported) {
        const currentlySubscribed = await isSubscribed();
        setSubscribed(currentlySubscribed);
      }
      
      setCheckingStatus(false);
    };

    checkNotificationStatus();
  }, []);

  const handleToggleNotifications = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPush();
        if (success) {
          setSubscribed(false);
          toast.success('Notifications disabled');
        } else {
          toast.error('Failed to disable notifications');
        }
      } else {
        // Test database access first
        console.log('Testing database access before subscription...');
        const dbTest = await testDatabaseAccess();
        if (!dbTest.success) {
          console.error('Database access test failed:', dbTest.error);
          toast.error(`Database error: ${dbTest.error}`);
          return;
        }

        // Subscribe
        const subscription = await subscribeToPush();
        if (subscription) {
          setSubscribed(true);
          toast.success('Notifications enabled!');
          
          // Show a test notification
          setTimeout(() => {
            showLocalNotification('Notifications Enabled! 🎉', {
              body: 'You\'ll now get alerts about trending games and updates',
              icon: '/Oplus only.png',
              image: '/Oplus full logo.png'
            });
          }, 1000);
        } else {
          toast.error('Failed to enable notifications. Check console for details.');
        }
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update notification settings: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (subscribed) {
      showLocalNotification('🎮 Test from Oplus!', {
        body: 'This is a test notification from your game app!',
        icon: '/Oplus only.png',
        image: '/Oplus full logo.png',
        tag: 'test'
      });
      toast.success('Test notification sent!');
    }
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Checking notification status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about trending games, new features, and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Enable Notifications</span>
              {subscribed && <Badge variant="secondary" className="text-xs">Active</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {subscribed 
                ? 'You\'ll receive notifications about trending games and updates'
                : 'Enable to get alerts about viral games and new features'
              }
            </p>
          </div>
          
          <Switch
            checked={subscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={loading || !supported}
          />
        </div>

        {/* Support Status */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Browser Support</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              {supportDetails?.isSecure ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>HTTPS Connection</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {supportDetails?.hasServiceWorker ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Service Worker</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {supportDetails?.hasPushManager ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Push Manager</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {supportDetails?.hasNotification ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Notifications API</span>
            </div>
          </div>
        </div>

        {/* Browser Permission Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Permission Status</h4>
          <div className="flex items-center gap-2">
            {typeof Notification !== 'undefined' && Notification.permission === 'granted' && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Permission granted</span>
              </>
            )}
            {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Permission denied - please enable in browser settings</span>
              </>
            )}
            {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">Permission not requested yet</span>
              </>
            )}
            {typeof Notification === 'undefined' && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Notifications not supported in this browser</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleToggleNotifications}
            disabled={loading || !supported}
            className="flex-1"
            variant={subscribed ? "outline" : "default"}
          >
            {loading ? (
              'Loading...'
            ) : subscribed ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Disable
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enable
              </>
            )}
          </Button>
          
          {subscribed && (
            <Button
              onClick={handleTestNotification}
              variant="secondary"
              size="sm"
            >
              Test
            </Button>
          )}
        </div>

        {/* Help Text */}
        {!supported && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Notifications not supported
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Try using Chrome, Firefox, or Safari on HTTPS. Some browsers block notifications in private/incognito mode.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What you'll receive */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">What you'll receive:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Alerts when games go viral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>New feature announcements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Updates from creators you follow</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};