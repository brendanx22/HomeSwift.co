const CACHE_VERSION = "v5";
const STATIC_CACHE = `homeswift-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `homeswift-dynamic-${CACHE_VERSION}`;

// List of URLs to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  // Skip waiting to activate immediately
  self.skipWaiting();

  // Cache static assets
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[Service Worker] Static assets cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[Service Worker] Installation failed:", error);
        // Even if cache fails, we want to proceed with the install
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  // Take control of all clients immediately
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return (
              cacheName.startsWith("homeswift-") &&
              !cacheName.includes(CACHE_VERSION)
            );
          })
          .map((cacheName) => {
            console.log(`[Service Worker] Removing old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );

      // Claim all clients to ensure the new service worker takes over
      if (self.clients && self.clients.claim) {
        console.log("[Service Worker] Claiming clients");
        return self.clients.claim();
      }
    })()
  );
});

// Fetch event - handle network requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (
    request.method !== "GET" ||
    request.url.startsWith("chrome-extension://") ||
    request.url.includes("extension") ||
    request.url.includes("sockjs-node") ||
    request.url.includes("hot-update.json")
  ) {
    return;
  }

  // Skip non-http(s) requests
  if (!event.request.url.startsWith("http")) return;

  // For development, skip Vite's HMR and other development server requests
  if (
    event.request.url.includes("sockjs-node") ||
    event.request.url.includes("__vite_ping") ||
    event.request.url.includes("localhost:3000")
  ) {
    return;
  }

  // Handle API and external requests
  if (url.origin !== self.location.origin) {
    // For external requests, try network first, then cache
    event.respondWith(
      (async () => {
        try {
          // Try to fetch from network first
          const networkResponse = await fetch(request);

          // If we got a valid response, cache it
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          // If network fails, try to serve from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log("[Service Worker] Serving from cache:", request.url);
            return cachedResponse;
          }

          // If not in cache, return offline page or error
          return new Response("You are offline", {
            status: 408,
            statusText: "Network request failed",
            headers: { "Content-Type": "text/plain" },
          });
        }
      })()
    );
    return;
  }

  // For same-origin requests, use cache-first strategy
  event.respondWith(
    (async () => {
      try {
        // Try to get from cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          console.log("[Service Worker] Serving from cache:", request.url);
          return cachedResponse;
        }

        // If not in cache, fetch from network
        const networkResponse = await fetch(request);

        // If we got a valid response, cache it
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.error("[Service Worker] Fetch failed:", error);

        // If both cache and network fail, return offline page
        if (request.mode === "navigate") {
          return caches.match("/offline.html");
        }

        return new Response("You are offline", {
          status: 408,
          statusText: "Network request failed",
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});

// Handle service worker updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/logo192.png",
    badge: "/logo192.png",
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data.url || "/";

  // Open the app and navigate to the URL
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

event.respondWith(
  caches.match(event.request).then((cachedResponse) => {
    // Return cached response if found
    if (cachedResponse) {
      return cachedResponse;
    }

    // Otherwise, fetch from network
    return fetch(event.request).then((response) => {
      // Don't cache non-200 responses
      if (!response || response.status !== 200 || response.type !== "basic") {
        return response;
      }

      // Clone the response
      const responseToCache = response.clone();

      // Cache the response
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(event.request, responseToCache);
      });

      return response;
    });
  })
);

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("Service Worker: Deleting old cache", cacheName);
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
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
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
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response (can only be consumed once)
          const responseToCache = response.clone();

          // Cache the response for future use
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error("Service Worker: Fetch failed", error);

          // Return offline fallback for navigation requests
          if (request.destination === "document") {
            return caches.match("/").then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }

              // Return a simple offline page
              return new Response(
                `
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
            `,
                {
                  headers: { "Content-Type": "text/html" },
                }
              );
            });
          }

          throw error;
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks
      // For example, sync offline form submissions, etc.
      console.log("Service Worker: Performing background sync tasks")
    );
  }
});

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  const options = {
    body: event.data ? event.data.text() : "New notification from HomeSwift",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/xmark.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("HomeSwift", options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  if (event.action === "explore") {
    // Handle explore action
    event.waitUntil(clients.openWindow("/"));
  } else {
    // Handle default click
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/");
      })
    );
  }
});

// Message handling from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
