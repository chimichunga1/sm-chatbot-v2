
// Service worker for PriceBetter.ai PWA

const CACHE_NAME = 'pricebetter-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - serve cached content when offline with network-first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http')) {
    return;
  }
  
  // Handle API requests differently - don't cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return a fallback JSON for API calls when offline
          return new Response(
            JSON.stringify({ 
              error: 'You are currently offline. Please check your connection.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }
  
  // For all other requests, try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the response for future use
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try the cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If no cached response, return a fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/')
                .then(fallbackResponse => {
                  return fallbackResponse || new Response('Network error. App is offline.');
                });
            }
            
            // For other resources, return a simple offline message
            return new Response('Resource unavailable offline');
          });
      })
  );
});
