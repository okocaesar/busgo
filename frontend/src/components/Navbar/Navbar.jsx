import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* ================================
          BUSGO LOGO
          ================================ */}
      <NavLink to="/" className="navbar-logo">
        <img
          src="/bus.png"
          alt="BusGo"
          className="navbar-logo-img"
        />
      </NavLink>

      {/* ================================
          HOME ONLY
          ================================ */}
      <div className="navbar-home">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `navbar-home-link ${isActive ? "active" : ""}`
          }
        >
          Home
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;