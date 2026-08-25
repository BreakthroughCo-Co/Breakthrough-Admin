// Service Worker for Breakthrough OS PWA (R15)
// Provides multi-tier offline caching, background synchronization, and resilient drafting for field visits

const CACHE_NAME = 'breakthrough-shell-v5';
const DATA_CACHE_NAME = 'breakthrough-data-v5';
const DRAFT_CACHE_NAME = 'breakthrough-drafts-v5';
const OFFLINE_URL = '/';

const ASSETS_TO_CACHE = [
  '/',
  '/portal',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
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
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME && key !== DRAFT_CACHE_NAME) {
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

  // Special handling for API calls: NetworkFirst with cache fallback
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
              message: 'Operating in Field Offline Mode. Local IndexedDB cache and draft queue active.'
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // For static assets & navigate requests (CacheFirst with Network Fallback)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(async () => {
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) return fallback;
        }
        return new Response('Operating Offline in Breakthrough OS Field Mode', {
          status: 503,
          statusText: 'Service Unavailable Offline'
        });
      });
    })
  );
});

// Background sync handler for offline mutation replay
self.addEventListener('sync', (event) => {
  if (
    event.tag === 'sync-clinical-notes' ||
    event.tag === 'sync-offline-mutations' ||
    event.tag === 'sync-abc-logs' ||
    event.tag === 'sync-incidents'
  ) {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_SYNC_TRIGGERED',
            tag: event.tag,
            timestamp: new Date().toISOString()
          });
        });
      })
    );
  }
});

// Listen for background sync or messaging events from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_DRAFT') {
    // Acknowledge draft saved in offline storage
    if (event.source) {
      event.source.postMessage({
        type: 'DRAFT_CACHED_ACK',
        id: event.data.id,
        timestamp: new Date().toISOString()
      });
    }
  }
});
