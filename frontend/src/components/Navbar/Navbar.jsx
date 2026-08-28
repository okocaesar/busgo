import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  FiHome,
  FiMap,
  FiTag,
  FiInfo,
  FiBell,
  FiUser,
  FiGrid,
  FiPackage,
  FiUsers,
  FiMenu,
  FiX,
  FiFileText,
  FiRefreshCw,
  FiLogIn,
  FiUserPlus,
  FiLogOut,
  FiChevronDown,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";

import "./Navbar.css";
import logo from "../../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNavbarVisible, setMobileNavbarVisible] = useState(true);

  const [appVersion, setAppVersion] = useState("Loading...");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  /* ============================================================
     AUTHENTICATION
     ============================================================ */

  useEffect(() => {
    const checkAuth = () => {
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

    window.addEventListener("storage", checkAuth);
    window.addEventListener("authChanged", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChanged", checkAuth);
    };
  }, []);

  /* ============================================================
     CLOSE MENUS WHEN ROUTE CHANGES
     ============================================================ */

  useEffect(() => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setUpdateMessage("");
  }, [location.pathname]);

  /* ============================================================
     MOBILE NAVBAR SCROLL BEHAVIOUR

     Scroll DOWN = hide logo + hamburger
     Scroll UP   = immediately show logo + hamburger
     At TOP     = always show
     ============================================================ */

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0) {
        setMobileNavbarVisible(true);
        lastScrollY = 0;
        return;
      }

      if (currentScrollY > lastScrollY) {
        setMobileNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setMobileNavbarVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ============================================================
     PREVENT BODY SCROLL WHEN MOBILE MENU IS OPEN
     ============================================================ */

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

  /* ============================================================
     GET CURRENT APP VERSION

     Reads /version.json from the deployed application.
     ============================================================ */

  const getAppVersion = async () => {
    try {
      const response = await fetch(
        `/version.json?t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("Version file unavailable");
      }

      const data = await response.json();

      const version =
        data?.version ||
        data?.appVersion ||
        data?.latestVersion;

      if (!version) {
        throw new Error("Version not found");
      }

      const cleanVersion = String(version);

      setAppVersion(cleanVersion);

      return cleanVersion;
    } catch (error) {
      console.error("Unable to get app version:", error);

      setAppVersion("Unknown");

      return "Unknown";
    }
  };

  /* ============================================================
     LOAD APP VERSION
     ============================================================ */

  useEffect(() => {
    getAppVersion();
  }, []);

  /* ============================================================
     COMPARE VERSION NUMBERS
     ============================================================ */

  const compareVersions = (version1, version2) => {
    const first = String(version1)
      .replace(/^v/i, "")
      .split(".")
      .map(Number);

    const second = String(version2)
      .replace(/^v/i, "")
      .split(".")
      .map(Number);

    const length = Math.max(
      first.length,
      second.length
    );

    for (let i = 0; i < length; i += 1) {
      const firstNumber = first[i] || 0;
      const secondNumber = second[i] || 0;

      if (firstNumber > secondNumber) {
        return 1;
      }

      if (firstNumber < secondNumber) {
        return -1;
      }
    }

    return 0;
  };

  /* ============================================================
     CHECK FOR UPDATE
     ============================================================ */

  const checkForUpdate = async () => {
    if (checkingUpdate) {
      return;
    }

    setCheckingUpdate(true);
    setUpdateMessage("");
    setUpdateAvailable(false);

    try {
      const response = await fetch(
        `/version.json?t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to check application version."
        );
      }

      const data = await response.json();

      const latestVersion =
        data?.version ||
        data?.appVersion ||
        data?.latestVersion;

      if (!latestVersion) {
        throw new Error(
          "Latest application version was not found."
        );
      }

      const currentVersion = await getAppVersion();

      const comparison = compareVersions(
        latestVersion,
        currentVersion
      );

      if (comparison > 0) {
        setUpdateAvailable(true);

        setUpdateMessage(
          `A new version (v${latestVersion}) is available. Updating...`
        );

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setUpdateMessage(
          `Your app is up to date (v${currentVersion}).`
        );
      }
    } catch (error) {
      console.error(
        "Update check failed:",
        error
      );

      setUpdateMessage(
        "Unable to check for updates. Please try again."
      );
    } finally {
      setTimeout(() => {
        setCheckingUpdate(false);
      }, 1500);
    }
  };

  /* ============================================================
     SHOW APP VERSION
     ============================================================ */

  const showAppVersion = async () => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);

    const currentVersion = await getAppVersion();

    alert(
      `Current App Version\n\nVersion: v${currentVersion}`
    );
  };

  /* ============================================================
     LOGOUT
     ============================================================ */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userToken");

    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("busgo_user");

    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setIsLoggedIn(false);

    window.dispatchEvent(
      new Event("authChanged")
    );

    navigate("/");
  };

  /* ============================================================
     MOBILE NAVIGATION
     ============================================================ */

  const mobileNavigate = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  /* ============================================================
     DESKTOP MENU NAVIGATION
     ============================================================ */

  const desktopNavigate = (path) => {
    setDesktopMenuOpen(false);
    navigate(path);
  };

  /* ============================================================
     DESKTOP NAV LINK CLASS
     ============================================================ */

  const desktopLinkClass = ({ isActive }) =>
    `desktop-nav-link ${
      isActive ? "active" : ""
    }`;

  /* ============================================================
     MOBILE BOTTOM NAV LINK CLASS
     ============================================================ */

  const mobileBottomClass = ({ isActive }) =>
    `mobile-bottom-item ${
      isActive ? "active" : ""
    }`;

  return (
    <>
      {/* ========================================================
          DESKTOP / TABLET NAVBAR
          ======================================================== */}

      <header className="navbar">

        {/* LOGO ONLY */}

        <NavLink
          to="/"
          className="navbar-logo"
          aria-label="Home"
        >
          <img
            src={logo}
            alt="App logo"
            className="navbar-logo-image"
          />
        </NavLink>

        {/* ======================================================
            DESKTOP NAVIGATION
            ====================================================== */}

        <nav className="desktop-navigation">

          {/* HOME */}

          <NavLink
            to="/"
            className={desktopLinkClass}
          >
            <FiHome />
            <span>Home</span>
          </NavLink>

          {/* ROUTE */}

          <NavLink
            to="/routes"
            className={desktopLinkClass}
          >
            <FiMap />
            <span>Route</span>
          </NavLink>

          {/* OFFER */}

          <NavLink
            to="/offers"
            className={desktopLinkClass}
          >
            <FiTag />
            <span>Offer</span>
          </NavLink>

          {/* ABOUT */}

          <NavLink
            to="/about"
            className={desktopLinkClass}
          >
            <FiInfo />
            <span>About</span>
          </NavLink>

          {/* NOTIFICATION */}

          <NavLink
            to="/notifications"
            className={desktopLinkClass}
          >
            <span className="desktop-notification-icon">
              <FiBell />

              <span className="desktop-notification-badge">
                0
              </span>
            </span>

            <span>Notification</span>
          </NavLink>

          {/* ==================================================
              GET STARTED / SETTINGS
              ================================================== */}

          {!isLoggedIn ? (
            <div className="desktop-menu-wrapper">

              <button
                type="button"
                className="get-started-button"
                onClick={() =>
                  setDesktopMenuOpen(
                    (previous) => !previous
                  )
                }
              >
                <span>Get Started</span>

                <FiChevronDown
                  className={
                    desktopMenuOpen
                      ? "chevron rotated"
                      : "chevron"
                  }
                />
              </button>

              {desktopMenuOpen && (
                <div className="desktop-dropdown">

                  <button
                    type="button"
                    onClick={() =>
                      desktopNavigate("/login")
                    }
                  >
                    <FiLogIn />
                    <span>Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      desktopNavigate("/register")
                    }
                  >
                    <FiUserPlus />
                    <span>Register</span>
                  </button>

                </div>
              )}

            </div>
          ) : (
            <div className="desktop-menu-wrapper">

              <button
                type="button"
                className="settings-button"
                onClick={() =>
                  setDesktopMenuOpen(
                    (previous) => !previous
                  )
                }
              >
                <span>Settings</span>

                <FiChevronDown
                  className={
                    desktopMenuOpen
                      ? "chevron rotated"
                      : "chevron"
                  }
                />
              </button>

              {desktopMenuOpen && (
                <div className="desktop-dropdown">

                  {/* PROFILE */}

                  <button
                    type="button"
                    onClick={() =>
                      desktopNavigate("/profile")
                    }
                  >
                    <FiUser />
                    <span>Profile</span>
                  </button>

                  {/* DASHBOARD */}

                  <button
                    type="button"
                    onClick={() =>
                      desktopNavigate("/dashboard")
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

                    <span>App Version</span>

                    <small>
                      v{appVersion}
                    </small>
                  </button>

                  {/* REPORT */}

                  <button
                    type="button"
                    onClick={() =>
                      desktopNavigate("/report")
                    }
                  >
                    <FiFileText />
                    <span>Report</span>
                  </button>

                  {/* COMMUNITY */}

                  <button
                    type="button"
                    onClick={() =>
                      desktopNavigate("/community")
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

        {/* ======================================================
            MOBILE TOP BAR
            LOGO LEFT + HAMBURGER RIGHT
            ====================================================== */}

        <div
          className={`mobile-top-controls ${
            mobileNavbarVisible
              ? "mobile-navbar-visible"
              : "mobile-navbar-hidden"
          }`}
        >

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

      {/* ========================================================
          MOBILE HAMBURGER MENU
          ======================================================== */}

      {mobileMenuOpen && (
        <>
          <div
            className="mobile-menu-overlay"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />

          <aside className="mobile-side-menu">

            {/* MENU HEADER */}

            <div className="mobile-menu-header">

              <span className="mobile-menu-title">
                Menu
              </span>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                aria-label="Close menu"
              >
                <FiX />
              </button>

            </div>

            {/* ROUTE */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={() =>
                mobileNavigate("/routes")
              }
            >
              <FiMap />

              <span>Route</span>

              <span className="menu-arrow">
                ›
              </span>
            </button>

            {/* ABOUT */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={() =>
                mobileNavigate("/about")
              }
            >
              <FiInfo />

              <span>About</span>

              <span className="menu-arrow">
                ›
              </span>
            </button>

            {/* REPORT */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={() =>
                mobileNavigate("/report")
              }
            >
              <FiFileText />

              <span>Report</span>

              <span className="menu-arrow">
                ›
              </span>
            </button>

            {/* APP VERSION */}

            <button
              type="button"
              className="mobile-menu-item"
              onClick={showAppVersion}
            >
              <FiPackage />

              <span>App Version</span>

              <span className="version-badge">
                v{appVersion}
              </span>
            </button>

            {/* CHECK UPDATE */}

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

              <span className="menu-arrow">
                ›
              </span>

            </button>

            {/* UPDATE MESSAGE */}

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

            {/* LOGOUT */}

            {isLoggedIn && (
              <button
                type="button"
                className="mobile-menu-item mobile-logout"
                onClick={handleLogout}
              >
                <FiLogOut />

                <span>Logout</span>
              </button>
            )}

          </aside>
        </>
      )}

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION

          Icons only when inactive.
          Active item shows icon + name.

          NO HAMBURGER HERE.
          ======================================================== */}

      <nav className="mobile-bottom-navigation">

        {/* DASHBOARD */}

        <NavLink
          to="/"
          className={mobileBottomClass}
        >
          <FiGrid />
          <span>Dashboard</span>
        </NavLink>

        {/* ROUTE */}

        <NavLink
          to="/routes"
          className={mobileBottomClass}
        >
          <FiMap />
          <span>Route</span>
        </NavLink>

        {/* TICKET */}

        <NavLink
          to="/dashboard"
          className={mobileBottomClass}
        >
          <FiPackage />
          <span>Ticket</span>
        </NavLink>

        {/* COMMUNITY */}

        <NavLink
          to="/community"
          className={mobileBottomClass}
        >
          <FiUsers />
          <span>Community</span>
        </NavLink>

        {/* NOTIFICATION */}

        <NavLink
          to="/notifications"
          className={mobileBottomClass}
        >
          <span className="bottom-notification-icon">
            <FiBell />

            <span className="mobile-notification-badge">
              0
            </span>
          </span>

          <span>Notification</span>
        </NavLink>

        {/* PROFILE */}

        <NavLink
          to="/profile"
          className={mobileBottomClass}
        >
          <FiUser />
          <span>Profile</span>
        </NavLink>

      </nav>
    </>
  );
};

export default Navbar;