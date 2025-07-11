// PWA Configuration for Digital Organism Theory Platform
// Service Worker Configuration

const CACHE_NAME = 'dot-platform-v1';
const STATIC_CACHE = 'dot-static-v1';
const DYNAMIC_CACHE = 'dot-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Core CSS and JS will be added by Vite
];

// Routes to cache dynamically
const DYNAMIC_ROUTES = [
  '/blog',
  '/community',
  '/learn',
  '/research',
  '/settings',
  '/support'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
          }

          // Network first for navigation
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Offline fallback
              console.log('[Service Worker] Network failed, serving offline page');
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Handle static assets (CSS, JS, images)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving asset from cache:', request.url);
            return cachedResponse;
          }

          // Cache first for static assets
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              console.log('[Service Worker] Failed to fetch asset:', request.url);
              // Could return a placeholder image here
            });
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Serve cached API response if available
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving API from cache (offline):', request.url);
                return cachedResponse;
              }
              
              // Return offline indicator for API calls
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'This feature requires an internet connection' 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'blog-post-sync') {
    event.waitUntil(syncBlogPosts());
  } else if (event.tag === 'settings-sync') {
    event.waitUntil(syncSettings());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'dot-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DOT Platform', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for background sync
async function syncBlogPosts() {
  try {
    // Get pending blog posts from IndexedDB
    const pendingPosts = await getPendingBlogPosts();
    
    for (const post of pendingPosts) {
      try {
        const response = await fetch('/api/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post.data)
        });

        if (response.ok) {
          await removePendingBlogPost(post.id);
          console.log('[Service Worker] Blog post synced:', post.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync blog post:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

async function syncSettings() {
  try {
    // Get pending settings from IndexedDB
    const pendingSettings = await getPendingSettings();
    
    for (const setting of pendingSettings) {
      try {
        const response = await fetch('/api/user/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting.data)
        });

        if (response.ok) {
          await removePendingSetting(setting.id);
          console.log('[Service Worker] Settings synced:', setting.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync settings:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Settings sync failed:', error);
  }
}

// IndexedDB helper functions (simplified - would need actual implementation)
async function getPendingBlogPosts() {
  // Implementation would use IndexedDB to get pending blog posts
  return [];
}

async function removePendingBlogPost(id) {
  // Implementation would remove synced blog post from IndexedDB
}

async function getPendingSettings() {
  // Implementation would use IndexedDB to get pending settings
  return [];
}

async function removePendingSetting(id) {
  // Implementation would remove synced setting from IndexedDB
}
