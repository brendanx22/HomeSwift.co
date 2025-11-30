// sw.js - safe HomeSwift service worker (replace existing one)
//
// Behavior summary:
// - Do not intercept non-GET requests (allow Supabase/auth to always go network).
// - Bypass caching for /api, /socket.io, and Supabase domains.
// - Cache static assets (images, icons, css, fonts) only.
// - Network-first for navigations and resources, fallback to cache when offline.
// - Clean activation with skipWaiting + clientsClaim.

const CACHE_VERSION = 'homeswift-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const ROUTE_CACHE = `${CACHE_VERSION}-routes`;

// Put here the static files you want to precache (images, icons, CSS, manifest).
// NOTE: do NOT include JS bundles or files that are built with hashed names if you
// prefer Workbox or injectManifest to manage them automatically.
const PRECACHE_URLS = [
    '/', // fallback
    '/index.html',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/images/logo.png',
    '/images/Illustration.png',
    '/images/3.png',
    '/assets/PropertyMap-BbyR9nQ0.css',
    '/assets/index-Cmz04v1C.css',
    '/oauth-diagnostic.html'
];

// Domains & path patterns to bypass (do not cache or intercept)
// - All non-GET requests will be bypassed regardless
// - GETs that include any of these should also bypass caching.
const BYPASS_PATTERNS = [
    '/api',
    '/socket.io',
];
const SUPABASE_HOST_REGEX = /(^https?:\/\/[^/]*supabase\.co[:\/]?)/i;

// Utility: simple timeout wrapper for network fetches (optional)
const fetchWithTimeout = (request, timeoutSecs = 12) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('network timeout')), timeoutSecs * 1000);
        fetch(request).then(response => {
            clearTimeout(timer);
            resolve(response);
        }, err => {
            clearTimeout(timer);
            reject(err);
        });
    });
};

self.addEventListener('install', (event) => {
    // Precache static assets
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' }))).catch(err => {
                // Don't fail install if some assets can't be cached — log and continue.
                console.warn('SW precache addAll error:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    // Cleanup old caches
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter(k => ![STATIC_CACHE, ROUTE_CACHE].includes(k)).map(k => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

// Determines whether this request should be bypassed (not handled by SW)
function shouldBypass(request) {
    // Non-GET methods must always bypass (don't break auth/POST)
    if (request.method && request.method.toUpperCase() !== 'GET') return true;

    const url = new URL(request.url);

    // Bypass API routes and socket.io paths (any host)
    if (BYPASS_PATTERNS.some(p => url.pathname.startsWith(p))) return true;

    // Bypass absolute API host used in production (example) - keep flexible
    // Bypass any Supabase domain (so auth, realtime, storage not intercepted)
    if (SUPABASE_HOST_REGEX.test(request.url)) return true;

    // Bypass dev proxy endpoints that start with /api (same origin)
    if (url.origin === self.location.origin && url.pathname.startsWith('/api')) return true;

    return false;
}

// Main fetch handler
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Always bypass for navigation to any fully qualified developer-only pages?
    // We'll handle navigations below, but keep bypass rules first.
    if (shouldBypass(request)) {
        // Do not intercept — let the request go to network directly.
        return;
    }

    // For navigation (SPA routes) - network-first, fallback to cached index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const response = await fetchWithTimeout(request, 12);
                    // Update route cache with latest navigation response
                    const cache = await caches.open(ROUTE_CACHE);
                    // Clone response for cache/storage
                    cache.put(request, response.clone().catch(() => { })).catch(() => { });
                    return response;
                } catch (err) {
                    // On failure, return cached index.html or other fallback
                    const cache = await caches.open(STATIC_CACHE);
                    const fallback = await cache.match('/index.html') || cache.match('/');
                    if (fallback) return fallback;
                    // As last resort, try network without timeout
                    return fetch(request).catch(e => new Response('Offline', { status: 503, statusText: 'Offline' }));
                }
            })()
        );
        return;
    }

    // For other GET requests (static resources) - try network first, then cache
    event.respondWith(
        (async () => {
            try {
                const response = await fetchWithTimeout(request, 10);
                // Only cache successful responses and non opaque (same-origin or CORS with valid response)
                if (response && response.ok) {
                    // Only cache a narrow set of file types to be safe
                    const contentType = response.headers.get('content-type') || '';
                    const shouldCache =
                        contentType.includes('image') ||
                        contentType.includes('font') ||
                        contentType.includes('text/css') ||
                        contentType.includes('application/json') || // small JSON (optional)
                        contentType.includes('text/html');

                    if (shouldCache) {
                        const cache = await caches.open(STATIC_CACHE);
                        cache.put(request, response.clone().catch(() => { })).catch(() => { });
                    }
                }
                return response;
            } catch (err) {
                // Network failed — try cache
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;

                // Also check route cache
                const routeCache = await caches.open(ROUTE_CACHE);
                const rCached = await routeCache.match(request);
                if (rCached) return rCached;

                // If nothing matches, fallback to fetch without timeout (best-effort)
                try {
                    return await fetch(request);
                } catch (finalErr) {
                    return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
                }
            }
        })()
    );
});

// Message listener to allow clients to trigger skipWaiting (update flow)
self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Placeholder for Workbox injection (required by VitePWA injectManifest strategy)
// self.__WB_MANIFEST;
