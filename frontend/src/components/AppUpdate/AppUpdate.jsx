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
// Whenever you deploy a new frontend build,
// increase this version.
//
// Example:
//
// 1.0.1 -> current version
// 1.0.2 -> next version
// 1.0.3 -> next version
//
// =========================================

const BUSGO_APP_VERSION = "1.0.1";

// =========================================
// APP UPDATE COMPONENT
// =========================================

function AppUpdate({ children }) {
  const [checking, setChecking] = useState(true);

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
        // REQUEST SERVER VERSION
        // =====================================
        //
        // IMPORTANT:
        //
        // Do NOT manually send Cache-Control
        // or Pragma headers here.
        //
        // They were causing:
        //
        // "Request header field cache-control
        // is not allowed..."
        //
        // =====================================

        const response = await axios.get(
          `${API_URL}/api/version`,
          {
            timeout: 10000,

            params: {
              version: BUSGO_APP_VERSION,
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
          BUSGO_APP_VERSION;

        const minimumVersion =
          serverData.minimumVersion ||
          latestVersion;

        // =====================================
        // LOG VERSION INFORMATION
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
          "Server version:",
          latestVersion
        );

        console.log(
          "Minimum version:",
          minimumVersion
        );

        console.log(
          "Server says update required:",
          serverData.updateRequired
        );

        console.log(
          "========================================="
        );

        // =====================================
        // COMPARE INSTALLED VERSION
        // =====================================

        const installedIsOlder =
          compareVersions(
            BUSGO_APP_VERSION,
            latestVersion
          ) < 0;

        // =====================================
        // CHECK MINIMUM VERSION
        // =====================================

        const belowMinimum =
          compareVersions(
            BUSGO_APP_VERSION,
            minimumVersion
          ) < 0;

        // =====================================
        // FINAL UPDATE DECISION
        // =====================================
        //
        // We calculate this locally instead of
        // blindly trusting updateRequired.
        //
        // This prevents a backend mistake from
        // forcing every user to update.
        //
        // =====================================

        const shouldUpdate =
          installedIsOlder ||
          belowMinimum;

        if (shouldUpdate) {
          setUpdateData({
            ...serverData,

            currentVersion:
              latestVersion,

            minimumVersion:
              minimumVersion
          });

          setUpdateRequired(true);
        } else {
          setUpdateData(null);

          setUpdateRequired(false);
        }

      } catch (error) {
        // =====================================
        // VERSION SERVER UNAVAILABLE
        // =====================================
        //
        // Never block BusGo because the version
        // server is temporarily unavailable.
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

    // =======================================
    // CLEANUP
    // =======================================

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
      // SERVICE WORKER
      // =====================================
      //
      // Service worker is OPTIONAL.
      //
      // We do NOT depend on it for updating.
      //
      // =====================================

      if (
        "serviceWorker" in navigator
      ) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();

          await Promise.all(
            registrations.map(
              async (registration) => {
                try {
                  await registration.unregister();
                } catch (error) {
                  console.warn(
                    "Unable to unregister BusGo service worker:",
                    error?.message || error
                  );
                }
              }
            )
          );
        } catch (error) {
          console.warn(
            "BusGo service worker cleanup skipped:",
            error?.message || error
          );
        }
      }

      // =====================================
      // CLEAR CACHE STORAGE
      // =====================================
      //
      // Some browsers / service workers can
      // throw CacheStorage errors.
      //
      // Therefore this is completely optional.
      //
      // =====================================

      if (
        "caches" in window
      ) {
        try {
          const cacheNames =
            await window.caches.keys();

          await Promise.all(
            cacheNames.map(
              (cacheName) =>
                window.caches.delete(
                  cacheName
                )
            )
          );
        } catch (error) {
          console.warn(
            "BusGo cache cleanup skipped:",
            error?.message || error
          );
        }
      }

    } catch (error) {
      console.warn(
        "BusGo update cleanup encountered an issue:",
        error?.message || error
      );
    }

    // =========================================
    // FORCE FRESH APPLICATION LOAD
    // =========================================
    //
    // The query parameter prevents the browser
    // from simply displaying an old cached page.
    //
    // =========================================

    const currentUrl =
      new URL(
        window.location.href
      );

    currentUrl.searchParams.set(
      "busgo_update",
      Date.now().toString()
    );

    window.location.replace(
      currentUrl.toString()
    );
  };

  // =========================================
  // CHECKING SCREEN
  // =========================================

  if (checking) {
    return (
      <div className="app-update-loading">
        <div className="app-update-loader"></div>

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
    String(versionA || "0.0.0")
      .replace(/^v/i, "")
      .split(".")
      .map(Number);

  const b =
    String(versionB || "0.0.0")
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
      Number.isFinite(a[index])
        ? a[index]
        : 0;

    const valueB =
      Number.isFinite(b[index])
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