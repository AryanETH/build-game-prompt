// Web Push Notifications Setup
import { supabase } from "@/integrations/supabase/client";

// VAPID keys - you'll need to generate these
const VAPID_PUBLIC_KEY = 'BDTvloyDHbUwiWxUWtxNZOyhJcEP9xCXdh-1rWe7aYaW52whuLHoFgbif1szslhnOw1m7V5YzpVvQ-PxY9C4QKU';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  // Check for HTTPS (required for push notifications)
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  
  // Check for required APIs
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasNotification = 'Notification' in window;
  
  return isSecure && hasServiceWorker && hasPushManager && hasNotification;
}

// Get detailed support information
export function getPushSupportDetails() {
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasNotification = 'Notification' in window;
  
  return {
    isSecure,
    hasServiceWorker,
    hasPushManager,
    hasNotification,
    isSupported: isSecure && hasServiceWorker && hasPushManager && hasNotification,
    issues: [
      !isSecure && 'Requires HTTPS (or localhost)',
      !hasServiceWorker && 'Service Worker not supported',
      !hasPushManager && 'Push Manager not supported',
      !hasNotification && 'Notifications not supported'
    ].filter(Boolean)
  };
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    console.log('Starting push subscription process...');
    
    // Check if push is supported
    if (!isPushSupported()) {
      const details = getPushSupportDetails();
      console.error('Push not supported:', details);
      throw new Error(`Push messaging is not supported: ${details.issues.join(', ')}`);
    }

    console.log('Push is supported, requesting permission...');
    
    // Request permission
    const permission = await requestNotificationPermission();
    console.log('Permission result:', permission);
    
    if (permission !== 'granted') {
      throw new Error(`Permission not granted for notifications. Status: ${permission}`);
    }

    console.log('Permission granted, registering service worker...');
    
    // Register service worker
    const registration = await registerServiceWorker();
    console.log('Service worker registered:', registration);

    console.log('Subscribing to push service...');
    
    // Subscribe to push service
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('Push subscription created:', subscription);

    // Convert to our format
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
      }
    };

    console.log('Saving subscription to database...');
    
    // Save subscription to database
    await saveSubscriptionToDatabase(pushSubscription);

    console.log('Subscription saved successfully!');

    // Show welcome notification after a short delay
    setTimeout(() => {
      showLocalNotification('Welcome to Oplus! 🎮', {
        body: 'You\'re all set! You\'ll now get notified about trending games and updates.',
        icon: '/Oplus only.png',
        image: '/Oplus full logo.png',
        tag: 'welcome'
      });
    }, 1000);

    return pushSubscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Permission')) {
        console.error('Permission denied or not granted');
      } else if (error.message.includes('Service Worker')) {
        console.error('Service Worker registration failed');
      } else if (error.message.includes('supported')) {
        console.error('Push notifications not supported in this browser/environment');
      } else {
        console.error('Unknown error during subscription:', error.message);
      }
    }
    
    return null;
  }
}

// Save subscription to Supabase
async function saveSubscriptionToDatabase(subscription: PushSubscription) {
  console.log('Getting user for database save...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('Error getting user:', userError);
    throw new Error('Failed to get user information');
  }
  
  if (!user) {
    console.error('No user found');
    throw new Error('User not authenticated');
  }

  console.log('User found, saving subscription for user:', user.id);

  const subscriptionData = {
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    updated_at: new Date().toISOString()
  };

  console.log('Subscription data to save:', subscriptionData);

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(subscriptionData);

  if (error) {
    console.error('Error saving subscription to database:', error);
    throw new Error(`Failed to save subscription: ${error.message}`);
  }

  console.log('Subscription saved to database successfully');
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const success = await subscription.unsubscribe();
    
    if (success) {
      // Remove from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
    }

    return success;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

// Check if user is subscribed
export async function isSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Show local notification (for testing)
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/Oplus only.png',
      badge: '/Oplus only.png',
      ...options
    });
  }
}

// Test database connection and table access
export async function testDatabaseAccess(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Testing database access...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return { success: false, error: `User error: ${userError.message}` };
    }
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    console.log('User authenticated, testing table access...');

    // Try to query the push_subscriptions table
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    console.log('Database access test successful');
    return { success: true };
  } catch (error) {
    console.error('Database access test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}