import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";

import AppUpdate
  from "./components/AppUpdate/AppUpdate";

// =========================================
// RENDER BUSGO
// =========================================

const root =
  ReactDOM.createRoot(
    document.getElementById("root")
  );

root.render(
  <React.StrictMode>
    <AppUpdate>
      <App />
    </AppUpdate>
  </React.StrictMode>
);

// =========================================
// HIDE BUSGO SPLASH SCREEN
// =========================================

const hideSplashScreen = () => {

  const splash =
    document.getElementById(
      "app-splash"
    );

  if (!splash) {
    return;
  }

  setTimeout(() => {

    splash.classList.add(
      "hidden"
    );

    setTimeout(() => {

      if (splash) {
        splash.remove();
      }

    }, 450);

  }, 500);
};

// =========================================
// REGISTER SERVICE WORKER
// =========================================
//
// Service workers are optional for BusGo.
// A service-worker failure must NEVER
// interfere with the application itself.
//
// During local development, we skip
// registration completely.
//
// =========================================

const registerServiceWorker = async () => {

  if (!("serviceWorker" in navigator)) {
    return;
  }

  // =======================================
  // DO NOT REGISTER SERVICE WORKER LOCALLY
  // =======================================

  if (
    window.location.hostname ===
    "localhost" ||
    window.location.hostname ===
    "127.0.0.1"
  ) {

    console.log(
      "BusGo service worker skipped during local development."
    );

    return;
  }

  try {

    const registration =
      await navigator.serviceWorker.register(
        "/service-worker.js"
      );

    console.log(
      "BusGo service worker registered:",
      registration.scope
    );

    // =====================================
    // CHECK FOR UPDATED SERVICE WORKER
    // =====================================

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

            if (
              newWorker.state ===
              "installed"
            ) {

              if (
                navigator
                  .serviceWorker
                  .controller
              ) {

                console.log(
                  "A new BusGo version is available."
                );

              } else {

                console.log(
                  "BusGo is ready for offline use."
                );

              }
            }

          }
        );

      }
    );

  } catch (error) {

    // =====================================
    // IMPORTANT
    // =====================================
    //
    // Do NOT use console.error here.
    //
    // A service worker is optional and
    // failure must not make the browser
    // console look like BusGo has crashed.
    //
    console.warn(
      "BusGo service worker is unavailable. The app will continue normally.",
      error
    );

  }
};

// =========================================
// APP STARTUP
// =========================================

window.addEventListener(
  "load",
  () => {

    hideSplashScreen();

    registerServiceWorker();

  }
);