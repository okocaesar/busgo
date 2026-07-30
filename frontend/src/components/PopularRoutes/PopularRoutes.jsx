import React from "react";
import { NavLink } from "react-router-dom";
import "./PopularRoutes.css";

import douala from "../../assets/routes/douala.jpg";
import yaounde from "../../assets/routes/yaounde.jpg";
import buea from "../../assets/routes/buea.jpg";

function PopularRoutes() {
  const routes = [
    {
      image: douala,
      from: "Bamenda",
      to: "Douala",
      price: 5000,
      duration: "6 Hours",
    },
    {
      image: yaounde,
      from: "Yaoundé",
      to: "Buea",
      price: 4500,
      duration: "5 Hours",
    },
    {
      image: buea,
      from: "Douala",
      to: "Limbe",
      price: 3500,
      duration: "2 Hours",
    },
  ];

  return (
    <section className="routes">

      <h2>Popular Bus Routes</h2>

      <p>
        Discover the most travelled destinations across Cameroon.
      </p>

      <div className="route-grid">

        {routes.map((route, index) => (
          <div className="route-card" key={index}>

            <img src={route.image} alt={route.to} />

            <div className="route-info">

              <h3>
                {route.from} → {route.to}
              </h3>

              <span>{route.duration}</span>

              <h4>From XAF {route.price.toLocaleString()}</h4>

              <NavLink to="/booking">
              <button>Book Now</button>
              </NavLink>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default PopularRoutes;