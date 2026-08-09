/* eslint-disable no-restricted-globals */

const CACHE_NAME = "busgo-cache-v4";

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

    caches.open(CACHE_NAME)
      .then((cache) => {

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

    caches.keys()
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


  self.clients.claim();

});



// =========================================
// FETCH
// =========================================

self.addEventListener("fetch", (event) => {


  const url = new URL(
    event.request.url
  );


  // Ignore browser extensions
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {

    return;

  }



  event.respondWith(

    caches.match(event.request)

      .then((cachedResponse) => {


        // Return cached file
        if (cachedResponse) {

          return cachedResponse;

        }



        return fetch(event.request)

          .then((response) => {


            // Only cache successful responses
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {

              return response;

            }



            const responseClone =
              response.clone();



            caches.open(CACHE_NAME)

              .then((cache) => {

                cache.put(
                  event.request,
                  responseClone
                );

              });



            return response;


          })

          .catch(() => {


            // Offline fallback
            return caches.match(
              "/index.html"
            );


          });


      })

  );


});