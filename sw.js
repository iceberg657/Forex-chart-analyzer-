const CACHE_NAME = 'grey-algo-apex-trader-cache-v4';
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
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CRITICAL: Only attempt to cache requests to our own origin for static assets.
  // This prevents the "auth/network-request-failed" error by ensuring all 
  // Firebase, Google, and other external API calls bypass the Service Worker entirely.
  const isInternal = url.origin === self.location.origin;
  const isStaticAsset = url.pathname.match(/\.(js|css|html|svg|png|jpg|json|woff2)$/) || url.pathname === '/';

  if (!isInternal || !isStaticAsset || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200) {
              return response;
            }
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
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});