import React from "react";
import { NavLink } from "react-router-dom";
import "./Footer.css";
import {
  FaBus,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Company */}

        <div className="footer-column">

          <div className="footer-logo">
            <FaBus />
            <h2>BusGo</h2>
          </div>

          <p>
            BusGo makes travelling around Cameroon easy, safe and affordable.
            Book your tickets anytime from anywhere.
          </p>

          <div className="social-icons">

            <a href="/">
              <FaFacebookF />
            </a>

            <a href="/">
              <FaTwitter />
            </a>

            <a href="/">
              <FaInstagram />
            </a>

            <a href="/">
              <FaLinkedinIn />
            </a>

          </div>

        </div>

        {/* Quick Links */}

        <div className="footer-column">

          <h3>Quick Links</h3>

          <NavLink to="/">Home</NavLink>
          <NavLink to="/">Search Bus</NavLink>
          <NavLink to="/">Routes</NavLink>
          <NavLink to="/">Offers</NavLink>
          <NavLink to="/">About Us</NavLink>

        </div>

        {/* Support */}

        <div className="footer-column">

          <h3>Support</h3>

          <NavLink to="/">Help Centre</NavLink>
          <NavLink to="/">Terms & Conditions</NavLink>
          <NavLink to="/">Privacy Policy</NavLink>
          <NavLink to="/">Refund Policy</NavLink>
          <NavLink to="/">FAQs</NavLink>

        </div>

        {/* Contact */}

        <div className="footer-column">

          <h3>Contact</h3>

          <p>
            <FaMapMarkerAlt />
            Buea, Cameroon
          </p>

          <p>
            <FaPhoneAlt />
            +237 680 000 000
          </p>

          <p>
            <FaEnvelope />
            info@busgo.cm
          </p>

        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} BusGo. All Rights Reserved.
      </div>

    </footer>
  );
}

export default Footer;