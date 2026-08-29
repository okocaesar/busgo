/* eslint-disable no-restricted-globals */

// ============================================================
// BUSGO SERVICE WORKER
// ============================================================
//
// Handles:
// 1. Offline/network caching
// 2. Web Push notifications
// 3. Notification clicks
// 4. Automatic removal of old BusGo caches
// 5. PWA update activation
//
// ============================================================


// ============================================================
// CACHE CONFIGURATION
// ============================================================

const CACHE_NAME = "busgo-cache-v11";

const OFFLINE_PAGE = "/offline.html";


// ============================================================
// INSTALL
// ============================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache
          .add(OFFLINE_PAGE)
          .catch(() => {
            return undefined;
          });
      })
      .then(() => {

        // IMPORTANT:
        // Install the new service worker immediately.
        return self.skipWaiting();

      })
      .catch((error) => {
        console.error(
          "BUSGO SERVICE WORKER INSTALL ERROR:",
          error
        );
      })
  );
});


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener("activate", (event) => {
  event.waitUntil(

    caches
      .keys()

      .then((cacheNames) => {

        const oldCaches =
          cacheNames.filter(
            (cacheName) =>
              cacheName.startsWith("busgo-") &&
              cacheName !== CACHE_NAME
          );

        return Promise.all(
          oldCaches.map((cacheName) => {

            console.log(
              "BUSGO: Removing old cache:",
              cacheName
            );

            return caches.delete(cacheName);

          })
        );

      })

      .then(() => {

        // Take control of all open BusGo pages.
        return self.clients.claim();

      })

      .catch((error) => {

        console.error(
          "BUSGO SERVICE WORKER ACTIVATION ERROR:",
          error
        );

      })

  );
});


// ============================================================
// MESSAGE HANDLER
// ============================================================
//
// This is what allows the frontend's
// "Update Now" button to tell the waiting
// service worker to activate immediately.
//
// ============================================================

self.addEventListener("message", (event) => {

  if (!event.data) {
    return;
  }

  if (
    event.data.type === "SKIP_WAITING"
  ) {

    self.skipWaiting();

  }

});


// ============================================================
// PUSH NOTIFICATION
// ============================================================

self.addEventListener("push", (event) => {

  let notificationData = {

    id: null,

    title: "BusGo",

    message:
      "You have a new notification.",

    type: "general",

    url: "/notifications"

  };


  // ==========================================================
  // READ PUSH PAYLOAD
  // ==========================================================

  if (event.data) {

    try {

      const data =
        event.data.json();

      if (
        data &&
        typeof data === "object"
      ) {

        notificationData = {
          ...notificationData,
          ...data
        };

      }

    } catch (jsonError) {

      console.error(
        "BUSGO PUSH JSON PARSE ERROR:",
        jsonError
      );

      try {

        const text =
          event.data.text();

        if (text) {

          notificationData.message =
            text;

        }

      } catch (textError) {

        console.error(
          "BUSGO PUSH TEXT PARSE ERROR:",
          textError
        );

      }

    }

  }


  // ==========================================================
  // CLEAN VALUES
  // ==========================================================

  const title =
    String(
      notificationData.title ||
      "BusGo"
    ).trim();


  const message =
    String(
      notificationData.message ||
      "You have a new notification."
    ).trim();


  const type =
    String(
      notificationData.type ||
      "general"
    ).trim();


  const notificationId =
    notificationData.id || null;


  // ==========================================================
  // SAFE NOTIFICATION URL
  // ==========================================================

  let notificationUrl =
    "/notifications";


  try {

    const requestedUrl =
      new URL(
        String(
          notificationData.url ||
          "/notifications"
        ),
        self.location.origin
      );


    if (
      requestedUrl.origin ===
      self.location.origin
    ) {

      notificationUrl =
        requestedUrl.pathname +
        requestedUrl.search +
        requestedUrl.hash;

    }

  } catch (urlError) {

    console.warn(
      "BUSGO INVALID NOTIFICATION URL:",
      urlError
    );

  }


  // ==========================================================
  // NOTIFICATION OPTIONS
  // ==========================================================

  const options = {

    body:
      message ||
      "You have a new notification.",

    icon:
      "/icons/icon-192.png",

    badge:
      "/icons/icon-192.png",

    tag:
      notificationId
        ? `busgo-notification-${notificationId}`
        : "busgo-notification",

    renotify:
      Boolean(notificationId),

    requireInteraction:
      false,

    data: {

      url:
        notificationUrl,

      notificationId,

      type

    }

  };


  // ==========================================================
  // DISPLAY NOTIFICATION
  // ==========================================================

  event.waitUntil(

    self.registration
      .showNotification(
        title || "BusGo",
        options
      )
      .catch((error) => {

        console.error(
          "BUSGO SHOW NOTIFICATION ERROR:",
          error
        );

      })

  );

});


