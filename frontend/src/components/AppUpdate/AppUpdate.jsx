import React, { useEffect, useState } from "react";
import axios from "axios";

import { API_URL } from "../../api";

import "./AppUpdate.css";

// =========================================
// BUSGO INSTALLED APP VERSION
// =========================================
//
// IMPORTANT:
//
// This value represents the version of the
// frontend bundle currently installed.
//
// Whenever you publish a NEW frontend build,
// change this version.
//
// Example:
//
// 1.0.1 → current installed version
// 1.0.2 → new deployed version
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

        // =====================================
        // REQUEST CURRENT SERVER VERSION
        // =====================================

        const response =
          await axios.get(
            `${API_URL}/api/version`,
            {
              timeout: 5000,

              // Prevent browser/proxy caching
              // of the version response.
              headers: {
                "Cache-Control":
                  "no-cache",
                "Pragma":
                  "no-cache"
              },

              params: {
                t: Date.now()
              }
            }
          );

        if (!mounted) {
          return;
        }

        const serverData =
          response.data || {};

        // =====================================
        // SERVER VERSION
        // =====================================

        const latestVersion =
          serverData.currentVersion ||
          serverData.minimumVersion ||
          BUSGO_APP_VERSION;

        const minimumVersion =
          serverData.minimumVersion ||
          latestVersion;

        // =====================================
        // VERSION LOG
        // =====================================

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
          latestVersion
        );

        console.log(
          "Minimum version:",
          minimumVersion
        );

        console.log(
          "========================================="
        );

        // =====================================
        // DETERMINE WHETHER UPDATE IS NEEDED
        // =====================================
        //
        // The update screen appears ONLY when
        // the installed version is older than
        // the server version.
        //
        // =====================================

        const installedIsOlder =
          compareVersions(
            BUSGO_APP_VERSION,
            latestVersion
          ) < 0;

        // =====================================
        // MINIMUM VERSION CHECK
        // =====================================
        //
        // If the backend specifies a minimum
        // supported version, an older frontend
        // must update.
        //
        // =====================================

        const belowMinimum =
          compareVersions(
            BUSGO_APP_VERSION,
            minimumVersion
          ) < 0;

        // =====================================
        // UPDATE REQUIRED
        // =====================================

        if (
          installedIsOlder ||
          belowMinimum
        ) {

          setUpdateData({
            ...serverData,

            currentVersion:
              latestVersion,

            minimumVersion
          });

          setUpdateRequired(true);

        } else {

          // ===================================
          // CURRENT VERSION
          // ===================================

          setUpdateData(null);

          setUpdateRequired(false);

        }

      } catch (error) {

        // =====================================
        // VERSION SERVER UNAVAILABLE
        // =====================================
        //
        // Do NOT block the BusGo application
        // if the version endpoint is temporarily
        // unavailable.
        //
        // =====================================

        console.warn(
          "BusGo version check unavailable. Continuing with current app version.",
          error?.message || error
        );

        if (mounted) {

          setUpdateRequired(false);

          setUpdateData(null);

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
      // CHECK SERVICE WORKER
      // =====================================

      if (
        "serviceWorker" in navigator
      ) {

        const registration =
          await navigator.serviceWorker
            .getRegistration();

        if (registration) {

          try {

            await registration.update();

          } catch (error) {

            console.warn(
              "BusGo service worker update check skipped:",
              error?.message || error
            );

          }

        }

      }

    } catch (error) {

      console.warn(
        "BusGo service worker update unavailable:",
        error?.message || error
      );

    }

    // =========================================
    // CLEAR BUSGO CACHE
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

      console.warn(
        "Unable to clear BusGo cache:",
        error?.message || error
      );

    }

    // =========================================
    // FORCE APPLICATION RELOAD
    // =========================================
    //
    // The browser will request the latest
    // deployed BusGo files.
    //
    // =========================================

    window.location.reload();

  };

  // =========================================
  // CHECKING SCREEN
  // =========================================
  //
  // Keep this very short.
  //
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
  //
  // This screen ONLY appears when:
  //
  // Installed version < server version
  //
  // =========================================

  if (updateRequired) {

    return (

      <div className="app-update-screen">

        <div className="app-update-card">

          <div className="app-update-icon">
            ↻
          </div>

          <h1>
            BusGo Update Available
          </h1>

          <p className="app-update-message">

            A newer version of BusGo is
            available.

            <br />

            Update now to get the latest
            improvements and features.

          </p>

          {/* ================================= */}
          {/* VERSION INFORMATION */}
          {/* ================================= */}

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
                New version
              </span>

              <strong>
                {
                  updateData?.currentVersion ||
                  updateData?.minimumVersion ||
                  "New version"
                }
              </strong>

            </div>

          </div>

          {/* ================================= */}
          {/* UPDATE BUTTON */}
          {/* ================================= */}

          <button
            type="button"
            className="app-update-button"
            onClick={updateApp}
          >

            Update BusGo

          </button>

          <p className="app-update-note">

            Please update BusGo to continue
            using the latest version.

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

    if (
      valueA > valueB
    ) {

      return 1;

    }

    if (
      valueA < valueB
    ) {

      return -1;

    }

  }

  return 0;

}

export default AppUpdate;