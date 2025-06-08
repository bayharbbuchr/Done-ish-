// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// For now using a simplified config - we'll set up a real Firebase project
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "done-ish-notifications.firebaseapp.com",
  projectId: "done-ish-notifications", 
  storageBucket: "done-ish-notifications.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const { title, body, icon, data } = payload.notification || payload.data;
  
  const notificationOptions = {
    body: body || payload.data?.body,
    icon: icon || './icon-192x192.png',
    badge: './badge.png',
    data: payload.data,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: `task-${payload.data?.taskId || Date.now()}`,
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

  self.registration.showNotification(
    title || payload.data?.title || 'Done(ish) Reminder',
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const taskId = event.notification.data?.taskId;
  const action = event.action;
  
  if (action === 'complete') {
    // Send message to app to complete the task
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then((clientList) => {
          if (clientList.length > 0) {
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
          for (const client of clientList) {
            if ((client.url.includes('Done-ish') || client.url.includes('index.html')) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('./');
          }
        })
    );
  }
}); 