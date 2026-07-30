import React from "react";
import { NavLink } from "react-router-dom";
import "./Hero.css";

import hero from "../../assets/hero.jpg";
// import bus from "../../assets/bus.jpg";

function Hero() {
  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${hero})` }}
    >
      <div className="overlay">
        <div className="hero-content">

          <div className="hero-text">
            <h1>
              Travel Easy.
              <br />
              <span>Book Smart.</span>
            </h1>

            <p>
              Book your bus tickets online in minutes.
              Safe, reliable and comfortable journeys.
            </p>

            <NavLink to="/booking">
            <button>Book Now</button>
            </NavLink>
          </div>

          {/* { <div className="hero-image">
            <img src={bus} alt="Bus" />
          </div> } */}

        </div>
      </div>
    </section>
  );
}

export default Hero;