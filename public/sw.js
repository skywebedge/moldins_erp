// Moldins ERP Service Worker (मोल्डिन्स ईआरपी सर्विस वर्कर)
// Offline & PWA support for Factory & Construction Site Field Operations

const CACHE_NAME = 'moldins-erp-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg'
];

// Install Event - Pre-cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline shell assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Hybrid Strategy:
// - Static assets (_next/static, icons, fonts): Cache-first with network fallback
// - HTML / API requests: Network-first with cache fallback for offline resilience
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (e.g. POST/PUT/DELETE mutations should always go to network)
  if (event.request.method !== 'GET') {
    return;
  }

  // 1. Static Next.js chunks, fonts, and images: Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Navigation & API data: Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If successful, update the cache copy for offline availability
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline on site) -> attempt cache match
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, fallback to root page if available
        if (event.request.mode === 'navigate') {
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
        }

        // Fallback offline JSON for API requests
        if (url.pathname.startsWith('/api/')) {
          return new Response(
            JSON.stringify({
              error: 'OFFLINE_MODE',
              message: 'आप ऑफलाइन हैं (You are currently offline). कृपया नेटवर्क कनेक्शन जांचें।'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response('Offline - No connection', { status: 503 });
      })
  );
});
