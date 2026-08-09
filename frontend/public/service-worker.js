/* eslint-disable no-restricted-globals */

const CACHE_NAME = "busgo-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/icons/icon-192.jpg"
];

// =========================================
// INSTALL
// =========================================

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches.open(CACHE_NAME).then((cache) => {

      return cache.addAll(APP_SHELL);

    })

  );

  self.skipWaiting();

});


// =========================================
// ACTIVATE
// =========================================

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys().then((cacheNames) => {

      return Promise.all(

        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME
          )
          .map(
            (cacheName) =>
              caches.delete(cacheName)
          )

      );

    })

  );

  self.clients.claim();

});


// =========================================
// FETCH
// =========================================

self.addEventListener("fetch", (event) => {

  if (
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(

    caches.match(event.request).then(
      (cachedResponse) => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {

            if (
              !response ||
              response.status !== 200 ||
              response.type === "opaque"
            ) {
              return response;
            }

            const responseClone =
              response.clone();

            caches.open(CACHE_NAME).then(
              (cache) => {

                cache.put(
                  event.request,
                  responseClone
                );

              }
            );

            return response;

          })
          .catch(() => {

            return caches.match(
              "/index.html"
            );

          });

      }
    )

  );

});