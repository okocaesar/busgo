
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
  // NAVBAR VISIBILITY
  //
  // false = visible
  // true  = hidden
  // =========================================

  const [navbarHidden, setNavbarHidden] = useState(false);

  // =========================================
  // NOTIFICATIONS
  // =========================================

  const [notifications, setNotifications] = useState([]);

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

      const currentUser = getCurrentUser();

      const token =
        localStorage.getItem("authToken");

      // =========================================
      // USER NOT LOGGED IN
      // =========================================

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

        const response = await axios.get(
          `${API_URL}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`
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

        // =========================================
        // SESSION EXPIRED
        // =========================================

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

    const interval = setInterval(() => {

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
  // NAVBAR SCROLL DIRECTION
  //
  // SCROLL DOWN
  // → Hide navbar
  //
  // SCROLL UP
  // → Show navbar
  //
  // AT TOP
  // → Always show navbar
  // =========================================

  useEffect(() => {

    let lastScrollY = window.scrollY;

    let ticking = false;

    const handleScroll = () => {

      if (ticking) {
        return;
      }

      window.requestAnimationFrame(() => {

        const currentScrollY =
          window.scrollY;

        // =====================================
        // ALWAYS SHOW AT TOP
        // =====================================

        if (currentScrollY <= 10) {

          setNavbarHidden(false);

        }

        // =====================================
        // SCROLLING DOWN
        // =====================================

        else if (
          currentScrollY >
          lastScrollY + 5
        ) {

          setNavbarHidden(true);

          // Close mobile menu when scrolling
          // down so it doesn't remain open.
          setMenuOpen(false);

        }

        // =====================================
        // SCROLLING UP
        // =====================================

        else if (
          currentScrollY <
          lastScrollY - 5
        ) {

          setNavbarHidden(false);

        }

        lastScrollY = currentScrollY;

        ticking = false;

      });

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

    setNavbarHidden(false);

    navigate("/login");
  };

  // =========================================
  // CLOSE MENU
  // =========================================

  const closeMenu = () => {

    setMenuOpen(false);

  };

  // =========================================
  // OPEN NOTIFICATIONS
  // =========================================

  const openNotifications = () => {

    closeMenu();

    navigate("/notifications");

  };

  // =========================================
  // NAVBAR
  // =========================================

  return (

    <nav
      className={`navbar ${
        navbarHidden
          ? "navbar-hidden"
          : ""
      }`}
    >

      {/* =====================================
          LOGO
      ===================================== */}

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


      {/* =====================================
          HAMBURGER
      ===================================== */}

      <button
        className={`menu-toggle ${
          menuOpen
            ? "open"
            : ""
        }`}
        onClick={() =>
          setMenuOpen(!menuOpen)
        }
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >

        <span></span>
        <span></span>
        <span></span>

      </button>


      {/* =====================================
          NAVIGATION MENU
      ===================================== */}

      <div
        className={`navbar-menu ${
          menuOpen
            ? "menu-open"
            : ""
        }`}
      >

        {/* ===================================
            NAV LINKS
        =================================== */}

        <div className="nav-links">

          <NavLink
            to="/"
            onClick={closeMenu}
          >
            Home
          </NavLink>


          <NavLink
            to="/routes"
            onClick={closeMenu}
          >
            Routes
          </NavLink>


          <NavLink
            to="/offers"
            onClick={closeMenu}
          >
            Offers
          </NavLink>


          <NavLink
            to="/about"
            onClick={closeMenu}
          >
            About Us
          </NavLink>


          {loggedIn && (

            <NavLink
              to="/dashboard"
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>

          )}

        </div>


        {/* ===================================
            RIGHT SIDE
        =================================== */}

        <div className="auth-buttons">

          {/* =================================
              NOTIFICATION BUTTON
          ================================= */}

          {loggedIn && (

            <button
              className="notification-button"
              onClick={openNotifications}
              aria-label="Notifications"
              title={
                unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount > 1
                        ? "s"
                        : ""
                    }`
                  : "Notifications"
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


          {/* =================================
              AUTH BUTTONS
          ================================= */}

          {loggedIn ? (

            <button
              className="signup-btn"
              onClick={logout}
            >
              Logout
            </button>

          ) : (

            <>

              {/* LOGIN */}

              <NavLink
                to="/login"
                onClick={closeMenu}
              >

                <button className="login-btn">
                  Login
                </button>

              </NavLink>


              {/* REGISTER */}

              <NavLink
                to="/register"
                onClick={closeMenu}
              >

                <button className="signup-btn">
                  Register
                </button>

              </NavLink>

            </>

          )}

        </div>

      </div>

    </nav>

  );
}

export default Navbar;
