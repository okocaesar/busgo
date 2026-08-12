/* eslint-disable no-restricted-globals */

// =========================================
// BUSGO SERVICE WORKER
// =========================================

const CACHE_NAME =
"busgo-cache-v5";

const OFFLINE_PAGE =
"/offline.html";

const APP_SHELL = [

"/",

"/index.html",

"/manifest.json",

"/offline.html",

"/icons/icon-192.png"

];

// =========================================
// INSTALL
// =========================================

self.addEventListener(
"install",
(event) => {


event.waitUntil(

  caches
    .open(CACHE_NAME)
    .then((cache) => {

      return cache.addAll(
        APP_SHELL
      );

    })

);

// Activate the new service worker
// immediately.

self.skipWaiting();


}
);

// =========================================
// ACTIVATE
// =========================================

self.addEventListener(
"activate",
(event) => {


event.waitUntil(

  caches
    .keys()
    .then((cacheNames) => {

      return Promise.all(

        cacheNames
          .filter(
            (name) =>
              name !== CACHE_NAME
          )
          .map(
            (name) =>
              caches.delete(name)
          )

      );

    })

);

// Take control of existing pages.

self.clients.claim();


}
);

// =========================================
// FETCH
// =========================================

self.addEventListener(
"fetch",
(event) => {


const request =
  event.request;

const url =
  new URL(
    request.url
  );

// =====================================
// IGNORE NON-HTTP REQUESTS
// =====================================

if (
  url.protocol !== "http:" &&
  url.protocol !== "https:"
) {

  return;

}

// =====================================
// ONLY HANDLE GET REQUESTS
// =====================================

if (
  request.method !== "GET"
) {

  return;

}

// =====================================
// NAVIGATION REQUEST
//
// Example:
// /
// /about
// /routes
// /offers
// =====================================

if (
  request.mode ===
  "navigate"
) {

  event.respondWith(

    fetch(request)

      .then((response) => {

        // Cache successful pages.

        if (
          response &&
          response.status === 200
        ) {

          const responseClone =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

            });

        }

        return response;

      })

      .catch(() => {

        // =================================
        // INTERNET UNAVAILABLE
        // =================================

        return caches.match(
          request
        )

          .then(
            (cachedPage) => {

              if (cachedPage) {
                return cachedPage;
              }

              return caches.match(
                OFFLINE_PAGE
              );

            }
          );

      })

  );

  return;

}

// =====================================
// STATIC FILES / API / OTHER REQUESTS
// =====================================

event.respondWith(

  caches
    .match(request)

    .then((cachedResponse) => {

      // =================================
      // USE CACHE FIRST
      // =================================

      if (cachedResponse) {

        // Try to update the cached
        // resource in the background.

        fetch(request)
          .then((networkResponse) => {

            if (
              networkResponse &&
              networkResponse.status ===
                200 &&
              networkResponse.type ===
                "basic"
            ) {

              const responseClone =
                networkResponse.clone();

              caches
                .open(CACHE_NAME)
                .then((cache) => {

                  cache.put(
                    request,
                    responseClone
                  );

                });

            }

          })
          .catch(() => {
            // Internet unavailable.
            // Cached version is already
            // being returned.
          });

        return cachedResponse;

      }

      // =================================
      // NOT IN CACHE
      // TRY NETWORK
      // =================================

      return fetch(request)

        .then((response) => {

          if (
            !response ||
            response.status !== 200 ||
            response.type !==
              "basic"
          ) {

            return response;

          }

          const responseClone =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

            });

          return response;

        })

        .catch(() => {

          // =================================
          // NON-NAVIGATION OFFLINE REQUEST
          // =================================

          return new Response(
            "",
            {
              status: 503,
              statusText:
                "BusGo is offline"
            }
          );

        });

    })

);


}
);
