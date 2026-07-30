import React, { useState } from "react";
import { NavLink } from "react-router-dom";

import routes from "../../data/routes";

import "./Routes.css";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

console.log("Routes import:", routes);
console.log("Is array?", Array.isArray(routes));

function Routes() {

  const [search, setSearch] = useState("");



  const filteredRoutes = routes.filter((route) =>

    `${route.from} ${route.to}`
      .toLowerCase()
      .includes(search.toLowerCase())

  );



  return (
    <>

      <Navbar />


      <section className="routes-hero">

        <div className="hero-overlay">

          <h1>
            Available Bus Routes
          </h1>


          <p>
            Find your perfect journey across Cameroon.
          </p>


        </div>

      </section>





      <section className="routes-container">



        <div className="search-box">


          <input

            type="text"

            placeholder="Search by departure or destination..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

          />


        </div>





        <div className="route-grid">


          {
            filteredRoutes.map((route)=>(


              <div 
                className="route-card" 
                key={route.id}
              >



                <img

                  src={route.image}

                  alt={`${route.from} to ${route.to}`}

                />





                <div className="route-content">



                  <h2>

                    {route.from} → {route.to}

                  </h2>





                  <div className="route-details">


                    <span>

                      🕒 {route.duration}

                    </span>



                    <span>

                      {route.type}

                    </span>



                  </div>





                  <h3>

                    XAF {route.price.toLocaleString("en-GB")}

                  </h3>





                  <NavLink to="/booking"state={{ route }}>

                    <button>

                      Book Now

                    </button>


                  </NavLink>




                </div>



              </div>



            ))
          }





          {
            filteredRoutes.length === 0 && (

              <h2 className="no-results">

                No routes found.

              </h2>

            )
          }



        </div>




      </section>





      <Footer />



    </>
  );

}



export default Routes;