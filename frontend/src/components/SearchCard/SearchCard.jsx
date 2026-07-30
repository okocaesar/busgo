import React from "react";
import "./SearchCard.css";

function SearchCard() {
  return (
    <section className="search-section">
      <div className="search-card">

        <div className="input-group">
          <label>From</label>
          <input type="text" placeholder="Enter departure city" />
        </div>

        <div className="input-group">
          <label>To</label>
          <input type="text" placeholder="Enter destination" />
        </div>

        <div className="input-group">
          <label>Departure</label>
          <input type="date" />
        </div>

        <div className="input-group">
          <label>Passengers</label>
          <select>
            <option value="1">1 Passenger</option>
            <option value="2">2 Passengers</option>
            <option value="3">3 Passengers</option>
            <option value="4">4 Passengers</option>
          </select>
        </div>

        <button className="search-btn">
          Search Buses
        </button>

      </div>
    </section>
  );
}

export default SearchCard;