// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  console.log('Push received:', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/Oplus only.png',
    badge: '/Oplus only.png',
    image: null,
    tag: 'default',
    data: {},
    actions: []
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image || notificationData.image,
        tag: data.tag || notificationData.tag,
        data: data.data || {},
        actions: data.actions || notificationData.actions
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true,
      actions: notificationData.actions.length > 0 ? notificationData.actions : [
        {
          action: 'open',
          title: '🚀 Open App'
        },
        {
          action: 'close',
          title: '✕ Close'
        }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(function(windowClients) {
    let clientUsingThisOrigin;

    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(self.location.origin)) {
        clientUsingThisOrigin = client;
        break;
      }
    }

    if (clientUsingThisOrigin) {
      return clientUsingThisOrigin.focus();
    } else {
      return clients.openWindow('/');
    }
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});