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

function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();

  // =========================================
  // LOGIN STATE
  // =========================================

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  // =========================================
  // MENU
  // =========================================

  const [menuOpen, setMenuOpen] = useState(false);

  // =========================================
  // LANGUAGE
  // =========================================

  const [language, setLanguage] = useState(
    localStorage.getItem("appLanguage") || "en"
  );

  const [showLanguageOptions, setShowLanguageOptions] =
    useState(false);

  // =========================================
  // TRANSLATIONS
  // =========================================

  const translations = {

    en: {

      dashboard: "Dashboard",
      routes: "Routes",
      offers: "Offers",
      about: "About Us",
      profile: "Profile",

      notifications: "Notifications",
      notification: "Notification",

      login: "Login",
      register: "Register",
      logout: "Logout",

      report: "Report",

      language: "Language",
      english: "English",
      french: "Français",

      appVersion: "App Version",

      mobileNavigation: "Mobile navigation",

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

      notifications: "Notifications",
      notification: "Notification",

      login: "Connexion",
      register: "Inscription",
      logout: "Déconnexion",

      report: "Signaler",

      language: "Langue",
      english: "Anglais",
      french: "Français",

      appVersion:
        "Version de l'application",

      mobileNavigation:
        "Navigation mobile",

      unreadNotification:
        "notification non lue",

      unreadNotifications:
        "notifications non lues"

    }

  };

  // =========================================
  // CURRENT TRANSLATION
  // =========================================

  const t =
    translations[language] ||
    translations.en;

  // =========================================
  // NAVBAR VISIBILITY
  // =========================================

  const [navbarHidden, setNavbarHidden] =
    useState(false);

  // =========================================
  // NOTIFICATIONS
  // =========================================

  const [notifications, setNotifications] =
    useState([]);

  // =========================================
  // CURRENT USER
  // =========================================

  const getCurrentUser = () => {

    try {

      return JSON.parse(
        localStorage.getItem("currentUser") || "null"
      );

    } catch (error) {

      console.error(
        "Unable to read current user:",
        error
      );

      return null;

    }

  };

  // =========================================
  // LOAD NOTIFICATIONS
  // =========================================

  const loadNotifications = useCallback(
    async () => {

      const isUserLoggedIn =
        localStorage.getItem("loggedIn") === "true";

      const currentUser =
        getCurrentUser();

      const token =
        localStorage.getItem("authToken");

      // =====================================
      // USER NOT LOGGED IN
      // =====================================

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
          response.data.notifications || []
        );

      } catch (error) {

        console.error(
          "Unable to load notifications:",
          error
        );

        // =================================
        // SESSION EXPIRED
        // =================================

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

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {

    loadNotifications();

  }, [loadNotifications]);

  // =========================================
  // REFRESH WHEN ROUTE CHANGES
  // =========================================

  useEffect(() => {

    loadNotifications();

  }, [
    location.pathname,
    loadNotifications
  ]);

  // =========================================
  // REFRESH EVERY 10 SECONDS
  // =========================================

  useEffect(() => {

    if (!loggedIn) {
      return;
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

  // =========================================
  // REFRESH WHEN WINDOW GETS FOCUS
  // =========================================

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

  }, [loadNotifications]);

  // =========================================
  // CHECK LOGIN STATE
  // =========================================

  useEffect(() => {

    const handleStorage = () => {

      const isLoggedIn =
        localStorage.getItem("loggedIn") === "true";

      setLoggedIn(isLoggedIn);

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

  // =========================================
  // LANGUAGE CHANGE LISTENER
  // =========================================

  useEffect(() => {

    const savedLanguage =
      localStorage.getItem("appLanguage") || "en";

    setLanguage(savedLanguage);

    document.documentElement.lang =
      savedLanguage;

    // =======================================
    // LISTEN FOR GLOBAL LANGUAGE CHANGES
    // =======================================

    const handleLanguageChange =
      (event) => {

        const newLanguage =
          event.detail?.language ||
          localStorage.getItem(
            "appLanguage"
          ) ||
          "en";

        setLanguage(newLanguage);

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

  // =========================================
  // CHANGE LANGUAGE
  // =========================================

  const changeLanguage =
    (newLanguage) => {

      setLanguage(newLanguage);

      localStorage.setItem(
        "appLanguage",
        newLanguage
      );

      document.documentElement.lang =
        newLanguage;

      setShowLanguageOptions(false);

      // =====================================
      // TELL ENTIRE APPLICATION
      // =====================================

      window.dispatchEvent(
        new CustomEvent(
          "busgo-language-change",
          {
            detail: {
              language: newLanguage
            }
          }
        )
      );

    };

  // =========================================
  // NAVBAR SCROLL DIRECTION
  // =========================================

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

          // ===============================
          // TOP
          // ===============================

          if (
            currentScrollY <= 10
          ) {

            setNavbarHidden(false);

          }

          // ===============================
          // SCROLL DOWN
          // ===============================

          else if (
            currentScrollY >
            lastScrollY + 5
          ) {

            setNavbarHidden(true);

            setMenuOpen(false);

            setShowLanguageOptions(false);

          }

          // ===============================
          // SCROLL UP
          // ===============================

          else if (
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

  // =========================================
  // UNREAD COUNT
  // =========================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        Number(
          notification.is_read
        ) === 0
    ).length;

  // =========================================
  // LOGOUT
  // =========================================

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

    setShowLanguageOptions(false);

    setNavbarHidden(false);

    navigate("/login");

  };

  // =========================================
  // CLOSE MENU
  // =========================================

  const closeMenu = () => {

    setMenuOpen(false);

    setShowLanguageOptions(false);

  };

  // =========================================
  // OPEN NOTIFICATIONS
  // =========================================

  const openNotifications = () => {

    closeMenu();

    navigate("/notifications");

  };

  // =========================================
  // OPEN REPORT
  // =========================================

  const openReport = () => {

    closeMenu();

    navigate("/report");

  };

  // =========================================
  // AUTH PAGES
  // =========================================

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/verify-otp";

  // =========================================
  // ADMIN PAGES
  // =========================================

  const isAdminPage =
    location.pathname.startsWith("/admin");

  // =========================================
  // MOBILE BOTTOM NAV
  // =========================================

  const showMobileBottomNav =
    loggedIn &&
    !isAuthPage &&
    !isAdminPage;

  // =========================================
  // NOTIFICATION TITLE
  // =========================================

  const notificationTitle =
    unreadCount > 0
      ? `${unreadCount} ${
          unreadCount > 1
            ? t.unreadNotifications
            : t.unreadNotification
        }`
      : t.notifications;

  // =========================================
  // RENDER
  // =========================================

  return (

    <>

      {/* =====================================
          TOP NAVBAR
      ===================================== */}

      <nav
        className={`navbar ${
          navbarHidden
            ? "navbar-hidden"
            : ""
        }`}
      >

        {/* ===================================
            LOGO
        =================================== */}

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


        {/* ===================================
            HAMBURGER
        =================================== */}

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

            setShowLanguageOptions(false);

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


        {/* ===================================
            NAVBAR MENU
        =================================== */}

        <div
          className={`navbar-menu ${
            menuOpen
              ? "menu-open"
              : ""
          }`}
        >

          {/* =================================
              NAV LINKS
          ================================= */}

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


          {/* =================================
              AUTH / NOTIFICATIONS
          ================================= */}

          <div className="auth-buttons">

            {loggedIn && (

              <button
                type="button"
                className="notification-button"
                onClick={openNotifications}
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


          {/* =================================
              MOBILE HAMBURGER MENU
          ================================= */}

          {loggedIn &&
            !isAuthPage &&
            !isAdminPage && (

            <div className="mobile-menu-content">

              {/* ===============================
                  NOTIFICATIONS
              =============================== */}

              <button
                type="button"
                className="mobile-menu-item"
                onClick={
                  openNotifications
                }
              >

                <span className="mobile-menu-icon">
                  🔔
                </span>

                <span className="mobile-menu-label">
                  {t.notifications}
                </span>

                {unreadCount > 0 && (

                  <span className="mobile-menu-badge">

                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}

                  </span>

                )}

              </button>


              {/* ===============================
                  REPORT
              =============================== */}

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

              </button>


              {/* ===============================
                  LANGUAGE
              =============================== */}

              <div className="mobile-language-section">

                <button
                  type="button"
                  className="mobile-menu-item"
                  onClick={() =>
                    setShowLanguageOptions(
                      !showLanguageOptions
                    )
                  }
                >

                  <span className="mobile-menu-icon">
                    🌐
                  </span>

                  <span className="mobile-menu-label">
                    {t.language}
                  </span>

                  <span className="mobile-language-current">

                    {language === "fr"
                      ? t.french
                      : t.english}

                  </span>

                  <span
                    className={`mobile-language-arrow ${
                      showLanguageOptions
                        ? "language-open"
                        : ""
                    }`}
                  >
                    ›
                  </span>

                </button>


                {showLanguageOptions && (

                  <div className="mobile-language-options">

                    <button
                      type="button"
                      className={`language-option ${
                        language === "en"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        changeLanguage("en")
                      }
                    >

                      <span>
                        🇬🇧
                      </span>

                      <span>
                        {t.english}
                      </span>

                      {language === "en" && (

                        <span>
                          ✓
                        </span>

                      )}

                    </button>


                    <button
                      type="button"
                      className={`language-option ${
                        language === "fr"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        changeLanguage("fr")
                      }
                    >

                      <span>
                        🇫🇷
                      </span>

                      <span>
                        {t.french}
                      </span>

                      {language === "fr" && (

                        <span>
                          ✓
                        </span>

                      )}

                    </button>

                  </div>

                )}

              </div>


              {/* ===============================
                  APP VERSION
              =============================== */}

              <button
                type="button"
                className="mobile-menu-item"
              >

                <span className="mobile-menu-icon">
                  ℹ️
                </span>

                <span className="mobile-menu-label">
                  {t.appVersion}
                </span>

                <span className="mobile-menu-value">
                  v1.0.0
                </span>

              </button>


              {/* ===============================
                  LOGOUT
              =============================== */}

              <button
                type="button"
                className="mobile-menu-item mobile-logout-item"
                onClick={logout}
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


      {/* =====================================
          MOBILE BOTTOM NAVIGATION
      ===================================== */}

      {showMobileBottomNav && (

        <nav
          className="mobile-bottom-nav"
          aria-label={
            t.mobileNavigation
          }
        >

          {/* DASHBOARD */}

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


          {/* ROUTES */}

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


          {/* OFFERS */}

          <NavLink
            to="/offers"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="mobile-bottom-nav-icon">
              🎁
            </span>

            <span className="mobile-bottom-nav-label">
              {t.offers}
            </span>

          </NavLink>


          {/* ABOUT */}

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="mobile-bottom-nav-icon">
              ℹ️
            </span>

            <span className="mobile-bottom-nav-label">
              {t.about}
            </span>

          </NavLink>


          {/* PROFILE */}

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
