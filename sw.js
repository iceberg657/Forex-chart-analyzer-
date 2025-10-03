const CACHE_NAME = 'grey-algo-apex-trader-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // For API requests to Google, always go to the network and bypass the cache.
  // This ensures that analysis results and AI responses are always fresh.
  if (requestUrl.hostname === 'generativelanguage.googleapis.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests (local assets), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }

        // Not in cache, fetch from network
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response to cache
            // We only cache GET requests with 2xx status codes
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response to cache it
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});