// Ultra-lightweight PWA Service Worker
// Designed for fast installability without heavy caching or breaking dynamic data

const CACHE_NAME = 'corixa-pwa-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Network-first strategy to guarantee live dynamic contract data without stale cache
self.addEventListener('fetch', (event) => {
    // Only handle GET requests and ignore non-http schemes
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
