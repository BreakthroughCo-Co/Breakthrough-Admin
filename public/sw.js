// Service Worker for NDIS Google Keep & Clinical Hub
// Provides multi-tier offline caching and resilient synchronization for off-site field visits

const CACHE_NAME = 'breakthrough-keep-v3';
const DATA_CACHE_NAME = 'breakthrough-keep-data-v3';
const OFFLINE_URL = '/';

const ASSETS_TO_CACHE = [
  '/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW cache pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass Next.js internal chunks, webpack runtime, HMR, and chrome extensions
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/__next') ||
    url.pathname.includes('webpack') ||
    url.pathname.includes('hot-update') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // Special handling for Keep & Clinical API calls (stale-while-revalidate / cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              offline: true,
              timestamp: new Date().toISOString(),
              message: 'Operating in Field Offline Mode. Local IndexedDB cache active.'
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // For navigate requests only, fallback to cached offline home page if network fails
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        if (fallback) return fallback;
        return fetch(event.request);
      })
    );
    return;
  }
});

// Listen for background sync or messaging events from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

