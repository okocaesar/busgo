import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// =========================================
// REGISTER SERVICE WORKER
// =========================================

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("/service-worker.js")
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

  });

}