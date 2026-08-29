// ============================================================
// BUSGO PWA UPDATE MANAGER
// ============================================================

let updateRegistration = null;

let refreshing = false;


// ============================================================
// REGISTER SERVICE WORKER
// ============================================================

export function registerBusGoServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {

    console.warn(
      "BUSGO: Service workers are not supported."
    );

    return Promise.resolve(null);

  }


  return navigator.serviceWorker
    .register("/service-worker.js", {
      updateViaCache: "none"
    })

    .then((registration) => {

      updateRegistration =
        registration;


      console.log(
        "BUSGO SERVICE WORKER REGISTERED:",
        registration.scope
      );


      // ======================================================
      // CHECK FOR UPDATES
      // ======================================================

      registration.update()
        .catch((error) => {

          console.warn(
            "BUSGO SERVICE WORKER UPDATE CHECK ERROR:",
            error
          );

        });


      // ======================================================
      // NEW WORKER FOUND
      // ======================================================

      registration.addEventListener(
        "updatefound",
        () => {

          const newWorker =
            registration.installing;


          if (!newWorker) {
            return;
          }


          newWorker.addEventListener(
            "statechange",
            () => {

              console.log(
                "BUSGO SERVICE WORKER STATE:",
                newWorker.state
              );


              if (
                newWorker.state ===
                "installed"
              ) {

                if (
                  navigator.serviceWorker
                    .controller
                ) {

                  console.log(
                    "BUSGO: New update is ready."
                  );

                  window.dispatchEvent(
                    new CustomEvent(
                      "busgo-update-available",
                      {
                        detail: {
                          registration
                        }
                      }
                    )
                  );

                }

              }

            }
          );

        }
      );


      // ======================================================
      // CONTROLLER CHANGE
      // ======================================================

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {

          if (refreshing) {
            return;
          }


          refreshing = true;


          console.log(
            "BUSGO: New version activated. Reloading..."
          );


          window.location.reload();

        }
      );


      return registration;

    })

    .catch((error) => {

      console.error(
        "BUSGO SERVICE WORKER REGISTRATION ERROR:",
        error
      );

      return null;

    });

}


// ============================================================
// CHECK FOR UPDATE
// ============================================================

export async function checkBusGoForUpdate() {

  if (
    !("serviceWorker" in navigator)
  ) {

    return {
      supported: false,
      updateAvailable: false
    };

  }


  try {

    let registration =
      updateRegistration;


    if (!registration) {

      registration =
        await navigator.serviceWorker.getRegistration(
          "/"
        );

    }


    if (!registration) {

      registration =
        await navigator.serviceWorker.register(
          "/service-worker.js",
          {
            updateViaCache: "none"
          }
        );

      updateRegistration =
        registration;

    }


    console.log(
      "BUSGO: Checking for updates..."
    );


    // ======================================================
    // FORCE BROWSER TO CHECK SERVER
    // ======================================================

    await registration.update();


    // ======================================================
    // NEW WORKER ALREADY WAITING
    // ======================================================

    if (
      registration.waiting
    ) {

      return {
        supported: true,
        updateAvailable: true,
        registration
      };

    }


    // ======================================================
    // INSTALLING WORKER
    // ======================================================

    if (
      registration.installing
    ) {

      return await waitForInstallingWorker(
        registration
      );

    }


    // ======================================================
    // NO UPDATE
    // ======================================================

    return {
      supported: true,
      updateAvailable: false,
      registration
    };

  } catch (error) {

    console.error(
      "BUSGO UPDATE CHECK ERROR:",
      error
    );


    return {
      supported: true,
      updateAvailable: false,
      error
    };

  }

}


// ============================================================
// WAIT FOR NEW SERVICE WORKER
// ============================================================

function waitForInstallingWorker(
  registration
) {

  return new Promise((resolve) => {

    const worker =
      registration.installing;


    if (!worker) {

      resolve({

        supported: true,

        updateAvailable:
          Boolean(
            registration.waiting
          ),

        registration

      });

      return;

    }


    const timeout =
      setTimeout(() => {

        resolve({

          supported: true,

          updateAvailable:
            Boolean(
              registration.waiting
            ),

          registration

        });

      }, 15000);


    worker.addEventListener(
      "statechange",
      () => {

        if (
          worker.state ===
          "installed"
        ) {

          clearTimeout(timeout);


          resolve({

            supported: true,

            updateAvailable:
              Boolean(
                registration.waiting
              ),

            registration

          });

        }

      }
    );

  });

}


// ============================================================
// INSTALL UPDATE
// ============================================================

export async function installBusGoUpdate(
  registration = updateRegistration
) {

  if (!registration) {

    registration =
      await navigator.serviceWorker.getRegistration(
        "/"
      );

  }


  if (
    !registration
  ) {

    throw new Error(
      "BusGo service worker is not registered."
    );

  }


  const waitingWorker =
    registration.waiting;


  if (!waitingWorker) {

    return false;

  }


  console.log(
    "BUSGO: Activating new version..."
  );


  waitingWorker.postMessage({
    type: "SKIP_WAITING"
  });


  return true;

}


// ============================================================
// GET CURRENT REGISTRATION
// ============================================================

export function getBusGoUpdateRegistration() {

  return updateRegistration;

}