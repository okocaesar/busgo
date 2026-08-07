const Booking = require("../models/Booking");


// =========================================
// FORMAT PAYMENT DATE
// =========================================

const formatPaymentDate = (paymentDate) => {

  if (!paymentDate) {
    return null;
  }

  if (
    typeof paymentDate === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(paymentDate)
  ) {
    return paymentDate;
  }

  if (
    typeof paymentDate === "string" &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(paymentDate)
  ) {

    const [
      day,
      month,
      year
    ] = paymentDate.split("/");

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


  // =========================================
  // VALIDATE BOOKING
  // =========================================

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
      message:
        "Please provide all required booking information."
    });
  }


  // =========================================
  // FIND ROUTE
  // =========================================

  Booking.findRouteId(
    from,
    to,
    (routeError, routeResults) => {

      if (routeError) {

        console.error(
          "Route lookup error:",
          routeError
        );

        return res.status(500).json({
          message:
            "Failed to find the selected route.",
          error: routeError.message
        });
      }


      if (
        !routeResults ||
        routeResults.length === 0
      ) {

        return res.status(400).json({
          message:
            "The selected route was not found."
        });
      }


      // =========================================
      // FIND BUS
      // =========================================

      Booking.findBusId(
        busType,
        (busError, busResults) => {

          if (busError) {

            console.error(
              "Bus lookup error:",
              busError
            );

            return res.status(500).json({
              message:
                "Failed to find the selected bus.",
              error: busError.message
            });
          }


          if (
            !busResults ||
            busResults.length === 0
          ) {

            return res.status(400).json({
              message:
                "The selected bus type was not found."
            });
          }


          // =========================================
          // SAVE BOOKING
          // =========================================

          const saveBooking = (offerId) => {

            const booking = {

              ticketNumber,

              userId,

              routeId:
                routeResults[0].id,

              busId:
                busResults[0].id,

              passengerName:
                name,

              passengerPhone:
                phone,

              travelDate:
                date,

              passengers:
                seats.length,

              seats,

              offerId,

              totalPrice:
                Number(totalPrice) || 0,

              discount:
                Number(discount) || 0,

              totalPayment:
                Number(totalPayment) || 0,

              paymentMethod,

              paymentStatus:
                paymentStatus || "Paid",

              bookingStatus:
                "Confirmed",

              paymentDate:
                formatPaymentDate(paymentDate)
            };


            Booking.create(
              booking,
              (createError, result) => {

                if (createError) {

                  console.error(
                    "Booking creation error:",
                    createError
                  );

                  return res.status(500).json({
                    message:
                      "Failed to save booking.",

                    error:
                      createError.message
                  });
                }


                return res.status(201).json({

                  message:
                    "Booking saved successfully.",

                  bookingId:
                    result.insertId,

                  ticketNumber
                });
              }
            );
          };


          // =========================================
          // NO OFFER
          // =========================================

          if (
            !offerTitle ||
            offerTitle === "No Offer"
          ) {

            saveBooking(null);

            return;
          }


          // =========================================
          // FIND OFFER
          // =========================================

          Booking.findOfferId(
            offerTitle,
            (offerError, offerResults) => {

              if (offerError) {

                console.error(
                  "Offer lookup error:",
                  offerError
                );

                return res.status(500).json({
                  message:
                    "Failed to find the selected offer.",

                  error:
                    offerError.message
                });
              }


              const offerId =
                offerResults &&
                offerResults.length > 0
                  ? offerResults[0].id
                  : null;


              saveBooking(offerId);
            }
          );
        }
      );
    }
  );
};


// =========================================
// GET USER BOOKINGS
// GET /api/bookings/user/:userId
// =========================================

exports.getUserBookings = (
  req,
  res
) => {

  const {
    userId
  } = req.params;


  if (!userId) {

    return res.status(400).json({
      message:
        "User ID is required."
    });
  }


  console.log(
    "GET USER BOOKINGS:",
    userId
  );


  Booking.findByUserId(
    userId,
    (err, results) => {

      if (err) {

        console.error(
          "Get bookings error:",
          err
        );

        return res.status(500).json({
          message:
            "Failed to retrieve bookings.",

          error:
            err.message
        });
      }


      return res.json({

        bookings:
          results || []

      });
    }
  );
};


// =========================================
// CANCEL BOOKING
// PATCH /api/bookings/:bookingId/cancel/user/:userId
// =========================================

exports.cancelBooking = (
  req,
  res
) => {

  const {
    bookingId,
    userId
  } = req.params;


  if (
    !bookingId ||
    !userId
  ) {

    return res.status(400).json({
      message:
        "Booking ID and User ID are required."
    });
  }


  Booking.cancelByIdAndUserId(
    bookingId,
    userId,
    (err, result) => {

      if (err) {

        console.error(
          "Cancel booking error:",
          err
        );

        return res.status(500).json({
          message:
            "Failed to cancel booking.",

          error:
            err.message
        });
      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            "Booking not found."
        });
      }


      return res.json({
        message:
          "Booking cancelled successfully."
      });
    }
  );
};