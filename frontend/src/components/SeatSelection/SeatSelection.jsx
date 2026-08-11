import React, { useMemo } from "react";
import "./SeatSelection.css";

function SeatSelection({
  totalSeats,
  selectedSeats,
  setSelectedSeats,
  bookedSeats = []
}) {

  // =========================================
  // CREATE SEAT NUMBERS
  // =========================================

  const seats = useMemo(() => {

    return Array.from(
      { length: Number(totalSeats) || 0 },
      (_, index) => index + 1
    );

  }, [totalSeats]);


  // =========================================
  // FAST LOOKUP USING SET (for booked seats)
  // =========================================

const bookedSet = useMemo(() => {

    return new Set(
        bookedSeats
            .map((seat) => Number(seat))
            .filter(
                (seat) =>
                    Number.isInteger(seat) &&
                    seat > 0
            )
    );

}, [bookedSeats]);



  const selectedSet = useMemo(() => {

    return new Set(
      selectedSeats.map((seat) => Number(seat))
    );

  }, [selectedSeats]);


  // =========================================
  // CHECK IF SEAT IS BOOKED
  // =========================================

  const isBooked = (seat) => {

    return bookedSet.has(Number(seat));

  };


  // =========================================
  // CHECK IF SEAT IS SELECTED
  // =========================================

  const isSelected = (seat) => {

    return selectedSet.has(Number(seat));

  };


  // =========================================
  // SELECT / DESELECT SEAT
  // =========================================

  const toggleSeat = (seat) => {

    // NEVER ALLOW BOOKED SEAT

    if (isBooked(seat)) {

      return;

    }


    // DESELECT

    if (isSelected(seat)) {

      setSelectedSeats(

        selectedSeats.filter(
          (s) => Number(s) !== Number(seat)
        )

      );

      return;

    }


    // SELECT

    setSelectedSeats([

      ...selectedSeats,
      Number(seat)

    ]);

  };


  return (

    <div className="seat-container">

      {/* TITLE */}

      <h3>
        Select Your Seats
      </h3>


      {/* LEGEND */}

      <div className="seat-legend">

        <div className="legend-item">

          <span className="legend-seat available"></span>

          <span>Available</span>

        </div>


        <div className="legend-item">

          <span className="legend-seat selected"></span>

          <span>Selected</span>

        </div>


        <div className="legend-item">

          <span className="legend-seat booked"></span>

          <span>Booked / Taken</span>

        </div>

      </div>


      {/* STATUS MESSAGE */}

      {totalSeats > 0 && (

        <div className="seat-status">

          {bookedSeats.length > 0 ? (

            <span>
              🔴 {bookedSeats.length} seat
              {bookedSeats.length > 1 ? "s" : ""}
              {" "}already booked for this trip
            </span>

          ) : (

            <span>
              � All seats are currently available
            </span>

          )}

        </div>

      )}


      {/* BUS SEAT LAYOUT */}

      <div className="bus-layout">

         {/* Driver seat indicator */}
  <div className="bus-driver">
    🚍
  </div>

        {seats.map((seat) => {

          const booked = isBooked(seat);
          const selected = isSelected(seat);


          let seatClass = "seat";

          if (booked) {

            seatClass += " booked";

          } else if (selected) {

            seatClass += " selected";

          } else {

            seatClass += " available";

          }


          return (

            <button

              key={seat}
              type="button"
              className={seatClass}
              disabled={booked}
              onClick={() => toggleSeat(seat)}
              title={
                booked
                  ? "❌ This seat is already booked"
                  : selected
                    ? "Click to deselect this seat"
                    : "Click to select this seat"
              }
              aria-label={
                booked
                  ? `Seat ${seat} is booked`
                  : selected
                    ? `Seat ${seat} is selected`
                    : `Seat ${seat} is available`
              }

            >

              <span className="seat-number">
                {seat}
              </span>


              {booked && (

                <span className="seat-status-label">
                  TAKEN
                </span>

              )}


              {!booked && !selected && (

                <span className="seat-status-label">
                  FREE
                </span>

              )}


              {selected && (

                <span className="seat-status-label">
                  ✓
                </span>

              )}

            </button>

          );

        })}

      </div>


      {/* SELECTED SEATS SUMMARY */}

      <div className="selected-seat-summary">

        <strong>Selected Seats:</strong>

        <span>
          {selectedSeats.length > 0
            ? selectedSeats.join(", ")
            : "None"}
        </span>

      </div>


      {/* BOOKED MESSAGE */}

      {bookedSeats.length > 0 && (

        <p className="booked-seat-message">

          🔴 Red seats are already booked and cannot be selected.
          Green seats are available. Click a seat to select it.

        </p>

      )}

    </div>

  );

}


export default SeatSelection;
