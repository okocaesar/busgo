import React, { useEffect, useState } from "react";
import {
  NavLink,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  FiHome,
  FiMap,
  FiTag,
  FiInfo,
  FiBell,
  FiUser,
  FiGrid,
  FiTicket,
  FiUsers,
  FiMenu,
  FiX,
  FiSettings,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiLogIn,
  FiUserPlus,
  FiLogOut,
  FiChevronDown,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";

import "./Navbar.css";

/*
|--------------------------------------------------------------------------
| PACKAGE VERSION
|--------------------------------------------------------------------------
| This imports the version directly from your frontend package.json.
|
| If Navbar.jsx is located inside:
|
| src/components/Navbar/
|
| then ../../package.json normally points to:
|
| project-root/package.json
|
| If your Navbar.jsx is located somewhere else, adjust the path.
|--------------------------------------------------------------------------
*/

import packageJson from "../../package.json";

const CURRENT_APP_VERSION = packageJson.version;


/*
|--------------------------------------------------------------------------
| NAVBAR COMPONENT
|--------------------------------------------------------------------------
*/

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | MENUS
  |--------------------------------------------------------------------------
  */

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | APP VERSION
  |--------------------------------------------------------------------------
  */

  const [appVersion, setAppVersion] = useState(
    CURRENT_APP_VERSION || "Unknown"
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATE
  |--------------------------------------------------------------------------
  */

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CHECK LOGIN STATUS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const checkAuth = () => {
      /*
       * This supports several common localStorage keys.
       *
       * If your project uses a different key, add it here.
       */

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("userToken");

      const user =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        localStorage.getItem("busgo_user");

      setIsLoggedIn(Boolean(token || user));
    };

    checkAuth();

    /*
     * Listen for login/logout changes from other components.
     */

    window.addEventListener("storage", checkAuth);

    /*
     * Custom event can be dispatched after login/logout:
     *
     * window.dispatchEvent(new Event("authChanged"));
     */

    window.addEventListener("authChanged", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChanged", checkAuth);
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | CLOSE MENUS WHEN ROUTE CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMobileMenuOpen(false);
    setSettingsOpen(false);
  }, [location.pathname]);


  /*
  |--------------------------------------------------------------------------
  | CLOSE MENUS WHEN CLICKING OUTSIDE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !event.target.closest(".navbar-settings-wrapper") &&
        !event.target.closest(".mobile-menu-wrapper")
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | PREVENT BODY SCROLL WHEN MOBILE MENU IS OPEN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("navbar-menu-open");
    } else {
      document.body.classList.remove("navbar-menu-open");
    }

    return () => {
      document.body.classList.remove("navbar-menu-open");
    };
  }, [mobileMenuOpen]);


  /*
  |--------------------------------------------------------------------------
  | GET CURRENT VERSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setAppVersion(CURRENT_APP_VERSION || "Unknown");
  }, []);


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    /*
     * Remove common authentication values.
     */

    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userToken");

    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("busgo_user");

    /*
     * Close menus.
     */

    setSettingsOpen(false);
    setMobileMenuOpen(false);

    /*
     * Update authentication state.
     */

    setIsLoggedIn(false);

    /*
     * Tell other components that authentication changed.
     */

    window.dispatchEvent(new Event("authChanged"));

    /*
     * Return user to home.
     */

    navigate("/");
  };


  /*
  |--------------------------------------------------------------------------
  | CHECK APPLICATION UPDATE
  |--------------------------------------------------------------------------
  |
  | The production application should expose:
  |
  | /version.json
  |
  | Example:
  |
  | {
  |   "version": "1.1.0"
  | }
  |
  |--------------------------------------------------------------------------
  */

  const checkForUpdate = async () => {
    if (checkingUpdate) return;

    setCheckingUpdate(true);
    setUpdateMessage("");
    setUpdateAvailable(false);

    try {
      /*
       * Add timestamp to prevent browser cache from returning
       * an old version.json.
       */

      const response = await fetch(
        `/version.json?t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("Unable to check application version.");
      }

      const data = await response.json();

      const latestVersion =
        data?.version ||
        data?.appVersion ||
        data?.latestVersion;

      if (!latestVersion) {
        throw new Error("Latest application version was not found.");
      }


      /*
       * Current version.
       */

      const currentVersion = String(appVersion);


      /*
       * Compare versions.
       */

      if (latestVersion !== currentVersion) {
        setUpdateAvailable(true);

        setUpdateMessage(
          `A new version (${latestVersion}) is available. Updating...`
        );

        /*
         * Give the user a short moment to see the message.
         */

        setTimeout(() => {
          /*
           * Reload the application.
           *
           * The browser will request the newest deployed bundle.
           */

          window.location.reload();
        }, 1500);

      } else {
        setUpdateMessage(
          `Your app is up to date (${currentVersion}).`
        );
      }

    } catch (error) {
      console.error("Update check failed:", error);

      setUpdateMessage(
        "Unable to check for updates. Please try again."
      );
    } finally {
      setTimeout(() => {
        setCheckingUpdate(false);
      }, 1500);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | APP VERSION DISPLAY
  |--------------------------------------------------------------------------
  */

  const showAppVersion = () => {
    setMobileMenuOpen(false);

    alert(
      `BusGo App Version\n\nCurrent version: ${appVersion}`
    );
  };


  /*
  |--------------------------------------------------------------------------
  | SETTINGS MENU NAVIGATION
  |--------------------------------------------------------------------------
  */

  const goToSettingsPage = (path) => {
    setSettingsOpen(false);
    setMobileMenuOpen(false);
    navigate(path);
  };


  /*
  |--------------------------------------------------------------------------
  | MOBILE NAVIGATION
  |--------------------------------------------------------------------------
  */

  const mobileNavigate = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };


  /*
  |--------------------------------------------------------------------------
  | ACTIVE ROUTE HELPER
  |--------------------------------------------------------------------------
  */


  return (
    <>
      {/* =========================================================
          DESKTOP / TABLET NAVBAR
          ========================================================= */}

      <header className="navbar">

        {/* =====================================================
            LOGO
            ===================================================== */}

        <NavLink
          to="/"
          className="navbar-logo"
          aria-label="BusGo Home"
        >
          <img
            src="/bus.png"
            alt="BusGo"
            className="navbar-logo-image"
          />

          <span className="navbar-brand">
            BusGo
          </span>
        </NavLink>


        {/* =====================================================
            DESKTOP NAVIGATION
            ===================================================== */}

        <nav className="desktop-navigation">

          {/* HOME */}

          <NavLink
            to="/"
            className={({ isActive }) =>
              `desktop-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FiHome />
            <span>Home</span>
          </NavLink>


          {/* ROUTE */}

          <NavLink
            to="/routes"
            className={({ isActive }) =>
              `desktop-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FiMap />
            <span>Route</span>
          </NavLink>


          {/* OFFER */}

          <NavLink
            to="/offers"
            className={({ isActive }) =>
              `desktop-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FiTag />
            <span>Offer</span>
          </NavLink>


          {/* ABOUT */}

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `desktop-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FiInfo />
            <span>About</span>
          </NavLink>


          {/* NOTIFICATION */}

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `desktop-nav-link notification-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="desktop-notification-icon">
              <FiBell />

              {/* Optional notification badge */}

              <span className="desktop-notification-badge">
                0
              </span>
            </span>

            <span>Notification</span>
          </NavLink>


          {/* =================================================
              GET STARTED / SETTINGS
              ================================================= */}

          {!isLoggedIn ? (

            <div className="navbar-started-wrapper">

              <button
                type="button"
                className="get-started-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSettingsOpen((previous) => !previous);
                }}
              >
                <FiUserPlus />

                <span>Get Started</span>

                <FiChevronDown
                  className={
                    settingsOpen
                      ? "chevron rotated"
                      : "chevron"
                  }
                />
              </button>


              {settingsOpen && (
                <div className="desktop-dropdown">

                  <button
                    type="button"
                    onClick={() =>
                      goToSettingsPage("/login")
                    }
                  >
                    <FiLogIn />
                    <span>Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      goToSettingsPage("/register")
                    }
                  >
                    <FiUserPlus />
                    <span>Register</span>
                  </button>

                </div>
              )}

            </div>

          ) : (

            <div className="navbar-settings-wrapper">

              <button
                type="button"
                className="settings-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSettingsOpen((previous) => !previous);
                }}
              >
                <FiSettings />

                <span>Settings</span>

                <FiChevronDown
                  className={
                    settingsOpen
                      ? "chevron rotated"
                      : "chevron"
                  }
                />
              </button>


              {settingsOpen && (
                <div className="desktop-dropdown settings-dropdown">

                  {/* PROFILE */}

                  <button
                    type="button"
                    onClick={() =>
                      goToSettingsPage("/profile")
                    }
                  >
                    <FiUser />
                    <span>Profile</span>
                  </button>


                  {/* DASHBOARD */}

                  <button
                    type="button"
                    onClick={() =>
                      goToSettingsPage("/dashboard")
                    }
                  >
                    <FiGrid />
                    <span>Dashboard</span>
                  </button>


                  {/* APP VERSION */}

                  <button
                    type="button"
                    onClick={showAppVersion}
                  >
                    <FiPackage />

                    <span>
                      App Version
                    </span>

                    <small>
                      v{appVersion}
                    </small>
                  </button>


                  {/* REPORT */}

                  <button
                    type="button"
                    onClick={() =>
                      goToSettingsPage("/report")
                    }
                  >
                    <FiFileText />
                    <span>Report</span>
                  </button>


                  {/* COMMUNITY */}

                  <button
                    type="button"
                    onClick={() =>
                      goToSettingsPage("/community")
                    }
                  >
                    <FiUsers />
                    <span>Community</span>
                  </button>


                  {/* LOGOUT */}

                  <button
                    type="button"
                    className="dropdown-logout"
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </button>

                </div>
              )}

            </div>

          )}

        </nav>


        {/* =====================================================
            MOBILE TOP AREA
            ===================================================== */}

        <div className="mobile-navbar-right">

          <button
            type="button"
            className="mobile-hamburger-button"
            aria-label={
              mobileMenuOpen
                ? "Close menu"
                : "Open menu"
            }
            onClick={() =>
              setMobileMenuOpen(
                (previous) => !previous
              )
            }
          >
            {mobileMenuOpen ? (
              <FiX />
            ) : (
              <FiMenu />
            )}
          </button>

        </div>

      </header>


      {/* =========================================================
          MOBILE HAMBURGER MENU
          ========================================================= */}

      {mobileMenuOpen && (
        <>

          <div
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />


          <aside className="mobile-side-menu">

            {/* MENU HEADER */}

            <div className="mobile-menu-header">

              <div>
                <span className="mobile-menu-title">
                  BusGo
                </span>

                <span className="mobile-menu-subtitle">
                  Menu
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                <FiX />
              </button>

            </div>


            {/* =================================================
                ROUTE
                ================================================= */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={() =>
                mobileNavigate("/routes")
              }
            >
              <FiMap />

              <span>Route</span>

              <FiChevronDown
                className="menu-arrow"
              />
            </button>


            {/* =================================================
                ABOUT
                ================================================= */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={() =>
                mobileNavigate("/about")
              }
            >
              <FiInfo />

              <span>About</span>

              <FiChevronDown
                className="menu-arrow"
              />
            </button>


            {/* =================================================
                REPORT
                ================================================= */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={() =>
                mobileNavigate("/report")
              }
            >
              <FiFileText />

              <span>Report</span>

              <FiChevronDown
                className="menu-arrow"
              />
            </button>


            {/* =================================================
                APP VERSION
                ================================================= */}

            <button
              type="button"
              className="mobile-menu-item version-menu-item"
              onClick={showAppVersion}
            >
              <FiPackage />

              <span>
                App Version
              </span>

              <span className="version-badge">
                v{appVersion}
              </span>
            </button>


            {/* =================================================
                CHECK UPDATE
                ================================================= */}

            <button
              type="button"
              className="mobile-menu-item update-menu-item"
              onClick={checkForUpdate}
              disabled={checkingUpdate}
            >

              {checkingUpdate ? (
                <FiRefreshCw className="spin-icon" />
              ) : updateAvailable ? (
                <FiAlertCircle />
              ) : (
                <FiRefreshCw />
              )}

              <span>
                {checkingUpdate
                  ? "Checking..."
                  : "Check Update"}
              </span>

              <FiChevronDown
                className="menu-arrow"
              />

            </button>


            {/* =================================================
                UPDATE RESULT
                ================================================= */}

            {updateMessage && (
              <div
                className={
                  updateAvailable
                    ? "update-message update-found"
                    : "update-message"
                }
              >

                {updateAvailable ? (
                  <FiAlertCircle />
                ) : (
                  <FiCheckCircle />
                )}

                <span>
                  {updateMessage}
                </span>

              </div>
            )}


            {/* =================================================
                LOGOUT
                ================================================= */}

            {isLoggedIn && (
              <button
                type="button"
                className="mobile-menu-item mobile-logout"
                onClick={handleLogout}
              >
                <FiLogOut />

                <span>
                  Logout
                </span>

                <FiChevronDown
                  className="menu-arrow"
                />
              </button>
            )}

          </aside>

        </>
      )}


      {/* =========================================================
          MOBILE BOTTOM NAVIGATION
          ========================================================= */}

      <nav className="mobile-bottom-navigation">

        {/* DASHBOARD */}

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `mobile-bottom-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <FiGrid />

          <span>
            Dashboard
          </span>
        </NavLink>


        {/* ROUTE */}

        <NavLink
          to="/routes"
          className={({ isActive }) =>
            `mobile-bottom-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <FiMap />

          <span>
            Route
          </span>
        </NavLink>


        {/* TICKET */}

        <NavLink
          to="/tickets"
          className={({ isActive }) =>
            `mobile-bottom-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <FiTicket />

          <span>
            Ticket
          </span>
        </NavLink>


        {/* COMMUNITY */}

        <NavLink
          to="/community"
          className={({ isActive }) =>
            `mobile-bottom-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <FiUsers />

          <span>
            Community
          </span>
        </NavLink>


        {/* PROFILE */}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `mobile-bottom-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <FiUser />

          <span>
            Profile
          </span>
        </NavLink>


        {/* HAMBURGER */}

        <button
          type="button"
          className={
            mobileMenuOpen
              ? "mobile-bottom-item hamburger-active"
              : "mobile-bottom-item"
          }
          onClick={() =>
            setMobileMenuOpen(
              (previous) => !previous
            )
          }
        >

          {mobileMenuOpen ? (
            <FiX />
          ) : (
            <FiMenu />
          )}

          <span>
            Menu
          </span>

        </button>

      </nav>

    </>
  );
};

export default Navbar;