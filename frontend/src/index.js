import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";

// =========================================
// RENDER BUSGO
// =========================================

const root = ReactDOM.createRoot(
document.getElementById("root")
);

root.render(
<React.StrictMode> <App />
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
// REGISTER SERVICE WORKER
// =========================================

const registerServiceWorker = () => {

if (!("serviceWorker" in navigator)) {
return;
}

navigator.serviceWorker
.register("/service-worker.js")
.then((registration) => {


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
              navigator.serviceWorker
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

})
.catch((error) => {

  console.error(
    "BusGo service worker registration failed:",
    error
  );

});


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