import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  isPushSupported, 
  getPushSupportDetails, 
  testDatabaseAccess,
  subscribeToPush,
  isSubscribed 
} from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

export const NotificationDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // Check browser support
      info.browserSupport = getPushSupportDetails();
      
      // Check current permission
      info.notificationPermission = Notification.permission;
      
      // Check if currently subscribed
      info.currentlySubscribed = await isSubscribed();
      
      // Test database access
      info.databaseTest = await testDatabaseAccess();
      
      // Check user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      info.userAuth = {
        authenticated: !!user,
        userId: user?.id,
        error: userError?.message
      };

      // Check if push_subscriptions table exists and is accessible
      try {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('count(*)', { count: 'exact', head: true });
        
        info.tableAccess = {
          accessible: !error,
          error: error?.message,
          count: data?.length || 0
        };
      } catch (e) {
        info.tableAccess = {
          accessible: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }

      // Check service worker registration
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        info.serviceWorker = {
          registered: !!registration,
          scope: registration?.scope,
          state: registration?.active?.state
        };
      } catch (e) {
        info.serviceWorker = {
          registered: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Diagnostics error:', error);
      info.error = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(info);
    } finally {
      setLoading(false);
    }
  };

  const testSubscription = async () => {
    setLoading(true);
    try {
      console.log('Testing subscription process...');
      const result = await subscribeToPush();
      console.log('Subscription result:', result);
      
      if (result) {
        alert('Subscription successful! Check console for details.');
      } else {
        alert('Subscription failed! Check console for details.');
      }
      
      // Refresh diagnostics
      await runDiagnostics();
    } catch (error) {
      console.error('Test subscription error:', error);
      alert(`Subscription test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔧 Notification System Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Button>
          <Button onClick={testSubscription} disabled={loading} variant="outline">
            Test Subscription
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4 text-sm">
            {/* Browser Support */}
            <div>
              <h4 className="font-semibold mb-2">Browser Support</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={debugInfo.browserSupport?.isSupported ? 'default' : 'destructive'}>
                    {debugInfo.browserSupport?.isSupported ? 'Supported' : 'Not Supported'}
                  </Badge>
                  <span>Overall Support</span>
                </div>
                {debugInfo.browserSupport?.issues?.length > 0 && (
                  <div className="text-red-600">
                    Issues: {debugInfo.browserSupport.issues.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Permission Status */}
            <div>
              <h4 className="font-semibold mb-2">Permission Status</h4>
              <Badge variant={
                debugInfo.notificationPermission === 'granted' ? 'default' :
                debugInfo.notificationPermission === 'denied' ? 'destructive' : 'secondary'
              }>
                {debugInfo.notificationPermission}
              </Badge>
            </div>

            {/* Subscription Status */}
            <div>
              <h4 className="font-semibold mb-2">Current Subscription</h4>
              <Badge variant={debugInfo.currentlySubscribed ? 'default' : 'secondary'}>
                {debugInfo.currentlySubscribed ? 'Subscribed' : 'Not Subscribed'}
              </Badge>
            </div>

            {/* User Authentication */}
            <div>
              <h4 className="font-semibold mb-2">User Authentication</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={debugInfo.userAuth?.authenticated ? 'default' : 'destructive'}>
                    {debugInfo.userAuth?.authenticated ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                </div>
                {debugInfo.userAuth?.userId && (
                  <div className="text-xs text-muted-foreground">
                    User ID: {debugInfo.userAuth.userId}
                  </div>
                )}
                {debugInfo.userAuth?.error && (
                  <div className="text-red-600 text-xs">
                    Error: {debugInfo.userAuth.error}
                  </div>
                )}
              </div>
            </div>

            {/* Database Access */}
            <div>
              <h4 className="font-semibold mb-2">Database Access</h4>
              <div className="space-y-1">
                <Badge variant={debugInfo.databaseTest?.success ? 'default' : 'destructive'}>
                  {debugInfo.databaseTest?.success ? 'Accessible' : 'Failed'}
                </Badge>
                {debugInfo.databaseTest?.error && (
                  <div className="text-red-600 text-xs">
                    Error: {debugInfo.databaseTest.error}
                  </div>
                )}
              </div>
            </div>

            {/* Table Access */}
            <div>
              <h4 className="font-semibold mb-2">Push Subscriptions Table</h4>
              <div className="space-y-1">
                <Badge variant={debugInfo.tableAccess?.accessible ? 'default' : 'destructive'}>
                  {debugInfo.tableAccess?.accessible ? 'Accessible' : 'Not Accessible'}
                </Badge>
                {debugInfo.tableAccess?.error && (
                  <div className="text-red-600 text-xs">
                    Error: {debugInfo.tableAccess.error}
                  </div>
                )}
              </div>
            </div>

            {/* Service Worker */}
            <div>
              <h4 className="font-semibold mb-2">Service Worker</h4>
              <div className="space-y-1">
                <Badge variant={debugInfo.serviceWorker?.registered ? 'default' : 'destructive'}>
                  {debugInfo.serviceWorker?.registered ? 'Registered' : 'Not Registered'}
                </Badge>
                {debugInfo.serviceWorker?.scope && (
                  <div className="text-xs text-muted-foreground">
                    Scope: {debugInfo.serviceWorker.scope}
                  </div>
                )}
                {debugInfo.serviceWorker?.state && (
                  <div className="text-xs text-muted-foreground">
                    State: {debugInfo.serviceWorker.state}
                  </div>
                )}
                {debugInfo.serviceWorker?.error && (
                  <div className="text-red-600 text-xs">
                    Error: {debugInfo.serviceWorker.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};