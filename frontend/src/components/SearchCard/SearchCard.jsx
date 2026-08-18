import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import cities from "../../data/cities";
import { useTranslation } from "../../useTranslation";

import "./SearchCard.css";

function SearchCard() {

  const navigate = useNavigate();

  const { t } = useTranslation();

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

    // =========================================
    // CHECK DEPARTURE
    // =========================================

    if (!searchData.from) {

      alert(
        t.searchDepartureRequired ||
        "Please select your departure city."
      );

      return;

    }

    // =========================================
    // CHECK DESTINATION
    // =========================================

    if (!searchData.to) {

      alert(
        t.searchDestinationRequired ||
        "Please select your destination."
      );

      return;

    }

    // =========================================
    // CHECK SAME CITY
    // =========================================

    if (
      searchData.from ===
      searchData.to
    ) {

      alert(
        t.searchSameCity ||
        "Departure and destination cannot be the same."
      );

      return;

    }

    // =========================================
    // CHECK DATE
    // =========================================

    if (!searchData.date) {

      alert(
        t.searchDateRequired ||
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

  // =========================================
  // RENDER
  // =========================================

  return (

    <section className="search-section">

      <div className="search-card">

        {/* =====================================
            FROM
        ===================================== */}

        <div className="input-group">

          <label>
            {t.from || "From"}
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
              {t.selectDepartureCity ||
                "Select departure city"}
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
            {t.to || "To"}
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
              {t.selectDestination ||
                "Select destination"}
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
            {t.departure || "Departure"}
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
            {t.passengers || "Passengers"}
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
              {t.onePassenger ||
                "1 Passenger"}
            </option>

            <option value="2">
              {t.twoPassengers ||
                "2 Passengers"}
            </option>

            <option value="3">
              {t.threePassengers ||
                "3 Passengers"}
            </option>

            <option value="4">
              {t.fourPassengers ||
                "4 Passengers"}
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
          {t.searchBuses ||
            "Search Buses"}
        </button>

      </div>

    </section>

  );

}

export default SearchCard;