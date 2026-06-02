const CACHE_NAME = 'mango-invoice-v1';

// Cache these files for offline use
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: pre-cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local files, network-first for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For CDN requests (tailwind, fonts, etc.) — network first, fallback cache
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For local files — cache first, fallback network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
