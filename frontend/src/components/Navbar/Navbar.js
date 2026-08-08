import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { API_URL } from "../../api";

import "./Navbar.css";

function Navbar() {

  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("loggedIn")
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  // =========================================
  // CURRENT USER
  // =========================================

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

  // =========================================
  // LOAD NOTIFICATIONS
  // =========================================

  const loadNotifications = async () => {

    if (!loggedIn || !currentUser?.id) {
      setNotifications([]);
      return;
    }

    const token = localStorage.getItem("authToken");

    if (!token) {
      return;
    }

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

    }
  };

  // =========================================
  // LOAD WHEN USER LOGS IN
  // =========================================

  useEffect(() => {

    loadNotifications();

  }, [loggedIn]);

  // =========================================
  // REFRESH NOTIFICATIONS
  // =========================================

  useEffect(() => {

    if (!loggedIn) {
      return;
    }

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);

  }, [loggedIn]);

  // =========================================
  // UNREAD COUNT
  // =========================================

  const unreadCount = notifications.filter(
    (notification) =>
      Number(notification.is_read) === 0
  ).length;

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    localStorage.removeItem("loggedIn");

    localStorage.removeItem("currentUser");

    localStorage.removeItem("authToken");

    setLoggedIn(false);

    setNotifications([]);

    setMenuOpen(false);

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

  return (

    <nav className="navbar">

      {/* LOGO */}

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


      {/* HAMBURGER */}

      <button
        className={`menu-toggle ${
          menuOpen ? "open" : ""
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


      {/* NAVIGATION */}

      <div
        className={`navbar-menu ${
          menuOpen ? "menu-open" : ""
        }`}
      >

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


        {/* RIGHT SIDE */}

        <div className="auth-buttons">


          {/* NOTIFICATION BUTTON */}

          {loggedIn && (

            <button
              className="notification-button"
              onClick={openNotifications}
              aria-label="Notifications"
              title="Notifications"
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


          {/* AUTH */}

          {loggedIn ? (

            <button
              className="signup-btn"
              onClick={logout}
            >
              Logout
            </button>

          ) : (

            <>

              <NavLink
                to="/login"
                onClick={closeMenu}
              >

                <button className="login-btn">
                  Login
                </button>

              </NavLink>


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