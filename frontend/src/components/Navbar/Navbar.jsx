import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import axios from "axios";

import {
  NavLink,
  useLocation,
  useNavigate
} from "react-router-dom";

import logo from "../../assets/logo.png";
import { API_URL } from "../../api";

import "./Navbar.css";

import packageJson from "../../../package.json";

// =========================================================
// BUSGO APP VERSION
// =========================================================

const APP_VERSION =
  packageJson.version || "0.1.0";

// =========================================================
// REMOTE UPDATE CHECK
// =========================================================

const APP_UPDATE_URL =
  `${API_URL}/api/app/version`;

// =========================================================
// VERSION COMPARISON
// =========================================================

const compareVersions = (
  currentVersion,
  latestVersion
) => {
  const current = String(
    currentVersion || "0.0.0"
  )
    .replace(/^v/i, "")
    .split(".")
    .map(Number);

  const latest = String(
    latestVersion || "0.0.0"
  )
    .replace(/^v/i, "")
    .split(".")
    .map(Number);

  const length = Math.max(
    current.length,
    latest.length
  );

  for (let i = 0; i < length; i++) {
    const currentPart =
      Number.isFinite(current[i])
        ? current[i]
        : 0;

    const latestPart =
      Number.isFinite(latest[i])
        ? latest[i]
        : 0;

    if (latestPart > currentPart) {
      return 1;
    }

    if (latestPart < currentPart) {
      return -1;
    }
  }

  return 0;
};

