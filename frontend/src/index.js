import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";

import AppUpdate from "./components/AppUpdate/AppUpdate";

// =========================================
// RENDER BUSGO
// =========================================

const root = ReactDOM.createRoot(
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
    document.getElementById("app-splash");

  if (!splash) {
    return;
  }

  setTimeout(() => {
    splash.classList.add("hidden");

    setTimeout(() => {
      if (splash) {
        splash.remove();
      }
    }, 450);
  }, 500);
};

// =========================================
// REMOVE OLD BUSGO SERVICE WORKERS
// =========================================
//
// BusGo does NOT depend on a service worker.
//
// Old service workers can continue controlling
// the Vercel site and serving stale files.
//
// We therefore unregister any previously
// installed BusGo service workers.
//
// IMPORTANT:
// We do NOT register a new service worker.
//

const removeOldServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations =
      await navigator.serviceWorker.getRegistrations();

    if (!registrations.length) {
      console.log(
        "BusGo: No service workers found."
      );

      return;
    }

    for (
      const registration of registrations
    ) {
      try {
        const removed =
          await registration.unregister();

        console.log(
          "BusGo old service worker removed:",
          removed
        );
      } catch (error) {
        console.warn(
          "BusGo could not remove old service worker:",
          error?.message || error
        );
      }
    }

  } catch (error) {
    console.warn(
      "BusGo service worker cleanup skipped:",
      error?.message || error
    );
  }
};

// =========================================
// CLEAR OLD CACHE STORAGE
// =========================================
//
// This is only cleanup.
//
// BusGo does not depend on CacheStorage.
//
// If the browser refuses access to CacheStorage,
// the application continues normally.
//

const clearOldCaches = async () => {
  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheNames =
      await window.caches.keys();

    if (!cacheNames.length) {
      return;
    }

    await Promise.all(
      cacheNames.map(
        async (cacheName) => {
          try {
            await window.caches.delete(
              cacheName
            );
          } catch (error) {
            console.warn(
              `BusGo could not remove cache "${cacheName}":`,
              error?.message || error
            );
          }
        }
      )
    );

    console.log(
      "BusGo old browser caches cleaned."
    );

  } catch (error) {
    console.warn(
      "BusGo cache cleanup skipped:",
      error?.message || error
    );
  }
};

// =========================================
// APP STARTUP
// =========================================

window.addEventListener(
  "load",
  async () => {

    hideSplashScreen();

    // =======================================
    // CLEAN OLD SERVICE WORKER
    // =======================================

    await removeOldServiceWorkers();

    // =======================================
    // CLEAN OLD CACHES
    // =======================================

    await clearOldCaches();

    console.log(
      "BusGo startup completed."
    );
  }
);