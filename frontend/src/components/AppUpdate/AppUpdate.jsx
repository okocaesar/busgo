import React, { useEffect, useState } from "react";
import axios from "axios";

import { API_URL } from "../../api";

import "./AppUpdate.css";


// =========================================
// BUSGO CURRENT APP VERSION
// =========================================
//
// Change this whenever you publish a new
// frontend version.
//
// Example:
//
// 1.0.0 → old version
// 1.0.1 → new version
//
// =========================================

const BUSGO_APP_VERSION = "1.0.1";


// =========================================
// APP UPDATE COMPONENT
// =========================================

function AppUpdate({ children }) {

  const [checking, setChecking] =
    useState(true);

  const [updateRequired, setUpdateRequired] =
    useState(false);

  const [updateData, setUpdateData] =
    useState(null);


  // =========================================
  // CHECK BUSGO VERSION
  // =========================================

  useEffect(() => {

    let mounted = true;


    const checkVersion = async () => {

      try {

        const response =
          await axios.get(
            `${API_URL}/api/version`,
            {
              timeout: 10000
            }
          );


        if (!mounted) {
          return;
        }


        const serverData =
          response.data || {};


        const minimumVersion =
          serverData.minimumVersion ||
          serverData.currentVersion ||
          BUSGO_APP_VERSION;


        const serverVersion =
          serverData.currentVersion ||
          BUSGO_APP_VERSION;


        console.log(
          "========================================="
        );

        console.log(
          "BUSGO VERSION CHECK"
        );

        console.log(
          "Installed version:",
          BUSGO_APP_VERSION
        );

        console.log(
          "Latest version:",
          serverVersion
        );

        console.log(
          "Minimum version:",
          minimumVersion
        );

        console.log(
          "========================================="
        );


        // =====================================
        // VERSION COMPARISON
        // =====================================

        const installedIsOld =
          compareVersions(
            BUSGO_APP_VERSION,
            minimumVersion
          ) < 0;


        if (
          installedIsOld ||
          serverData.updateRequired === true
        ) {

          setUpdateData({
            ...serverData,
            currentVersion:
              serverVersion,
            minimumVersion
          });

          setUpdateRequired(true);

        } else {

          setUpdateRequired(false);

        }


      } catch (error) {

        console.error(
          "BusGo version check failed:",
          error
        );


        // =====================================
        // IMPORTANT
        // =====================================
        //
        // If the version server cannot be
        // reached, allow the user to continue.
        //
        // This prevents a temporary backend
        // outage from locking everybody out.
        //
        // =====================================

        if (mounted) {

          setUpdateRequired(false);

        }

      } finally {

        if (mounted) {

          setChecking(false);

        }

      }

    };


    checkVersion();


    return () => {

      mounted = false;

    };

  }, []);


  // =========================================
  // UPDATE BUSGO
  // =========================================

  const updateApp = async () => {

    try {

      // =====================================
      // ASK SERVICE WORKER TO CHECK FOR
      // NEW FILES
      // =====================================

      if (
        "serviceWorker" in navigator
      ) {

        const registration =
          await navigator.serviceWorker
            .getRegistration();


        if (registration) {

          await registration.update();

        }

      }

    } catch (error) {

      console.error(
        "Service worker update check failed:",
        error
      );

    }


    // =========================================
    // CLEAR BROWSER CACHE
    // =========================================

    try {

      if (
        "caches" in window
      ) {

        const cacheNames =
          await caches.keys();


        await Promise.all(
          cacheNames.map(
            (cacheName) =>
              caches.delete(
                cacheName
              )
          )
        );

      }

    } catch (error) {

      console.error(
        "Unable to clear BusGo cache:",
        error
      );

    }


    // =========================================
    // RELOAD APPLICATION
    // =========================================

    window.location.reload(
      true
    );

  };


  // =========================================
  // CHECKING SCREEN
  // =========================================

  if (checking) {

    return (
      <div className="app-update-loading">

        <div className="app-update-loader">
        </div>

        <h2>
          Checking BusGo...
        </h2>

        <p>
          Checking for the latest version.
        </p>

      </div>
    );

  }


  // =========================================
  // UPDATE REQUIRED
  // =========================================

  if (updateRequired) {

    return (

      <div className="app-update-screen">

        <div className="app-update-card">

          <div className="app-update-icon">
            ↻
          </div>


          <h1>
            BusGo Update Required
          </h1>


          <p className="app-update-message">

            A new version of BusGo is available.
            Please update the app to continue.

          </p>


          <div className="app-version-info">

            <div>

              <span>
                Your version
              </span>

              <strong>
                {BUSGO_APP_VERSION}
              </strong>

            </div>


            <div>

              <span>
                Latest version
              </span>

              <strong>
                {updateData?.currentVersion ||
                  updateData?.minimumVersion ||
                  "New version"}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="app-update-button"
            onClick={updateApp}
          >

            Update BusGo

          </button>


          <p className="app-update-note">

            Please update before continuing
            to use BusGo.

          </p>

        </div>

      </div>

    );

  }


  // =========================================
  // NORMAL BUSGO APPLICATION
  // =========================================

  return children;

}


// =========================================
// VERSION COMPARISON
// =========================================

function compareVersions(
  versionA,
  versionB
) {

  const a =
    String(versionA)
      .replace(/^v/i, "")
      .split(".")
      .map(Number);


  const b =
    String(versionB)
      .replace(/^v/i, "")
      .split(".")
      .map(Number);


  const length =
    Math.max(
      a.length,
      b.length
    );


  for (
    let index = 0;
    index < length;
    index++
  ) {

    const valueA =
      Number.isFinite(
        a[index]
      )
        ? a[index]
        : 0;


    const valueB =
      Number.isFinite(
        b[index]
      )
        ? b[index]
        : 0;


    if (valueA > valueB) {
      return 1;
    }


    if (valueA < valueB) {
      return -1;
    }

  }


  return 0;

}


export default AppUpdate;