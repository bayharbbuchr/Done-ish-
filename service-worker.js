const CACHE_NAME = 'done-ish-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './notification-worker.js',
  './manifest.json',
  './service-worker.js',
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-152x152.png',
  './icon-167x167.png',
  './icon-180x180.png',
  './icon-120x120.png',
  './icon-87x87.png',
  './apple-touch-icon.png',
  './badge.png',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  // Add other assets you want to cache
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const notificationData = event.data.json();
  const { title, body, taskId } = notificationData;
  
  const options = {
    body,
    icon: './icon-192x192.png',
    badge: './badge.png',
    data: { taskId },
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: `task-${taskId}`, // Unique tag for each task
    renotify: true,
    actions: [
      {
        action: 'complete',
        title: 'Mark Complete',
        icon: './icon-120x120.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: './icon-87x87.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const taskId = event.notification.data.taskId;
  const action = event.action;
  
  if (action === 'complete') {
    // Send message to app to complete the task
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then((clientList) => {
          if (clientList.length > 0) {
            // Send message to the first available client
            clientList[0].postMessage({
              type: 'COMPLETE_TASK',
              taskId: taskId
            });
            return clientList[0].focus();
          }
        })
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then((clientList) => {
          // Look for an existing window
          for (const client of clientList) {
            if ((client.url.includes('Done-ish') || client.url.includes('index.html')) && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window found, open a new one
          if (clients.openWindow) {
            return clients.openWindow('./');
          }
        })
    );
  }
});

// Background sync for failed requests and notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    // Handle background sync for tasks if needed
  } else if (event.tag === 'check-notifications') {
    event.waitUntil(checkScheduledNotifications());
  }
});

// Check for scheduled notifications in the background
async function checkScheduledNotifications() {
  try {
    // Get scheduled notifications from storage
    const stored = await caches.open('done-ish-data').then(cache => 
      cache.match('scheduled-notifications')
    );
    
    if (!stored) return;
    
    const scheduledData = await stored.json();
    const now = new Date();
    
    scheduledData.forEach(async (notification) => {
      const reminderTime = new Date(notification.reminderTime);
      if (reminderTime <= now && notification.scheduled) {
        await self.registration.showNotification('Hey, you!', {
          body: `Time to ${notification.taskTitle}!`,
          icon: './icon-192x192.png',
          badge: './badge.png',
          data: { taskId: notification.id },
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200, 100, 200],
          tag: `task-${notification.id}`,
          actions: [
            {
              action: 'complete',
              title: 'Mark Complete',
              icon: './icon-120x120.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss', 
              icon: './icon-87x87.png'
            }
          ]
        });
        
        // Mark as sent
        notification.scheduled = false;
      }
    });
    
    // Save updated data back
    const cache = await caches.open('done-ish-data');
    await cache.put('scheduled-notifications', new Response(JSON.stringify(scheduledData)));
    
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
  }
}
