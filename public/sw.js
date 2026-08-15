const CACHE_NAME = 'serviflow-standalone-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install Event: Cache app shell static files and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiFlow ServiceWorker] Pre-caching offline shell app assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiFlow ServiceWorker] Pre-cache warning:', err);
      });
    })
  );
});

// Activate Event: Cleanup stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiFlow ServiceWorker] Purging outdated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately so the new service worker takes control
      return self.clients.claim();
    }).then(() => {
      // Notify all connected clients that the new ServiceWorker is ready and active
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
        });
      });
    })
  );
});

// Message Event: Allow clients to force skipWaiting or request version
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
});

// Fetch Event: Network-First with Cache fallback for HTML and app bundles
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude Firebase API and Google APIs from ServiceWorker cache to ensure 100% realtime sync
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseinstallations.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // For HTML page navigation and refresh requests: Network-First
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached index.html when offline
          return caches.match('/index.html') || caches.match(event.request);
        })
    );
    return;
  }

  // Network-First with Cache Fallback for static assets, scripts and styles
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.destination === 'image') {
            return caches.match('/favicon.svg');
          }
          return caches.match('/index.html');
        });
      })
  );
});
