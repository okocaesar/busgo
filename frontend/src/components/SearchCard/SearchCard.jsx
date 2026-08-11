import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import cities from "../../data/cities";

import "./SearchCard.css";


function SearchCard() {

  const navigate = useNavigate();


  // =========================================
  // SEARCH DATA
  // =========================================

  const [searchData, setSearchData] = useState({

    from: "",

    to: "",

    date: "",

    passengers: "1"

  });


  // =========================================
  // HANDLE INPUT CHANGES
  // =========================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setSearchData((prev) => ({

      ...prev,

      [name]: value

    }));

  };


  // =========================================
  // SEARCH BUSES
  // =========================================

  const handleSearch = () => {


    // Check departure

    if (!searchData.from) {

      alert(
        "Please select your departure city."
      );

      return;

    }


    // Check destination

    if (!searchData.to) {

      alert(
        "Please select your destination."
      );

      return;

    }


    // Check same city

    if (
      searchData.from ===
      searchData.to
    ) {

      alert(
        "Departure and destination cannot be the same."
      );

      return;

    }


    // Check date

    if (!searchData.date) {

      alert(
        "Please select your departure date."
      );

      return;

    }


    // =========================================
    // SEND DATA TO BOOKING
    // =========================================

    navigate(
      "/booking",
      {

        state: {

          from:
            searchData.from,

          to:
            searchData.to,

          date:
            searchData.date,

          passengers:
            Number(
              searchData.passengers
            )

        }

      }
    );

  };


  return (

    <section className="search-section">

      <div className="search-card">


        {/* =====================================
            FROM
        ===================================== */}

        <div className="input-group">

          <label>
            From
          </label>


          <select

            name="from"

            value={
              searchData.from
            }

            onChange={
              handleChange
            }

          >

            <option value="">
              Select departure city
            </option>


            {cities.map(
              (city) => (

                <option
                  key={city}
                  value={city}
                >

                  {city}

                </option>

              )
            )}

          </select>

        </div>



        {/* =====================================
            TO
        ===================================== */}

        <div className="input-group">

          <label>
            To
          </label>


          <select

            name="to"

            value={
              searchData.to
            }

            onChange={
              handleChange
            }

          >

            <option value="">
              Select destination
            </option>


            {cities

              .filter(
                (city) =>
                  city !==
                  searchData.from
              )

              .map(
                (city) => (

                  <option
                    key={city}
                    value={city}
                  >

                    {city}

                  </option>

                )
              )}

          </select>

        </div>



        {/* =====================================
            DEPARTURE DATE
        ===================================== */}

        <div className="input-group">

          <label>
            Departure
          </label>


          <input

            type="date"

            name="date"

            value={
              searchData.date
            }

            onChange={
              handleChange
            }

            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }

          />

        </div>



        {/* =====================================
            PASSENGERS
        ===================================== */}

        <div className="input-group">

          <label>
            Passengers
          </label>


          <select

            name="passengers"

            value={
              searchData.passengers
            }

            onChange={
              handleChange
            }

          >

            <option value="1">
              1 Passenger
            </option>

            <option value="2">
              2 Passengers
            </option>

            <option value="3">
              3 Passengers
            </option>

            <option value="4">
              4 Passengers
            </option>

          </select>

        </div>



        {/* =====================================
            SEARCH BUTTON
        ===================================== */}

        <button

          type="button"

          className="search-btn"

          onClick={
            handleSearch
          }

        >

          Search Buses

        </button>


      </div>

    </section>

  );

}


export default SearchCard;