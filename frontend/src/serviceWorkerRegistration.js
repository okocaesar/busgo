const isLocalhost =
  Boolean(
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );


export function register() {

  if (
    process.env.NODE_ENV === "production" &&
    "serviceWorker" in navigator
  ) {

    window.addEventListener(
      "load",
      () => {

        const swUrl =
          `${process.env.PUBLIC_URL}/service-worker.js`;


        if (isLocalhost) {

          checkValidServiceWorker(swUrl);

        } else {

          registerValidSW(swUrl);

        }

      }
    );

  }

}


function registerValidSW(swUrl) {

  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {

      console.log(
        "BusGo service worker registered:",
        registration
      );

    })
    .catch((error) => {

      console.error(
        "BusGo service worker registration failed:",
        error
      );

    });

}


function checkValidServiceWorker(swUrl) {

  fetch(swUrl, {
    headers: {
      "Service-Worker": "script"
    }
  })
    .then((response) => {

      const contentType =
        response.headers.get(
          "content-type"
        );


      if (
        response.status === 404 ||
        (
          contentType != null &&
          !contentType.includes(
            "javascript"
          )
        )
      ) {

        navigator.serviceWorker
          .ready
          .then((registration) => {

            registration.unregister()
              .then(() => {

                window.location.reload();

              });

          });

      } else {

        registerValidSW(swUrl);

      }

    })
    .catch(() => {

      console.log(
        "No internet connection. BusGo is running from cache."
      );

    });

}


export function unregister() {

  if (
    "serviceWorker" in navigator
  ) {

    navigator.serviceWorker
      .ready
      .then((registration) => {

        registration.unregister();

      });

  }

}