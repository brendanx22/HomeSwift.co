const CACHE_NAME = 'homeswift-v1';
const STATIC_CACHE = 'homeswift-static-v1';
const DYNAMIC_CACHE = 'homeswift-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Add more critical assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((error) => {
      console.error('Service Worker: Failed to cache static assets', error);
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (API calls, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response (can only be consumed once)
        const responseToCache = response.clone();

        // Cache the response for future use
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('Service Worker: Fetch failed', error);

        // Return offline fallback for navigation requests
        if (request.destination === 'document') {
          return caches.match('/').then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Return a simple offline page
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>HomeSwift - Offline</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      min-height: 100vh;
                      margin: 0;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      text-align: center;
                    }
                    .offline-container {
                      max-width: 400px;
                      padding: 2rem;
                    }
                    h1 { margin-bottom: 1rem; }
                    p { margin-bottom: 2rem; opacity: 0.9; }
                    button {
                      background: rgba(255, 255, 255, 0.2);
                      border: 1px solid rgba(255, 255, 255, 0.3);
                      color: white;
                      padding: 0.75rem 1.5rem;
                      border-radius: 0.5rem;
                      cursor: pointer;
                      transition: background 0.3s;
                    }
                    button:hover { background: rgba(255, 255, 255, 0.3); }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <h1>You're Offline</h1>
                    <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
                    <button onclick="window.location.reload()">Try Again</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        }

        throw error;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      // For example, sync offline form submissions, etc.
      console.log('Service Worker: Performing background sync tasks')
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification from HomeSwift',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('HomeSwift', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');

  event.notification.close();

  if (event.action === 'explore') {
    // Handle explore action
    event.waitUntil(
      clients.openWindow('/')
    );
  } else {
    // Handle default click
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
