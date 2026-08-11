
import React from "react";
import "./AboutUs.css";

import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

import julius from "../../assets/Members/julius.jpeg";
import felsy from "../../assets/Members/felsy.jpeg";
import brenda from "../../assets/Members/brenda.jpeg";
import fabiola from "../../assets/Members/fabiola.jpeg";
import jardine from "../../assets/Members/jardine.jpeg";

function About() {
  return (
    <>
      {/* =========================================
          NAVBAR
      ========================================= */}
      <Navbar />

      {/* =========================================
          ABOUT PAGE
      ========================================= */}
      <main className="about-page">

        {/* =========================================
            HERO / INTRODUCTION
        ========================================= */}
        <section className="about-hero">
          <h1>About BusGo</h1>

          <h2>Travel Smarter Across Cameroon</h2>

          <p>
            BusGo is an online bus ticket reservation
            <br />
            system that helps passengers search routes,
            <br />
            select seats, reserve tickets and travel
            <br />
            conveniently across Cameroon.
          </p>

          <p>
            Our goal is to make transportation easier,
            faster and more reliable.
          </p>
        </section>

        {/* =========================================
            FEATURES
        ========================================= */}
        <section className="about-features">

          <div className="card">
            <h3>Secure Payments</h3>
            <p>
              Safe and reliable payment processing.
            </p>
          </div>

          <div className="card">
            <h3>Nationwide Routes</h3>
            <p>
              Travel across major cities in Cameroon.
            </p>
          </div>

        </section>

        {/* =========================================
            STATISTICS
        ========================================= */}
        <section className="stats-container">

          <div className="stat-box">
            <h2>50+</h2>
            <p>Daily Trips</p>
          </div>

          <div className="stat-box">
            <h2>20+</h2>
            <p>Routes</p>
          </div>

          <div className="stat-box">
            <h2>98%</h2>
            <p>Satisfaction</p>
          </div>

        </section>

        {/* =========================================
            OUR TEAM
        ========================================= */}
        <section className="team-section">

          <h2>Meet Our Team</h2>

          <div className="team-container">

            <div className="member">
              <div className="avatar">
                <img
                  src={julius}
                  alt="Oko Julius Caesar"
                />
              </div>

              <h3>Oko Julius Caesar</h3>
              <p>Developer</p>
            </div>

            <div className="member">
              <div className="avatar">
                <img
                  src={felsy}
                  alt="Felsy-Brighty"
                />
              </div>

              <h3>Felsy-Brighty</h3>
              <p>Developer</p>
            </div>

            <div className="member">
              <div className="avatar">
                <img
                  src={brenda}
                  alt="Bebongchu Brenda"
                />
              </div>

              <h3>Bebongchu Brenda</h3>
              <p>Developer</p>
            </div>

            <div className="member">
              <div className="avatar">
                <img
                  src={fabiola}
                  alt="Fabiola Mesumbe"
                />
              </div>

              <h3>Fabiola Mesumbe</h3>
              <p>Developer</p>
            </div>

            <div className="member">
              <div className="avatar">
                <img
                  src={jardine}
                  alt="Ejah Jardine"
                />
              </div>

              <h3>Ejah Jardine</h3>
              <p>Developer</p>
            </div>

          </div>

        </section>

      </main>

      {/* =========================================
          FOOTER
      ========================================= */}
      <Footer />
    </>
  );
}

export default About;
