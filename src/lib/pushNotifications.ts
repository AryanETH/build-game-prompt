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
  return 'serviceWorker' in navigator && 'PushManager' in window;
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
    // Check if push is supported
    if (!isPushSupported()) {
      throw new Error('Push messaging is not supported');
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Subscribe to push service
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Convert to our format
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
      }
    };

    // Save subscription to database
    await saveSubscriptionToDatabase(pushSubscription);

    return pushSubscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

// Save subscription to Supabase
async function saveSubscriptionToDatabase(subscription: PushSubscription) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving subscription:', error);
  }
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
      icon: '/notification-icon.svg',
      badge: '/icon-192x192.png',
      ...options
    });
  }
}