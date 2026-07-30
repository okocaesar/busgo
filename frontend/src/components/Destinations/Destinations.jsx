import React from "react";
import "./Destinations.css";

import limbe from "../../assets/destinations/limbe.jpg";
import kribi from "../../assets/destinations/kribi.jpg";
import yaounde from "../../assets/destinations/yaounde.jpg";
import douala from "../../assets/destinations/douala.jpg";

const destinations = [
  {
    image: limbe,
    city: "Limbe",
    text: "Beautiful beaches and relaxing views."
  },
  {
    image: kribi,
    city: "Kribi",
    text: "Experience Cameroon’s famous coastline."
  },
  {
    image: yaounde,
    city: "Yaoundé",
    text: "The political capital with rich culture."
  },
  {
    image: douala,
    city: "Douala",
    text: "Business hub with vibrant nightlife."
  }
];

function Destinations() {
  return (
    <section className="destinations">

      <div className="section-title">
        <h2>Explore Popular Destinations</h2>
        <p>
          Travel comfortably to Cameroon’s most loved cities.
        </p>
      </div>

      <div className="destination-grid">

        {destinations.map((item, index) => (

          <div className="destination-card" key={index}>

            <img src={item.image} alt={item.city} />

            <div className="destination-overlay">

              <h3>{item.city}</h3>

              <p>{item.text}</p>

              <button>Explore</button>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}

export default Destinations;