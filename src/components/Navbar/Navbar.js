import React from "react";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">BusGo</div>

      <div className="nav-links">
        <a href="/">Home</a>
        <a href="/search">Search Bus</a>
        <a href="/routes">Routes</a>
        <a href="/offers">Offers</a>
      </div>

      <div className="auth-buttons">
        <button>Login</button>
        <button>Register</button>
      </div>
    </nav>
  );
}

export default Navbar;
