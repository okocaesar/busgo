import React from "react";
import "./SeatSelection.css";

function SeatSelection({ totalSeats, selectedSeats, setSelectedSeats }) {

  const seats = Array.from(
    { length: totalSeats },
    (_, index) => index + 1
  );


  const toggleSeat = (seat) => {

    if (selectedSeats.includes(seat)) {

      setSelectedSeats(
        selectedSeats.filter((s) => s !== seat)
      );

    } else {

      setSelectedSeats([
        ...selectedSeats,
        seat
      ]);

    }

  };


  return (
    <div className="seat-container">

      <h3>
        Select Your Seats
      </h3>


      <div className="bus-layout">

        {seats.map((seat) => (

          <button
            key={seat}
            className={
              selectedSeats.includes(seat)
                ? "seat selected"
                : "seat"
            }

            onClick={() => toggleSeat(seat)}
          >

            {seat}

          </button>

        ))}

      </div>


      <p>
        Selected Seats:
        {" "}
        {selectedSeats.length > 0
          ? selectedSeats.join(", ")
          : "None"}
      </p>


    </div>
  );
}


export default SeatSelection;