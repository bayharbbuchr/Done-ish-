const CACHE_NAME = 'done-ish-v2';
const urlsToCache = [
  '/Done-ish-/',
  '/Done-ish-/index.html',
  '/Done-ish-/styles.css',
  '/Done-ish-/app.js',
  '/Done-ish-/manifest.json',
  '/Done-ish-/service-worker.js',
  '/Done-ish-/icon-192x192.png',
  '/Done-ish-/icon-512x512.png',
  '/Done-ish-/icon-152x152.png',
  '/Done-ish-/icon-167x167.png',
  '/Done-ish-/icon-180x180.png',
  '/Done-ish-/icon-120x120.png',
  '/Done-ish-/icon-87x87.png',
  '/Done-ish-/apple-touch-icon.png',
  '/Done-ish-/badge.png',
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
    icon: '/icon-192x192.png',
    badge: '/badge.png',
    data: { taskId },
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const taskId = event.notification.data.taskId;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    // Handle background sync for tasks if needed
  }
});
