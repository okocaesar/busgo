
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");


// =========================================
// FORMAT PAYMENT DATE FOR MYSQL DATETIME
// =========================================

const formatPaymentDate = (paymentDate) => {

  if (!paymentDate) {
    return null;
  }


  // MYSQL DATETIME
  if (
    typeof paymentDate === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
      paymentDate
    )
  ) {

    return paymentDate;

  }


  // ISO DATE
  if (
    typeof paymentDate === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(
      paymentDate
    )
  ) {

    const date =
      new Date(paymentDate);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

  }


  // DD/MM/YYYY
  if (
    typeof paymentDate === "string" &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      paymentDate
    )
  ) {

    const [
      day,
      month,
      year
    ] =
      paymentDate.split("/");

    return `${year}-${month}-${day} 00:00:00`;

  }


  // JAVASCRIPT DATE
  if (
    paymentDate instanceof Date
  ) {

    if (
      isNaN(
        paymentDate.getTime()
      )
    ) {

      return null;

    }

    return paymentDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

  }


  return null;

};


// =========================================
// GET BOOKED SEATS
// GET /api/bookings/availability
// =========================================

exports.getBookedSeats = (
  req,
  res
) => {

  let {
    busId,
    routeId,
    date
  } = req.query;


  // Legacy support
  if (!busId) {
    busId =
      req.params.busId;
  }


  if (!date) {
    date =
      req.params.date;
  }


  console.log(
    "========================================="
  );

  console.log(
    "CHECKING BOOKED SEATS"
  );

  console.log(
    "Bus ID:",
    busId
  );

  console.log(
    "Route ID:",
    routeId
  );

  console.log(
    "Travel Date:",
    date
  );

  console.log(
    "========================================="
  );


  // =========================================
  // VALIDATION
  // =========================================

  if (
    !busId ||
    !routeId ||
    !date
  ) {

    return res.status(400).json({

      message:
        "Bus ID, route ID and travel date are required.",

      bookedSeats: []

    });

  }

console.log("========== AVAILABILITY REQUEST ==========");
console.log("busId:", busId);
console.log("routeId:", routeId);
console.log("date:", date);
console.log("==========================================");

  Booking.getBookedSeats(

    Number(busId),

    Number(routeId),

    date,

    (
      err,
      seats
    ) => {

      if (err) {

        console.error(
          "Get booked seats error:",
          err
        );

        return res.status(500).json({

          message:
            "Failed to retrieve booked seats.",

          error:
            err.message,

          bookedSeats: []

        });

      }


      const bookedSeats =
        Array.isArray(seats)

          ? seats
              .map(
                (seat) =>
                  Number(seat)
              )
              .filter(
                (seat) =>
                  Number.isInteger(
                    seat
                  ) &&
                  seat > 0
              )

          : [];


      const uniqueBookedSeats = [
        ...new Set(bookedSeats)
      ];


      console.log(
        "BOOKED SEATS:",
        uniqueBookedSeats
      );


      return res.status(200).json({

        bookedSeats:
          uniqueBookedSeats

      });

    }

  );

};


// =========================================
// CREATE BOOKING
// POST /api/bookings
// =========================================

