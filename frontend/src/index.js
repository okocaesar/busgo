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
  const splash = document.getElementById("app-splash");

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
// SERVICE WORKER
// =========================================
//
// IMPORTANT:
//
// Service workers can cache an old React build.
// This can make a new Vercel deployment appear
// not to have updated.
//
// For now BusGo does NOT register a service
// worker.
//
// This gives us a clean deployment environment
// while the frontend/backend deployment is being
// fixed.
//
// We also unregister any OLD BusGo service
// workers that may already be installed in the
// user's browser.
//
// =========================================

const disableOldServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations =
      await navigator.serviceWorker.getRegistrations();

    if (!registrations.length) {
      return;
    }

    for (const registration of registrations) {
      const success =
        await registration.unregister();

      if (success) {
        console.log(
          "BusGo old service worker removed."
        );
      }
    }

    // =======================================
    // CLEAR OLD BUSGO CACHE
    // =======================================

    if ("caches" in window) {
      const cacheNames =
        await caches.keys();

      for (const cacheName of cacheNames) {
        try {
          await caches.delete(cacheName);

          console.log(
            "BusGo old cache removed:",
            cacheName
          );
        } catch (cacheError) {
          console.warn(
            "Unable to remove cache:",
            cacheName,
            cacheError
          );
        }
      }
    }

  } catch (error) {
    console.warn(
      "BusGo could not remove old service worker/cache.",
      error
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

    await disableOldServiceWorkers();

    console.log(
      "BusGo started without service worker caching."
    );
  }
);
