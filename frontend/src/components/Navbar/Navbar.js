import React, { useState } from "react";
import logo from "../../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";


function Navbar() {

  const navigate = useNavigate();


  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("loggedIn")
  );


  const [menuOpen, setMenuOpen] = useState(false);


  const logout = () => {

    localStorage.removeItem("loggedIn");

    localStorage.removeItem("currentUser");

    setLoggedIn(false);

    setMenuOpen(false);

    navigate("/login");

  };


  const closeMenu = () => {
    setMenuOpen(false);
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



        {/* AUTH BUTTONS */}

        <div className="auth-buttons">


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