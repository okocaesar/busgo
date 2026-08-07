const Booking = require("../models/Booking");

const formatPaymentDate = (paymentDate) => {
  if (!paymentDate) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(paymentDate)) {
    return paymentDate;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(paymentDate)) {
    const [day, month, year] = paymentDate.split("/");

    return `${year}-${month}-${day} 00:00:00`;
  }

  return null;
};

// =========================================
// CREATE BOOKING
// POST /api/bookings
// =========================================

exports.createBooking = (req, res) => {
  const {
    ticketNumber,
    userId,
    name,
    phone,
    from,
    to,
    busType,
    seats,
    date,
    totalPrice,
    discount,
    totalPayment,
    offerTitle,
    paymentMethod,
    paymentStatus,
    paymentDate
  } = req.body;

  if (
    !ticketNumber ||
    !userId ||
    !name ||
    !phone ||
    !from ||
    !to ||
    !busType ||
    !Array.isArray(seats) ||
    seats.length === 0 ||
    !date ||
    !paymentMethod
  ) {
    return res.status(400).json({
      message: "Please provide all required booking information."
    });
  }

  Booking.findRouteId(from, to, (routeError, routeResults) => {
    if (routeError) {
      return res.status(500).json({
        message: "Failed to find the selected route."
      });
    }

    if (routeResults.length === 0) {
      return res.status(400).json({
        message: "The selected route was not found."
      });
    }

    Booking.findBusId(busType, (busError, busResults) => {
      if (busError) {
        return res.status(500).json({
          message: "Failed to find the selected bus."
        });
      }

      if (busResults.length === 0) {
        return res.status(400).json({
          message: "The selected bus type was not found."
        });
      }

      const saveBooking = (offerId) => {
        const booking = {
          ticketNumber,
          userId,
          routeId: routeResults[0].id,
          busId: busResults[0].id,
          passengerName: name,
          passengerPhone: phone,
          travelDate: date,
          passengers: seats.length,
          seats,
          offerId,
          totalPrice: Number(totalPrice) || 0,
          discount: Number(discount) || 0,
          totalPayment: Number(totalPayment) || 0,
          paymentMethod,
          paymentStatus: paymentStatus || "Paid",
          bookingStatus: "Confirmed",
          paymentDate: formatPaymentDate(paymentDate)
        };

        Booking.create(booking, (createError, result) => {
          if (createError) {
            console.error("Booking creation error:", createError);

            return res.status(500).json({
              message: "Failed to save booking.",
              error: createError.message
            });
          }

          res.status(201).json({
            message: "Booking saved successfully.",
            bookingId: result.insertId,
            ticketNumber
          });
        });
      };

      if (!offerTitle || offerTitle === "No Offer") {
        saveBooking(null);
        return;
      }

      Booking.findOfferId(offerTitle, (offerError, offerResults) => {
        if (offerError) {
          return res.status(500).json({
            message: "Failed to find the selected offer."
          });
        }

        const offerId =
          offerResults.length > 0
            ? offerResults[0].id
            : null;

        saveBooking(offerId);
      });
    });
  });
};

// =========================================
// GET USER BOOKINGS
// GET /api/bookings/:userId
// =========================================

exports.getUserBookings = (req, res) => {
  const { userId } = req.params;

  Booking.findByUserId(userId, (err, results) => {
    if (err) {
      console.error("Get bookings error:", err);

      return res.status(500).json({
        message: "Failed to retrieve bookings."
      });
    }

    res.json({
      bookings: results
    });
  });
};

// =========================================
// CANCEL BOOKING
// PATCH /api/bookings/:bookingId/cancel/user/:userId
// =========================================

exports.cancelBooking = (req, res) => {
  const { bookingId, userId } = req.params;

  Booking.cancelByIdAndUserId(
    bookingId,
    userId,
    (err, result) => {
      if (err) {
        console.error("Cancel booking error:", err);

        return res.status(500).json({
          message: "Failed to cancel booking."
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Booking not found."
        });
      }

      res.json({
        message: "Booking cancelled successfully."
      });
    }
  );
};