// =========================================================
// NAVBAR
// =========================================================

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // =======================================================
  // LOGIN STATE
  // =======================================================

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  // =======================================================
  // MOBILE HAMBURGER MENU
  // =======================================================

  const [menuOpen, setMenuOpen] = useState(false);

  // =======================================================
  // LANGUAGE
  // =======================================================

  const [language, setLanguage] = useState(
    localStorage.getItem("appLanguage") || "en"
  );

  // =======================================================
  // UPDATE STATE
  // =======================================================

  const [checkingUpdate, setCheckingUpdate] =
    useState(false);

  // =======================================================
  // TRANSLATIONS
  // =======================================================

  const translations = {
    en: {
      dashboard: "Dashboard",
      routes: "Routes",
      offers: "Offers",
      about: "About Us",
      profile: "Profile",
      myProfile: "Profile",
      notifications: "Notifications",
      notification: "Notification",
      community: "Community",
      ticket: "Ticket",
      login: "Login",
      register: "Register",
      logout: "Logout",
      report: "Report",
      language: "Language",
      english: "English",
      french: "Français",
      appVersion: "App Version",
      requestUpdate: "Request Update",
      mobileNavigation: "Mobile navigation",
      checkingUpdate: "Checking for updates...",
      updateAvailable:
        "A new version of BusGo is available. Update now?",
      updateStarted:
        "Updating BusGo...",
      updateError:
        "Unable to check for updates. Please try again.",
      upToDate:
        "Your BusGo app is up to date.",
      unreadNotification:
        "unread notification",
      unreadNotifications:
        "unread notifications"
    },

    fr: {
      dashboard: "Tableau de bord",
      routes: "Itinéraires",
      offers: "Offres",
      about: "À propos",
      profile: "Profil",
      myProfile: "Profil",
      notifications: "Notifications",
      notification: "Notification",
      community: "Communauté",
      ticket: "Billet",
      login: "Connexion",
      register: "Inscription",
      logout: "Déconnexion",
      report: "Signaler",
      language: "Langue",
      english: "Anglais",
      french: "Français",
      appVersion:
        "Version de l'application",
      requestUpdate:
        "Rechercher une mise à jour",
      mobileNavigation:
        "Navigation mobile",
      checkingUpdate:
        "Recherche de mises à jour...",
      updateAvailable:
        "Une nouvelle version de BusGo est disponible. Mettre à jour maintenant ?",
      updateStarted:
        "Mise à jour de BusGo...",
      updateError:
        "Impossible de vérifier les mises à jour. Veuillez réessayer.",
      upToDate:
        "Votre application BusGo est à jour.",
      unreadNotification:
        "notification non lue",
      unreadNotifications:
        "notifications non lues"
    }
  };

  const t =
    translations[language] ||
    translations.en;

  // =======================================================
  // DESKTOP NAVBAR SCROLL STATE
  // =======================================================

  const [navbarHidden, setNavbarHidden] =
    useState(false);

  // =======================================================
  // NOTIFICATIONS
  // =======================================================

  const [notifications, setNotifications] =
    useState([]);

  // =======================================================
  // GET CURRENT USER
  // =======================================================

  const getCurrentUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "currentUser"
        ) || "null"
      );
    } catch (error) {
      console.error(
        "Unable to read current user:",
        error
      );

      return null;
    }
  };

  // =======================================================
  // LOAD NOTIFICATIONS
  // =======================================================

  const loadNotifications = useCallback(
    async () => {
      const isUserLoggedIn =
        localStorage.getItem(
          "loggedIn"
        ) === "true";

      const currentUser =
        getCurrentUser();

      const token =
        localStorage.getItem(
          "authToken"
        );

      // -----------------------------------------------------
      // USER NOT LOGGED IN
      // -----------------------------------------------------

      if (
        !isUserLoggedIn ||
        !currentUser?.id ||
        !token
      ) {
        setNotifications([]);
        setLoggedIn(false);
        return;
      }

      setLoggedIn(true);

      try {
        const response =
          await axios.get(
            `${API_URL}/api/notifications`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setNotifications(
          response.data?.notifications || []
        );
      } catch (error) {
        console.error(
          "Unable to load notifications:",
          error
        );

        // ---------------------------------------------------
        // SESSION EXPIRED
        // ---------------------------------------------------

        if (
          error.response?.status === 401
        ) {
          localStorage.removeItem(
            "authToken"
          );

          localStorage.removeItem(
            "loggedIn"
          );

          localStorage.removeItem(
            "currentUser"
          );

          setNotifications([]);
          setLoggedIn(false);
        }
      }
    },
    []
  );

  // =======================================================
  // INITIAL NOTIFICATION LOAD
  // =======================================================

  useEffect(() => {
    loadNotifications();
  }, [
    loadNotifications
  ]);

  // =======================================================
  // REFRESH WHEN ROUTE CHANGES
  // =======================================================

  useEffect(() => {
    loadNotifications();
  }, [
    location.pathname,
    loadNotifications
  ]);

  // =======================================================
  // REFRESH NOTIFICATIONS EVERY 10 SECONDS
  // =======================================================

  useEffect(() => {
    if (!loggedIn) {
      return undefined;
    }

    const interval =
      setInterval(() => {
        loadNotifications();
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [
    loggedIn,
    loadNotifications
  ]);

  // =======================================================
  // REFRESH WHEN WINDOW GETS FOCUS
  // =======================================================

  useEffect(() => {
    const handleFocus = () => {
      loadNotifications();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    loadNotifications
  ]);

  // =======================================================
  // LOGIN STATE LISTENER
  // =======================================================

  useEffect(() => {
    const handleStorage = () => {
      const isLoggedIn =
        localStorage.getItem(
          "loggedIn"
        ) === "true";

      setLoggedIn(
        isLoggedIn
      );

      if (!isLoggedIn) {
        setNotifications([]);
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  // =======================================================
  // LANGUAGE LISTENER
  // =======================================================

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(
        "appLanguage"
      ) || "en";

    setLanguage(
      savedLanguage
    );

    document.documentElement.lang =
      savedLanguage;

    const handleLanguageChange =
      (event) => {
        const newLanguage =
          event.detail?.language ||
          localStorage.getItem(
            "appLanguage"
          ) ||
          "en";

        setLanguage(
          newLanguage
        );

        document.documentElement.lang =
          newLanguage;
      };

    window.addEventListener(
      "busgo-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "busgo-language-change",
        handleLanguageChange
      );
    };
  }, []);

  // =======================================================
  // DESKTOP NAVBAR SCROLL
  // =======================================================

  useEffect(() => {
    let lastScrollY =
      window.scrollY;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      window.requestAnimationFrame(
        () => {
          const currentScrollY =
            window.scrollY;

          if (
            currentScrollY <= 10
          ) {
            setNavbarHidden(false);
          } else if (
            currentScrollY >
            lastScrollY + 5
          ) {
            setNavbarHidden(true);
            setMenuOpen(false);
          } else if (
            currentScrollY <
            lastScrollY - 5
          ) {
            setNavbarHidden(false);
          }

          lastScrollY =
            currentScrollY;

          ticking = false;
        }
      );

      ticking = true;
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  // =======================================================
  // UNREAD NOTIFICATION COUNT
  // =======================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        Number(
          notification.is_read
        ) === 0
    ).length;

  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = () => {
    localStorage.removeItem(
      "loggedIn"
    );

    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "authToken"
    );

    setLoggedIn(false);
    setNotifications([]);
    setMenuOpen(false);
    setNavbarHidden(false);

    navigate("/login");
  };

  // =======================================================
  // CLOSE MENU
  // =======================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // =======================================================
  // OPEN NOTIFICATIONS
  // =======================================================

  const openNotifications = () => {
    closeMenu();

    navigate(
      "/notifications"
    );
  };

  // =======================================================
  // OPEN OFFERS
  // =======================================================

  const openOffers = () => {
    closeMenu();

    navigate(
      "/offers"
    );
  };

  // =======================================================
  // OPEN ABOUT
  // =======================================================

  const openAbout = () => {
    closeMenu();

    navigate(
      "/about"
    );
  };

  // =======================================================
  // OPEN REPORT
  // =======================================================

  const openReport = () => {
    closeMenu();

    navigate(
      "/profile#report"
    );
  };

  // =======================================================
  // REQUEST APP UPDATE
  // =======================================================

  const requestUpdate =
    async () => {
      if (checkingUpdate) {
        return;
      }

      setCheckingUpdate(true);

      try {
        const response =
          await axios.get(
            APP_UPDATE_URL,
            {
              params: {
                currentVersion:
                  APP_VERSION,
                _: Date.now()
              },

              headers: {
                "Cache-Control":
                  "no-cache"
              }
            }
          );

        const latestVersion =
          response.data?.version ||
          response.data?.latestVersion ||
          response.data?.appVersion;

        if (!latestVersion) {
          alert(
            t.updateError
          );

          return;
        }

        const comparison =
          compareVersions(
            APP_VERSION,
            latestVersion
          );

        // ---------------------------------------------------
        // NEW VERSION AVAILABLE
        // ---------------------------------------------------

        if (comparison < 0) {
          const confirmed =
            window.confirm(
              `${t.updateAvailable}\n\n` +
              `Current version: v${APP_VERSION}\n` +
              `New version: v${latestVersion}`
            );

          if (!confirmed) {
            return;
          }

          alert(
            t.updateStarted
          );

          closeMenu();

          // -------------------------------------------------
          // CLEAR BROWSER CACHE
          // -------------------------------------------------

          if (
            "caches" in window
          ) {
            try {
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
            } catch (cacheError) {
              console.warn(
                "Unable to clear cache:",
                cacheError
              );
            }
          }

          // -------------------------------------------------
          // SERVICE WORKER UPDATE
          // -------------------------------------------------

          if (
            "serviceWorker" in
            navigator
          ) {
            try {
              const registration =
                await navigator.serviceWorker.getRegistration();

              if (registration) {
                await registration.update();
              }
            } catch (swError) {
              console.warn(
                "Service worker update failed:",
                swError
              );
            }
          }

          // -------------------------------------------------
          // RELOAD APPLICATION
          // -------------------------------------------------

          window.location.reload();

          return;
        }

        // ---------------------------------------------------
        // ALREADY UP TO DATE
        // ---------------------------------------------------

        alert(
          t.upToDate
        );
      } catch (error) {
        console.error(
          "Unable to check app update:",
          error
        );

        alert(
          t.updateError
        );
      } finally {
        setCheckingUpdate(false);
      }
    };

  // =======================================================
  // AUTH PAGES
  // =======================================================

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/verify-otp";

  // =======================================================
  // ADMIN PAGES
  // =======================================================

  const isAdminPage =
    location.pathname.startsWith(
      "/admin"
    );

  // =======================================================
  // MOBILE BOTTOM NAV VISIBILITY
  // =======================================================

  const showMobileBottomNav =
    loggedIn &&
    !isAuthPage &&
    !isAdminPage;

  // =======================================================
  // NOTIFICATION TITLE
  // =======================================================

  const notificationTitle =
    unreadCount > 0
      ? `${unreadCount} ${
          unreadCount > 1
            ? t.unreadNotifications
            : t.unreadNotification
        }`
      : t.notifications;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <>
      {/* =================================================
          TOP NAVBAR
          ================================================= */}

      <nav
        className={`navbar ${
          navbarHidden
            ? "navbar-hidden"
            : ""
        }`}
      >

        {/* ===============================================
            LOGO
            =============================================== */}

        <NavLink
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="BusGo Logo"
            className="logo-img"
          />
        </NavLink>

        {/* ===============================================
            MOBILE HAMBURGER
            =============================================== */}

        <button
          type="button"
          className={`menu-toggle ${
            menuOpen
              ? "open"
              : ""
          }`}
          onClick={() => {
            setMenuOpen(
              !menuOpen
            );
          }}
          aria-label={
            t.mobileNavigation
          }
          aria-expanded={
            menuOpen
          }
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* ===============================================
            NAVBAR MENU
            =============================================== */}

        <div
          className={`navbar-menu ${
            menuOpen
              ? "menu-open"
              : ""
          }`}
        >

          {/* =============================================
              DESKTOP NAV LINKS
              ============================================= */}

          <div className="nav-links">

            <NavLink
              to="/"
              onClick={closeMenu}
            >
              {t.dashboard}
            </NavLink>

            <NavLink
              to="/routes"
              onClick={closeMenu}
            >
              {t.routes}
            </NavLink>

            <NavLink
              to="/offers"
              onClick={closeMenu}
            >
              {t.offers}
            </NavLink>

            <NavLink
              to="/about"
              onClick={closeMenu}
            >
              {t.about}
            </NavLink>

            {loggedIn && (
              <NavLink
                to="/profile"
                onClick={closeMenu}
              >
                {t.profile}
              </NavLink>
            )}

          </div>

          {/* =============================================
              DESKTOP AUTH / NOTIFICATION
              ============================================= */}

          <div className="auth-buttons">

            {loggedIn && (
              <button
                type="button"
                className="notification-button"
                onClick={
                  openNotifications
                }
                aria-label={
                  t.notifications
                }
                title={
                  notificationTitle
                }
              >
                <span className="notification-icon">
                  🔔
                </span>

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>
            )}

            {loggedIn ? (
              <button
                type="button"
                className="signup-btn"
                onClick={logout}
              >
                {t.logout}
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                >
                  <button
                    type="button"
                    className="login-btn"
                  >
                    {t.login}
                  </button>
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMenu}
                >
                  <button
                    type="button"
                    className="signup-btn"
                  >
                    {t.register}
                  </button>
                </NavLink>
              </>
            )}

          </div>

          {/* =============================================
              MOBILE HAMBURGER MENU
              ============================================= */}

          {loggedIn &&
            !isAuthPage &&
            !isAdminPage && (
              <div className="mobile-menu-content">

                {/* =====================================
                    OFFERS
                    ===================================== */}

                <button
                  type="button"
                  className="mobile-menu-item"
                  onClick={
                    openOffers
                  }
                >
                  <span className="mobile-menu-icon">
                    🎁
                  </span>

                  <span className="mobile-menu-label">
                    {t.offers}
                  </span>

                  <span className="mobile-menu-value">
                    ›
                  </span>
                </button>

                {/* =====================================
                    ABOUT US
                    ===================================== */}

                <button
                  type="button"
                  className="mobile-menu-item"
                  onClick={
                    openAbout
                  }
                >
                  <span className="mobile-menu-icon">
                    ℹ️
                  </span>

                  <span className="mobile-menu-label">
                    {t.about}
                  </span>

                  <span className="mobile-menu-value">
                    ›
                  </span>
                </button>

                {/* =====================================
                    REPORT
                    ===================================== */}

                <button
                  type="button"
                  className="mobile-menu-item"
                  onClick={
                    openReport
                  }
                >
                  <span className="mobile-menu-icon">
                    📝
                  </span>

                  <span className="mobile-menu-label">
                    {t.report}
                  </span>

                  <span className="mobile-menu-value">
                    ›
                  </span>
                </button>

                {/* =====================================
                    APP VERSION
                    ===================================== */}

                <div
                  className="mobile-menu-item mobile-version-item"
                >
                  <span className="mobile-menu-icon">
                    📱
                  </span>

                  <span className="mobile-menu-label">
                    {t.appVersion}
                  </span>

                  <span className="mobile-menu-version">
                    v{APP_VERSION}
                  </span>
                </div>

                {/* =====================================
                    REQUEST UPDATE
                    ===================================== */}

                <button
                  type="button"
                  className="mobile-menu-item"
                  onClick={
                    requestUpdate
                  }
                  disabled={
                    checkingUpdate
                  }
                >
                  <span className="mobile-menu-icon">
                    {checkingUpdate
                      ? "⏳"
                      : "🔄"}
                  </span>

                  <span className="mobile-menu-label">
                    {checkingUpdate
                      ? t.checkingUpdate
                      : t.requestUpdate}
                  </span>

                  <span className="mobile-menu-value">
                    ›
                  </span>
                </button>

                {/* =====================================
                    LOGOUT
                    ===================================== */}

                <button
                  type="button"
                  className="mobile-menu-item mobile-logout-item"
                  onClick={
                    logout
                  }
                >
                  <span className="mobile-menu-icon">
                    🚪
                  </span>

                  <span className="mobile-menu-label">
                    {t.logout}
                  </span>
                </button>

              </div>
            )}

        </div>
      </nav>

      {/* =================================================
          MOBILE BOTTOM NAVIGATION
          ================================================= */}

      {showMobileBottomNav && (
        <nav
          className="mobile-bottom-nav"
          aria-label={
            t.mobileNavigation
          }
        >

          {/* =============================================
              DASHBOARD
              ============================================= */}

          <NavLink
            to="/"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="mobile-bottom-nav-icon">
              🏠
            </span>

            <span className="mobile-bottom-nav-label">
              {t.dashboard}
            </span>
          </NavLink>

          {/* =============================================
              ROUTES
              ============================================= */}

          <NavLink
            to="/routes"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="mobile-bottom-nav-icon">
              🚌
            </span>

            <span className="mobile-bottom-nav-label">
              {t.routes}
            </span>
          </NavLink>

          {/* =============================================
              TICKET
              ============================================= */}

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="mobile-bottom-nav-icon">
              🎫
            </span>

            <span className="mobile-bottom-nav-label">
              {t.ticket}
            </span>
          </NavLink>

          {/* =============================================
              NOTIFICATIONS
              ============================================= */}

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="mobile-bottom-nav-icon notification-nav-icon">
              🔔

              {unreadCount > 0 && (
                <span className="mobile-bottom-nav-badge">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </span>

            <span className="mobile-bottom-nav-label">
              {t.notifications}
            </span>
          </NavLink>

          {/* =============================================
              COMMUNITY
              ============================================= */}

          <NavLink
            to="/community"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="mobile-bottom-nav-icon">
              💬
            </span>

            <span className="mobile-bottom-nav-label">
              {t.community}
            </span>
          </NavLink>

          {/* =============================================
              PROFILE
              ============================================= */}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="mobile-bottom-nav-icon">
              👤
            </span>

            <span className="mobile-bottom-nav-label">
              {t.profile}
            </span>
          </NavLink>

        </nav>
      )}

    </>
  );
}

export default Navbar;