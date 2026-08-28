/* eslint-disable no-restricted-globals */

// =========================================
// BUSGO SERVICE WORKER
// =========================================
//
// Handles:
//
// 1. Offline/network caching
// 2. Web Push notifications
// 3. Notification clicks
//
// IMPORTANT
// -----------------------------------------
// - API requests are NEVER cached.
// - External resources are NOT handled.
// - Static resources use NETWORK FIRST.
// - Old BusGo caches are automatically removed.
// - Push notifications work even when the
//   BusGo page is not currently open, provided
//   browser/OS notification permission is allowed.
// =========================================


// =========================================
// CACHE CONFIGURATION
// =========================================

const CACHE_NAME = "busgo-cache-v8";

const OFFLINE_PAGE = "/offline.html";


// =========================================
// INSTALL
// =========================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.add(OFFLINE_PAGE).catch(() => {
          // Offline page is optional.
          // Do not fail service-worker installation
          // if the page cannot be cached.
          return undefined;
        });
      })
      .then(() => {
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


// =========================================
// ACTIVATE
// =========================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter(
          (cacheName) =>
            cacheName.startsWith("busgo-") &&
            cacheName !== CACHE_NAME
        );

        return Promise.all(
          oldCaches.map((cacheName) =>
            caches.delete(cacheName)
          )
        );
      })
      .then(() => {
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


// =========================================
// PUSH NOTIFICATION
// =========================================
//
// Backend payload example:
//
// {
//   "id": 123,
//   "title": "Booking Confirmed",
//   "message": "Your BusGo booking has been confirmed.",
//   "type": "booking",
//   "url": "/notifications"
// }
//
// =========================================

self.addEventListener("push", (event) => {
  let notificationData = {
    id: null,
    title: "BusGo",
    message: "You have a new notification.",
    type: "general",
    url: "/notifications"
  };


  // =======================================
  // READ PUSH PAYLOAD
  // =======================================

  if (event.data) {
    try {
      const data = event.data.json();

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
          notificationData.message = text;
        }
      } catch (textError) {
        console.error(
          "BUSGO PUSH TEXT PARSE ERROR:",
          textError
        );
      }
    }
  }


  // =======================================
  // CLEAN VALUES
  // =======================================

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


  // =======================================
  // SAFE NOTIFICATION URL
  // =======================================

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

    // Only allow BusGo's own origin.
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


  // =======================================
  // NOTIFICATION OPTIONS
  // =======================================

  const options = {
    body:
      message ||
      "You have a new notification.",

    icon: "/logo192.png",

    badge: "/logo192.png",

    tag: notificationId
      ? `busgo-notification-${notificationId}`
      : "busgo-notification",

    renotify: Boolean(notificationId),

    requireInteraction: false,

    data: {
      url: notificationUrl,

      notificationId,

      type
    }
  };


  // =======================================
  // DISPLAY NOTIFICATION
  // =======================================

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


// =========================================
// NOTIFICATION CLICK
// =========================================
//
// When the user clicks a notification:
//
// 1. Close the notification.
// 2. Find an existing BusGo tab.
// 3. Focus that tab.
// 4. Navigate it to the notification URL.
// 5. If no BusGo tab exists, open a new one.
//
// =========================================

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();


    const notificationData =
      event.notification.data || {};


    let targetUrl =
      "/notifications";


    // =======================================
    // VALIDATE TARGET URL
    // =======================================

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


    // =======================================
    // HANDLE WINDOW
    // =======================================

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {

          // ---------------------------------
          // FIND EXISTING BUSGO WINDOW
          // ---------------------------------

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


              // -------------------------------
              // NAVIGATE EXISTING BUSGO TAB
              // -------------------------------

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


          // ---------------------------------
          // OPEN NEW BUSGO WINDOW
          // ---------------------------------

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


// =========================================
// FETCH
// =========================================
//
// Strategy:
//
// API
// ------
// Network only.
//
// Navigation
// ------
// Network first.
// Offline page if network fails.
//
// Static resources
// ------
// Network first.
// Cached resource if network fails.
//
// =========================================

self.addEventListener(
  "fetch",
  (event) => {

    const request =
      event.request;


    // =======================================
    // ONLY GET REQUESTS
    // =======================================

    if (
      request.method !== "GET"
    ) {
      return;
    }


    // =======================================
    // ONLY HTTP / HTTPS
    // =======================================

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


    // =======================================
    // IGNORE EXTERNAL REQUESTS
    // =======================================

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }


    // =======================================
    // NEVER CACHE API REQUESTS
    // =======================================

    if (
      url.pathname.startsWith("/api/")
    ) {

      event.respondWith(
        fetch(request).catch(() => {
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


    // =======================================
    // NAVIGATION REQUESTS
    // =======================================

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


    // =======================================
    // STATIC RESOURCES
    // =======================================
    //
    // NETWORK FIRST
    //
    // This ensures users normally receive
    // the newest BusGo files.
    //
    // If the network fails, cached resources
    // are used instead.
    // =======================================

    event.respondWith(
      fetch(request)
        .then((response) => {

          // -------------------------------
          // CACHE SUCCESSFUL SAME-ORIGIN
          // RESPONSES
          // -------------------------------

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

          // -------------------------------
          // NETWORK FAILED
          // -------------------------------

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