// ============================================================
// NOTIFICATION CLICK
// ============================================================

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();


    const notificationData =
      event.notification.data || {};


    let targetUrl =
      "/notifications";


    // ========================================================
    // VALIDATE TARGET URL
    // ========================================================

    try {

      const requestedUrl =
        new URL(
          String(
            notificationData.url ||
            "/notifications"
          ),
          self.location.origin
        );


      if (
        requestedUrl.origin ===
        self.location.origin
      ) {

        targetUrl =
          requestedUrl.pathname +
          requestedUrl.search +
          requestedUrl.hash;

      }

    } catch (error) {

      console.warn(
        "BUSGO NOTIFICATION CLICK URL ERROR:",
        error
      );

    }


    const absoluteTargetUrl =
      new URL(
        targetUrl,
        self.location.origin
      ).href;


    // ========================================================
    // HANDLE WINDOW
    // ========================================================

    event.waitUntil(

      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })

        .then((clientList) => {

          // ==================================================
          // FIND EXISTING BUSGO WINDOW
          // ==================================================

          for (
            const client of clientList
          ) {

            try {

              const clientUrl =
                new URL(client.url);


              if (
                clientUrl.origin !==
                self.location.origin
              ) {

                continue;

              }


              // ==============================================
              // NAVIGATE EXISTING BUSGO WINDOW
              // ==============================================

              if (
                "navigate" in client &&
                "focus" in client
              ) {

                return client
                  .navigate(
                    absoluteTargetUrl
                  )
                  .then(() => {

                    return client.focus();

                  })
                  .catch(() => {

                    return client.focus();

                  });

              }

            } catch (error) {

              console.warn(
                "BUSGO CLIENT URL ERROR:",
                error
              );

            }

          }


          // ==================================================
          // OPEN NEW BUSGO WINDOW
          // ==================================================

          if (
            "openWindow" in self.clients
          ) {

            return self.clients.openWindow(
              absoluteTargetUrl
            );

          }


          return undefined;

        })

        .catch((error) => {

          console.error(
            "BUSGO NOTIFICATION CLICK ERROR:",
            error
          );

        })

    );

  }
);


// ============================================================
// FETCH
// ============================================================

self.addEventListener(
  "fetch",
  (event) => {

    const request =
      event.request;


    // ========================================================
    // ONLY GET REQUESTS
    // ========================================================

    if (
      request.method !== "GET"
    ) {

      return;

    }


    // ========================================================
    // ONLY HTTP / HTTPS
    // ========================================================

    let url;


    try {

      url =
        new URL(request.url);

    } catch (error) {

      console.warn(
        "BUSGO INVALID REQUEST URL:",
        error
      );

      return;

    }


    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {

      return;

    }


    // ========================================================
    // IGNORE EXTERNAL REQUESTS
    // ========================================================

    if (
      url.origin !==
      self.location.origin
    ) {

      return;

    }


    // ========================================================
    // NEVER CACHE API REQUESTS
    // ========================================================

    if (
      url.pathname.startsWith("/api/")
    ) {

      event.respondWith(

        fetch(request)
          .catch(() => {

            return new Response(

              JSON.stringify({

                success: false,

                message:
                  "BusGo API is currently unavailable."

              }),

              {

                status: 503,

                headers: {

                  "Content-Type":
                    "application/json"

                }

              }

            );

          })

      );

      return;

    }


    // ========================================================
    // VERSION FILE
    // ========================================================

    if (
      url.pathname === "/version.json"
    ) {

      event.respondWith(

        fetch(
          `${url.pathname}?t=${Date.now()}`,
          {
            cache: "no-store"
          }
        )

      );

      return;

    }


    // ========================================================
    // MANIFEST
    // ========================================================

    if (
      url.pathname === "/manifest.json"
    ) {

      event.respondWith(

        fetch(
          `${url.pathname}?t=${Date.now()}`,
          {
            cache: "no-store"
          }
        )

      );

      return;

    }


    // ========================================================
    // SERVICE WORKER ITSELF
    // ========================================================
    //
    // Always fetch the newest service-worker.js.
    //
    // ========================================================

    if (
      url.pathname ===
      "/service-worker.js"
    ) {

      event.respondWith(

        fetch(
          `${url.pathname}?t=${Date.now()}`,
          {
            cache: "no-store"
          }
        )

      );

      return;

    }


    // ========================================================
    // NAVIGATION REQUESTS
    // ========================================================

    if (
      request.mode === "navigate"
    ) {

      event.respondWith(

        fetch(request)

          .then((response) => {

            return response;

          })

          .catch(() => {

            return caches.match(
              OFFLINE_PAGE
            );

          })

      );

      return;

    }


    // ========================================================
    // STATIC RESOURCES
    // ========================================================
    //
    // NETWORK FIRST
    //
    // ========================================================

    event.respondWith(

      fetch(request)

        .then((response) => {

          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {

            const responseClone =
              response.clone();


            caches
              .open(CACHE_NAME)

              .then((cache) => {

                return cache.put(
                  request,
                  responseClone
                );

              })

              .catch((error) => {

                console.warn(
                  "BUSGO CACHE WRITE ERROR:",
                  error
                );

              });

          }


          return response;

        })

        .catch(() => {

          return caches
            .match(request)

            .then(
              (cachedResponse) => {

                if (
                  cachedResponse
                ) {

                  return cachedResponse;

                }


                return new Response(
                  "",
                  {
                    status: 503,
                    statusText:
                      "BusGo is offline"
                  }
                );

              }
            );

        })

    );

  }
);