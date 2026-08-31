import React, { useState } from "react";
import { NavLink } from "react-router-dom";

import routes from "../../data/routes";

import { useTranslation } from "../../useTranslation";

import "./Routes.css";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

console.log("Routes import:", routes);
console.log("Is array?", Array.isArray(routes));

function Routes() {

  const { t } = useTranslation();

  const [search, setSearch] = useState("");

  // =========================================
  // FILTER ROUTES
  // =========================================

  const filteredRoutes = routes.filter((route) =>

    `${route.from} ${route.to}`
      .toLowerCase()
      .includes(search.toLowerCase())

  );

  return (
    <>

      <Navbar />


      {/* =====================================
          ROUTES HERO
      ===================================== */}

      <section className="routes-hero">

        <div className="hero-overlay">

          <h1>
            {t("Available Bus Routes")}
          </h1>

          <p>
            {t("Routes Description")}
          </p>

        </div>

      </section>


      {/* =====================================
          ROUTES CONTAINER
      ===================================== */}

      <section className="routes-container">


        {/* ===================================
            SEARCH
        =================================== */}

        <div className="search-box">

          <input
            type="text"
            placeholder={t("Search Routes")}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        {/* ===================================
            ROUTE GRID
        =================================== */}

        <div className="route-grid">

          {filteredRoutes.map((route) => (

            <div
              className="route-card"
              key={route.id}
            >

              <img
                src={route.image}
                alt={`${route.from} ${t("to")} ${route.to}`}
              />


              <div className="route-content">


                {/* ROUTE NAME */}

                <h2>
                  {route.from} → {route.to}
                </h2>


                {/* ROUTE DETAILS */}

                <div className="route-details">

                  <span>
                    🕒 {route.duration}
                  </span>

                  <span>
                    {route.type}
                  </span>

                </div>


                {/* PRICE */}

                <h3>
                  XAF{" "}
                  {route.price.toLocaleString("en-GB")}
                </h3>


                {/* BOOK */}

                <NavLink
                  to="/booking"
                  state={{ route }}
                >

                  <button>
                    {t("Book Now")}
                  </button>

                </NavLink>


              </div>

            </div>

          ))}


          {/* =================================
              NO RESULTS
          ================================= */}

          {filteredRoutes.length === 0 && (

            <h2 className="no-results">

              {t("No Routes Found")}

            </h2>

          )}

        </div>

      </section>


      <Footer />

    </>
  );
}

export default Routes;
