import React, { useMemo } from "react";
import "./SeatSelection.css";

function SeatSelection({
  totalSeats,
  selectedSeats = [],
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
  // FAST LOOKUP FOR BOOKED SEATS
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

  // =========================================
  // FAST LOOKUP FOR CURRENT USER'S SEATS
  // =========================================

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
  // CHECK IF SEAT IS SELECTED BY CURRENT USER
  // =========================================

  const isSelected = (seat) => {
    return selectedSet.has(Number(seat));
  };

  // =========================================
  // SELECT / DESELECT SEAT
  // =========================================

  const toggleSeat = (seat) => {
    // Never allow a booked seat to be selected
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

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="seat-container">

      {/* TITLE */}
      <h3>
        Select Your Seats
      </h3>

      {/* LEGEND */}
      <div className="seat-legend">

        {/* AVAILABLE */}
        <div className="legend-item">
          <span className="legend-seat available"></span>
          <span>Available</span>
        </div>

        {/* CURRENT USER SELECTED */}
        <div className="legend-item">
          <span className="legend-seat selected"></span>
          <span>Your Seat</span>
        </div>

        {/* BOOKED */}
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
              🟢 All seats are currently available
            </span>
          )}

        </div>
      )}

      {/* BUS SEAT LAYOUT */}
      <div className="bus-layout">

        {/* DRIVER */}
        <div className="bus-driver">
          🚍
        </div>

        {seats.map((seat) => {

          const booked = isBooked(seat);
          const selected = isSelected(seat);

          // =========================================
          // DETERMINE SEAT COLOR
          //
          // RED    = BOOKED
          // YELLOW = CURRENT USER SELECTION
          // GREEN  = AVAILABLE
          // =========================================

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
                    ? "Click to deselect your seat"
                    : "Click to select this seat"
              }
              aria-label={
                booked
                  ? `Seat ${seat} is booked`
                  : selected
                    ? `Seat ${seat} is selected by you`
                    : `Seat ${seat} is available`
              }
            >

              {/* SEAT NUMBER */}
              <span className="seat-number">
                {seat}
              </span>

              {/* BOOKED */}
              {booked && (
                <span className="seat-status-label">
                  TAKEN
                </span>
              )}

              {/* AVAILABLE */}
              {!booked && !selected && (
                <span className="seat-status-label">
                  FREE
                </span>
              )}

              {/* CURRENT USER'S SEAT */}
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

        <strong>
          Your Selected Seats:
        </strong>

        <span>
          {selectedSeats.length > 0
            ? selectedSeats.join(", ")
            : "None"}
        </span>

      </div>

      {/* EXPLANATION */}
      <p className="booked-seat-message">
        🔴 Red = already booked&nbsp;&nbsp;
        🟢 Green = available&nbsp;&nbsp;
        🟡 Yellow = your selected seat
      </p>

    </div>
  );
}

export default SeatSelection;