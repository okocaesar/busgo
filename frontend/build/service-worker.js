/* eslint-disable no-restricted-globals */

// =========================================
// BUSGO SERVICE WORKER
// =========================================
//
// IMPORTANT
// -----------------------------------------
// This service worker is intentionally simple.
//
// - Never caches API requests
// - Never caches external resources
// - Does NOT use cache-first for new JS/CSS
// - Always checks the network first
// - Falls back to cache only when offline
// - Automatically removes old BusGo caches
//
// This prevents old Vercel deployments from
// being trapped behind stale service-worker
// caches.
// =========================================

const CACHE_NAME = "busgo-cache-v6";
const OFFLINE_PAGE = "/offline.html";

// =========================================
// INSTALL
// =========================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Only cache the offline page.
        //
        // We intentionally do NOT use cache.addAll()
        // here because one missing file can cause the
        // entire service worker installation to fail.

        return cache
          .add(OFFLINE_PAGE)
          .catch(() => {
            // Offline page is optional.
            // Service worker installation should
            // still succeed if it is unavailable.
            return undefined;
          });
      })
      .then(() => {
        // Activate immediately.
        return self.skipWaiting();
      })
  );
});

// =========================================
// ACTIVATE
// =========================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith("busgo-") &&
                name !== CACHE_NAME;
            })
            .map((name) => {
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of open pages immediately.
        return self.clients.claim();
      })
  );
});

// =========================================
// FETCH
// =========================================

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // -----------------------------------------
  // ONLY GET REQUESTS
  // -----------------------------------------

  if (request.method !== "GET") {
    return;
  }

  // -----------------------------------------
  // ONLY HTTP / HTTPS
  // -----------------------------------------

  const url = new URL(request.url);

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return;
  }

  // -----------------------------------------
  // DO NOT HANDLE EXTERNAL REQUESTS
  // -----------------------------------------
  //
  // This prevents the BusGo service worker
  // from interfering with:
  //
  // - Render API
  // - Vercel services
  // - Google services
  // - external images
  // - external fonts
  // - Socket.IO connections
  //
  // -----------------------------------------

  if (url.origin !== self.location.origin) {
    return;
  }

  // -----------------------------------------
  // NEVER CACHE API REQUESTS
  // -----------------------------------------

  if (
    url.pathname.startsWith("/api/")
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            message: "BusGo API is currently unavailable."
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      })
    );

    return;
  }

  // =========================================
  // NAVIGATION REQUESTS
  // =========================================

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_PAGE);
        })
    );

    return;
  }

  // =========================================
  // STATIC FILES
  // =========================================
  //
  // NETWORK FIRST
  //
  // This is important for Vercel.
  //
  // New deployments should always be fetched
  // from the network instead of being trapped
  // behind an old cache.
  //
  // =========================================

  event.respondWith(
    fetch(request)
      .then((response) => {
        // -------------------------------------
        // Only cache successful same-origin
        // responses.
        // -------------------------------------

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const responseClone = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            })
            .catch(() => {
              // Cache failure must never break
              // the actual network response.
            });
        }

        return response;
      })
      .catch(() => {
        // -------------------------------------
        // NETWORK FAILED
        // -------------------------------------
        //
        // Try cached resource.
        // -------------------------------------

        return caches.match(request).then(
          (cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            return new Response("", {
              status: 503,
              statusText: "BusGo is offline"
            });
          }
        );
      })
  );
});