exports.createBooking = async (
  req,
  res
) => {

  try {

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
    // VALIDATION
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
          "Please provide all required booking information.",

        missing: {

          ticketNumber:
            !ticketNumber,

          userId:
            !userId,

          name:
            !name,

          phone:
            !phone,

          from:
            !from,

          to:
            !to,

          busType:
            !busType,

          seats:
            !Array.isArray(seats) ||
            seats.length === 0,

          date:
            !date,

          paymentMethod:
            !paymentMethod

        }

      });

    }


    // =========================================
    // NORMALIZE SEATS
    // =========================================

    const normalizedSeats =
      Booking.normalizeSeats(
        seats
      );


    if (
      normalizedSeats.length === 0
    ) {

      return res.status(400).json({

        message:
          "Please select at least one valid seat."

      });

    }


    console.log(
      "========================================="
    );

    console.log(
      "NEW BOOKING ATTEMPT"
    );

    console.log(
      "User:",
      userId
    );

    console.log(
      "Route:",
      `${from} → ${to}`
    );

    console.log(
      "Bus:",
      busType
    );

    console.log(
      "Date:",
      date
    );

    console.log(
      "Seats:",
      normalizedSeats
    );

    console.log(
      "========================================="
    );


    // =========================================
    // LOOK UP ROUTE, BUS AND OFFER
    // =========================================

    const [

      routeResults,

      busResults,

      offerResults

    ] = await Promise.all([


      // ROUTE
      new Promise(
        (
          resolve,
          reject
        ) => {

          Booking.findRouteId(
            from,
            to,
            (
              err,
              result
            ) => {

              if (err) {
                return reject(err);
              }

              resolve(result);

            }
          );

        }
      ),


      // BUS
      new Promise(
        (
          resolve,
          reject
        ) => {

          Booking.findBusId(
            busType,
            (
              err,
              result
            ) => {

              if (err) {
                return reject(err);
              }

              resolve(result);

            }
          );

        }
      ),


      // OFFER
      new Promise(
        (resolve) => {

          if (
            !offerTitle ||
            offerTitle === "No Offer"
          ) {

            return resolve([]);

          }


          Booking.findOfferId(
            offerTitle,
            (
              err,
              result
            ) => {

              if (err) {

                console.error(
                  "Offer lookup error:",
                  err
                );

                return resolve([]);

              }

              resolve(
                result || []
              );

            }
          );

        }
      )

    ]);


    // =========================================
    // VALIDATE ROUTE
    // =========================================

    if (
      !routeResults ||
      routeResults.length === 0
    ) {

      return res.status(400).json({

        message:
          "The selected route was not found."

      });

    }


    const routeId =
      Number(
        routeResults[0].id
      );


    // =========================================
    // VALIDATE BUS
    // =========================================

    if (
      !busResults ||
      busResults.length === 0
    ) {

      return res.status(400).json({

        message:
          "The selected bus type was not found."

      });

    }


    const busId =
      Number(
        busResults[0].id
      );


    // =========================================
    // OFFER
    // =========================================

    const offerId =

      offerResults &&
      offerResults.length > 0

        ? Number(
            offerResults[0].id
          )

        : null;


    console.log(
      "LOOKUP RESULTS:"
    );

    console.log(
      "Route ID:",
      routeId
    );

    console.log(
      "Bus ID:",
      busId
    );

    console.log(
      "Offer ID:",
      offerId
    );


    // =========================================
    // QUICK AVAILABILITY CHECK
    //
    // This is only an early check.
    //
    // The REAL protection is inside
    // createBookingSafely(), which runs
    // inside a transaction.
    // =========================================

    const unavailableSeats =
      await new Promise(
        (
          resolve,
          reject
        ) => {

          Booking.checkSeatsAvailability(

            busId,

            routeId,

            date,

            normalizedSeats,

            (
              err,
              result
            ) => {

              if (err) {
                return reject(err);
              }

              resolve(
                result || []
              );

            }

          );

        }
      );


    if (
      unavailableSeats.length > 0
    ) {

      console.log(
        "BOOKING REJECTED (EARLY CHECK)"
      );

      console.log(
        "Already booked:",
        unavailableSeats
      );


      return res.status(409).json({

        message:
          "One or more selected seats are already booked.",

        bookedSeats:
          unavailableSeats

      });

    }


    // =========================================
    // BUILD BOOKING
    // =========================================

    const booking = {

      ticketNumber,

      userId:
        Number(userId),

      routeId,

      busId,

      passengerName:
        name,

      passengerPhone:
        phone,

      travelDate:
        date,

      passengers:
        normalizedSeats.length,

      seats:
        normalizedSeats,

      offerId,

      totalPrice:
        Number(totalPrice) || 0,

      discount:
        Number(discount) || 0,

      totalPayment:
        Number(totalPayment) || 0,

      paymentMethod,

      paymentStatus:
        paymentStatus ||
        "Successful",

      bookingStatus:
        "Confirmed",

      paymentDate:
        formatPaymentDate(
          paymentDate
        )

    };


    console.log(
      "SAVING BOOKING:",
      booking
    );


    // =========================================
    // FINAL SAFE BOOKING
    //
    // This performs the REAL race-condition
    // protection.
    // =========================================

    const result =
      await new Promise(
        (
          resolve,
          reject
        ) => {

          Booking.createBookingSafely(

            booking,

            (
              err,
              result
            ) => {

              if (err) {
                return reject(err);
              }

              resolve(result);

            }

          );

        }
      );


    console.log(
      "========================================="
    );

    console.log(
      "BOOKING CREATED SUCCESSFULLY"
    );

    console.log(
      "Booking ID:",
      result.insertId
    );

    console.log(
      "Seats:",
      normalizedSeats
    );

    console.log(
      "========================================="
    );


    // =========================================
    // CREATE NOTIFICATION
    // =========================================

    const notification = {

      userId:
        Number(userId),

      title:
        "Booking Successful 🎫",

      message:
        `Thank you ${name}! Your booking from ${from} to ${to} has been successfully confirmed. Your ticket number is ${ticketNumber}. We wish you a safe and pleasant journey!`,

      type:
        "booking",

      isRead:
        0

    };


    let notificationCreated =
      false;


    try {

      await new Promise(
        (
          resolve,
          reject
        ) => {

          Notification.create(
            notification,
            (err) => {

              if (err) {
                return reject(err);
              }

              resolve();

            }
          );

        }
      );


      notificationCreated =
        true;


      console.log(
        "Booking notification created successfully."
      );


    } catch (
      notificationError
    ) {

      console.error(
        "Notification creation error:",
        notificationError
      );

    }


    // =========================================
    // FINAL RESPONSE
    // =========================================

    return res.status(201).json({

      message:
        "Booking saved successfully.",

      bookingId:
        result.insertId,

      ticketNumber,

      bookedSeats:
        normalizedSeats,

      notification:
        notificationCreated

    });


  } catch (error) {

    console.error(
      "========================================="
    );

    console.error(
      "CREATE BOOKING ERROR:",
      error
    );

    console.error(
      "========================================="
    );


    // =========================================
    // DUPLICATE SEAT
    // =========================================

    if (
      error.code ===
      "SEATS_ALREADY_BOOKED"
    ) {

      console.log(
        "DUPLICATE SEAT BLOCKED:",
        error.bookedSeats
      );


      return res.status(409).json({

        message:
          "One or more selected seats were just booked by another user.",

        bookedSeats:
          error.bookedSeats || []

      });

    }


    // =========================================
    // BUS NOT FOUND
    // =========================================

    if (
      error.code ===
      "BUS_NOT_FOUND"
    ) {

      return res.status(400).json({

        message:
          "Selected bus does not exist."

      });

    }


    // =========================================
    // NO VALID SEATS
    // =========================================

    if (
      error.code ===
      "NO_VALID_SEATS"
    ) {

      return res.status(400).json({

        message:
          "No valid seats were selected."

      });

    }


    // =========================================
    // DATABASE DUPLICATE
    // =========================================

    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {

      console.error(
        "DATABASE UNIQUE CONSTRAINT CAUGHT DUPLICATE:",
        error
      );


      return res.status(409).json({

        message:
          "One or more selected seats are already booked.",

        bookedSeats: []

      });

    }


    // =========================================
    // GENERATED COLUMN ERROR
    // =========================================

    if (
      error.code ===
      "ER_NON_DEFAULT_VALUE_FOR_GENERATED_COLUMN"
    ) {

      return res.status(500).json({

        message:
          "Booking database configuration error. The generated seat number must not be manually inserted.",

        error:
          error.message

      });

    }


    // =========================================
    // GENERIC ERROR
    // =========================================

    return res.status(500).json({

      message:
        "Failed to save booking.",

      error:
        error.message

    });

  }

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
    (
      err,
      results
    ) => {

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

    (
      err,
      result
    ) => {

      if (err) {

        console.error(
          "CANCEL BOOKING DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Failed to cancel booking.",

          error:
            err.message

        });

      }


      // =========================================
      // IMPORTANT
      //
      // If already cancelled, affectedRows = 0.
      // =========================================

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          message:
            "Booking not found or already cancelled."

        });

      }


      console.log(
        "Booking cancelled successfully:",
        bookingId
      );


      // =========================================
      // CANCELLATION NOTIFICATION
      // =========================================

      const notification = {

        userId:
          Number(userId),

        title:
          "Booking Cancelled ❌",

        message:
          `Your BusGo booking #${bookingId} has been successfully cancelled. If you did not request this cancellation, please contact BusGo support.`,

        type:
          "warning",

        isRead:
          0

      };


      Notification.create(
        notification,
        (
          notificationError
        ) => {

          if (
            notificationError
          ) {

            console.error(
              "Cancellation notification error:",
              notificationError
            );


            return res.status(200).json({

              message:
                "Booking cancelled successfully.",

              bookingId,

              notification:
                false

            });

          }


          return res.status(200).json({

            message:
              "Booking cancelled successfully.",

            bookingId,

            notification:
              true

          });

        }
      );

    }
  );

};