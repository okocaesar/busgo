import React from "react";
import "./Features.css";
import {
  FaBus,
  FaMapMarkedAlt,
  FaHeadset,
  FaShieldAlt,
} from "react-icons/fa";

function Features() {
  return (
    <section className="features">

      <h2>Why Choose BusGo?</h2>

      <p className="subtitle">
        We make travelling easier, safer and more convenient.
      </p>

      <div className="feature-container">

        <div className="feature-card">
          <FaBus className="feature-icon" />
          <h3>Easy Booking</h3>
          <p>
            Book your tickets online anytime in just a few clicks.
          </p>
        </div>

        <div className="feature-card">
          <FaMapMarkedAlt className="feature-icon" />
          <h3>Live Tracking</h3>
          <p>
            Track your bus in real time and know exactly when it arrives.
          </p>
        </div>

        <div className="feature-card">
          <FaShieldAlt className="feature-icon" />
          <h3>Safe Travel</h3>
          <p>
            Verified operators and secure online payments for peace of mind.
          </p>
        </div>

        <div className="feature-card">
          <FaHeadset className="feature-icon" />
          <h3>24/7 Support</h3>
          <p>
            Our customer support team is always available to assist you.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Features;