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
<> <section className="About-hero"> 
    <div className="overlay">
        <h1>About BusGo</h1>
        <p>Travel Smarter Across Cameroon</p>
    </div>
    </section>

  <section className="about">
    <div className="text">
      <h2>Who We Are</h2>

      <p>
        BusGo is an online bus ticket reservation
        <br />
        system that helps passengers search routes,
        <br />
        select seats, reserve tickets and travel
        conveniently across Cameroon.
      </p>

      <p>
        Our goal is to make transportation easier,
        faster and more reliable.
      </p>
    </div>
  </section>

  <section className="features">
    <div className="card">
      <h3>Easy Booking</h3>
      <p>Book tickets anytime and anywhere.</p>
    </div>

    <div className="card">
      <h3>Secure Payments</h3>
      <p>Safe and reliable payment processing.</p>
    </div>

    <div className="card">
      <h3>Nationwide Routes</h3>
      <p>Travel across major cities in Cameroon.</p>
    </div>
  </section>

  <section className="stats">
    <div className="stat-box">
      <h2>10,000</h2>
      <p>Passengers</p>
    </div>

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

  <section className="team">
    <h2>Meet Our Team</h2>

    <div className="team-container">

      <div className="member">
        <div className="avatar">
          <img src={julius} alt="Oko Julius Caesar" />
        </div>
        <h3>Oko Julius Caesar </h3>
        <p>Developer</p>
      </div>

      <div className="member">
        <div className="avatar">
          <img src={felsy} alt="Felsy-Brighty" />
        </div>
        <h3>Felsy-Brighty </h3>
        <p>Developer</p>
      </div>

      <div className="member">
        <div className="avatar">
          <img src={brenda} alt="Bebongchu Brenda" />
        </div>
        <h3>Bebongchu Brenda </h3>
        <p> Developer</p>
      </div>

      <div className="member">
        <div className="avatar">
          <img src={fabiola} alt="Fabiola Mesumbe" />
        </div>
        <h3>Fabiola Mesumbe </h3>
        <p> Developer</p>
      </div>

      <div className="member">
        <div className="avatar">
          <img src={jardine} alt="Ejah Jardine" />
        </div>
        <h3>Ejah Jardine </h3>
        <p> Developer</p>
      </div>

    </div>
  </section>

  <section className="cta">
    <h2>Ready To Travel?</h2>
    <button>Book Your Ticket Now</button>
  </section>

  <Footer />
</>

);
}

export default About;