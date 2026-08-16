// PWA Configuration for Digital Organism Theory Platform
// Offline-first service worker for Book One and canonical DOT routes.

const STATIC_CACHE = "dot-static-v2";
const DYNAMIC_CACHE = "dot-dynamic-v2";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon-dot.svg",
  "/favicon-dot-16.svg",
  "/favicon-dot.ico",
  "/publications/henok/digital-organism-theory/v2/manifest.json",
];

// Routes to cache dynamically
const DYNAMIC_ROUTES = [
  "/doctrine",
  "/applied",
  "/support",
  "/join",
  "/book/digital-organism-theory",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip browser extensions or cross-origin trackers
  if (url.protocol === "chrome-extension:" || url.origin !== self.location.origin) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/index.html");
          });
        }),
    );
    return;
  }

  // Handle static assets (CSS, JS, fonts, images, publications)
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/publications/") ||
    url.pathname.startsWith("/books/")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  // Handle orchestrator public delivery & content requests
  if (url.pathname.startsWith("/v1/profile-delivery/") || url.pathname.startsWith("/v1/site-content")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
  }

  // Handle static assets (CSS, JS, images)
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log(
            "[Service Worker] Serving asset from cache:",
            request.url,
          );
          return cachedResponse;
        }

        // Cache first for static assets
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            console.log("[Service Worker] Failed to fetch asset:", request.url);
            // Could return a placeholder image here
          });
      }),
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          if (response.status === 200 && request.method === "GET") {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Serve cached API response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log(
                "[Service Worker] Serving API from cache (offline):",
                request.url,
              );
              return cachedResponse;
            }

            // Return offline indicator for API calls
            return new Response(
              JSON.stringify({
                error: "Offline",
                message: "This feature requires an internet connection",
              }),
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "application/json" },
              },
            );
          });
        }),
    );
    return;
  }
});

// Background sync for form submissions
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag);

  if (event.tag === "blog-post-sync") {
    event.waitUntil(syncBlogPosts());
  } else if (event.tag === "settings-sync") {
    event.waitUntil(syncSettings());
  }
});

// There is deliberately no `push` or `notificationclick` handler here.
//
// ADR-0004 L4 forbids interruption: signals are pulled, never pushed. This file
// used to register both, with `requireInteraction: true` — a notification that
// stays on screen until it is dealt with, which is the most demanding form the
// mechanism takes. It never actually fired, because a stray `});` above left
// the file unparseable and the worker never installed. Repairing the syntax
// without removing these would have shipped the violation for the first time.
//
// `manifesto-laws.test.ts` now scans this file, so re-adding them fails the
// build rather than waiting to be noticed.

// Helper functions for background sync
async function syncBlogPosts() {
  try {
    // Get pending blog posts from IndexedDB
    const pendingPosts = await getPendingBlogPosts();

    for (const post of pendingPosts) {
      try {
        const response = await fetch("/api/blog/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(post.data),
        });

        if (response.ok) {
          await removePendingBlogPost(post.id);
          console.log("[Service Worker] Blog post synced:", post.id);
        }
      } catch (error) {
        console.error("[Service Worker] Failed to sync blog post:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Background sync failed:", error);
  }
}

async function syncSettings() {
  try {
    // Get pending settings from IndexedDB
    const pendingSettings = await getPendingSettings();

    for (const setting of pendingSettings) {
      try {
        const response = await fetch("/api/user/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setting.data),
        });

        if (response.ok) {
          await removePendingSetting(setting.id);
          console.log("[Service Worker] Settings synced:", setting.id);
        }
      } catch (error) {
        console.error("[Service Worker] Failed to sync settings:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Settings sync failed:", error);
  }
}

// IndexedDB helper functions (simplified - would need actual implementation)
async function getPendingBlogPosts() {
  // Implementation would use IndexedDB to get pending blog posts
  return [];
}

async function removePendingBlogPost() {
  // Implementation would remove synced blog post from IndexedDB
}

async function getPendingSettings() {
  // Implementation would use IndexedDB to get pending settings
  return [];
}

async function removePendingSetting() {
  // Implementation would remove synced setting from IndexedDB
}
