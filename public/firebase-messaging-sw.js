// Firebase Messaging Service Worker
// Handles background push notifications when the app is closed

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Don't initialize Firebase until we receive config from the main app
let messaging = null;

// Receive config from main app via postMessage
self.addEventListener('message', (event) => {
    if (event.data?.type === 'FIREBASE_CONFIG' && !messaging) {
        try {
            firebase.initializeApp(event.data.config);
            messaging = firebase.messaging();
            console.log('[firebase-messaging-sw.js] Firebase initialized successfully');

            // Setup background message handler after initialization
            messaging.onBackgroundMessage((payload) => {
                console.log('[firebase-messaging-sw.js] Background message:', payload);

                const notificationTitle = payload.notification?.title || 'MealPrepper';
                const notificationOptions = {
                    body: payload.notification?.body || 'You have a new notification',
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    tag: payload.data?.tag || 'mealprepper-notification',
                    data: {
                        url: payload.data?.url || '/dashboard',
                        ...payload.data,
                    },
                    vibrate: [100, 50, 100],
                };

                self.registration.showNotification(notificationTitle, notificationOptions);
            });
        } catch (error) {
            console.error('[firebase-messaging-sw.js] Firebase init error:', error);
        }
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked');

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus().then(() => client.navigate(fullUrl));
                }
            }
            // Open new window
            return clients.openWindow(fullUrl);
        })
    );
});

// Handle service worker activation - claim all clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
