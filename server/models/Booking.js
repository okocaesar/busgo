
const db = require("../config/database");

const Booking = {

  // =========================================
  // FIND ROUTE
  // =========================================

  findRouteId: (from, to, callback) => {

    const sql = `
      SELECT id
      FROM routes
      WHERE departure = ?
        AND destination = ?
      LIMIT 1
    `;

    db.query(sql, [from, to], callback);
  },


  // =========================================
  // FIND BUS
  // =========================================

  findBusId: (busType, callback) => {

    const sql = `
      SELECT id
      FROM buses
      WHERE name = ?
      LIMIT 1
    `;

    db.query(sql, [busType], callback);
  },


  // =========================================
  // FIND OFFER
  // =========================================

  findOfferId: (offerTitle, callback) => {

    const sql = `
      SELECT id
      FROM offers
      WHERE title = ?
      LIMIT 1
    `;

    db.query(sql, [offerTitle], callback);
  },


  // =========================================
  // NORMALIZE SEATS
  // =========================================

  normalizeSeats: (seats) => {

    return [
      ...new Set(

        (Array.isArray(seats) ? seats : [])

          .map((seat) => {

            if (
              typeof seat === "object" &&
              seat !== null
            ) {

              return Number(
                seat.seat ??
                seat.seatNumber ??
                seat.number
              );

            }

            return Number(seat);

          })

          .filter(
            (seat) =>
              Number.isInteger(seat) &&
              seat > 0
          )

      )
    ];

  },


  // =========================================
  // GET BOOKED SEATS
  //
  // IMPORTANT:
  // Cancelled bookings are NOT included.
  // =========================================

  getBookedSeats: (
    busId,
    routeId,
    date,
    callback
  ) => {

    const sql = `
      SELECT seats
      FROM bookings
      WHERE bus_id = ?
        AND route_id = ?
        AND travel_date = ?
        AND booking_status = 'Confirmed'
    `;

    db.query(
      sql,
      [busId, routeId, date],
      (err, results) => {

        if (err) {

          console.error(
            "GET BOOKED SEATS SQL ERROR:",
            err
          );

          return callback(err, null);

        }

        const bookedSeats = [];

        if (Array.isArray(results)) {

          results.forEach((booking) => {

            if (!booking.seats) {
              return;
            }

            try {

              let seats = booking.seats;

              if (typeof seats === "string") {
                seats = JSON.parse(seats);
              }

              if (!Array.isArray(seats)) {
                return;
              }

              seats.forEach((seat) => {

                let seatNumber;

                if (
                  typeof seat === "object" &&
                  seat !== null
                ) {

                  seatNumber = Number(
                    seat.seat ??
                    seat.seatNumber ??
                    seat.number
                  );

                } else {

                  seatNumber = Number(seat);

                }

                if (
                  Number.isInteger(seatNumber) &&
                  seatNumber > 0
                ) {

                  bookedSeats.push(
                    seatNumber
                  );

                }

              });

            } catch (error) {

              console.error(
                "Unable to parse booking seats:",
                error
              );

            }

          });

        }

        const uniqueSeats = [
          ...new Set(bookedSeats)
        ];

        console.log(
          "BOOKED SEATS RESULT:",
          {
            busId,
            routeId,
            date,
            bookedSeats: uniqueSeats
          }
        );

        return callback(
          null,
          uniqueSeats
        );

      }
    );

  },


  // =========================================
  // CHECK SEAT AVAILABILITY
  // =========================================

  checkSeatsAvailability: (
    busId,
    routeId,
    date,
    seats,
    callback
  ) => {

    Booking.getBookedSeats(
      busId,
      routeId,
      date,
      (err, bookedSeats) => {

        if (err) {
          return callback(err, null);
        }

        const requestedSeats =
          Booking.normalizeSeats(seats);

        const unavailableSeats =
          requestedSeats.filter(
            (seat) =>
              bookedSeats.includes(seat)
          );

        console.log(
          "AVAILABILITY CHECK:",
          {
            busId,
            routeId,
            date,
            requestedSeats,
            bookedSeats,
            unavailableSeats
          }
        );

        return callback(
          null,
          unavailableSeats
        );

      }
    );

  },


  // =========================================
  // CREATE BOOKING SAFELY
  //
  // ALL BOOKINGS USE:
  //
  // 1. Transaction
  // 2. Bus row lock
  // 3. Re-check existing bookings
  // 4. Insert only if seats are free
  //
  // IMPORTANT:
  // seat_number IS NOT INCLUDED.
  // MySQL generates it automatically.
  // =========================================

  createBookingSafely: (
    booking,
    callback
  ) => {

    const requestedSeats =
      Booking.normalizeSeats(
        booking.seats
      );

    if (requestedSeats.length === 0) {

      const error = new Error(
        "No valid seats were selected."
      );

      error.code =
        "NO_VALID_SEATS";

      return callback(error);

    }

    const finalBooking = {
      ...booking,
      seats: requestedSeats
    };


    // =========================================
    // GET DATABASE CONNECTION
    // =========================================

    db.getConnection(
      (connectionError, connection) => {

        if (connectionError) {

          console.error(
            "DATABASE CONNECTION ERROR:",
            connectionError
          );

          return callback(
            connectionError
          );

        }


        // =========================================
        // START TRANSACTION
        // =========================================

        connection.beginTransaction(
          (transactionError) => {

            if (transactionError) {

              connection.release();

              return callback(
                transactionError
              );

            }


            // =========================================
            // LOCK BUS ROW
            //
            // This is the important part.
            //
            // Two users attempting to book the
            // same bus cannot perform the final
            // seat check simultaneously.
            // =========================================

            const lockBusSql = `
              SELECT id
              FROM buses
              WHERE id = ?
              FOR UPDATE
            `;

            connection.query(
              lockBusSql,
              [finalBooking.busId],
              (
                busLockError,
                busRows
              ) => {

                if (busLockError) {

                  return connection.rollback(
                    () => {

                      connection.release();

                      callback(
                        busLockError
                      );

                    }
                  );

                }


                // =========================================
                // BUS DOES NOT EXIST
                // =========================================

                if (
                  !Array.isArray(busRows) ||
                  busRows.length === 0
                ) {

                  return connection.rollback(
                    () => {

                      connection.release();

                      const error =
                        new Error(
                          "Selected bus does not exist."
                        );

                      error.code =
                        "BUS_NOT_FOUND";

                      callback(error);

                    }
                  );

                }


                // =========================================
                // GET CURRENT CONFIRMED BOOKINGS
                //
                // CANCELLED BOOKINGS ARE EXCLUDED.
                // =========================================

                const existingBookingsSql = `
                  SELECT
                    id,
                    seats
                  FROM bookings
                  WHERE bus_id = ?
                    AND route_id = ?
                    AND travel_date = ?
                    AND booking_status = 'Confirmed'
                  FOR UPDATE
                `;

                connection.query(
                  existingBookingsSql,
                  [
                    finalBooking.busId,
                    finalBooking.routeId,
                    finalBooking.travelDate
                  ],
                  (
                    bookingError,
                    existingBookings
                  ) => {

                    if (bookingError) {

                      return connection.rollback(
                        () => {

                          connection.release();

                          callback(
                            bookingError
                          );

                        }
                      );

                    }


                    // =========================================
                    // COLLECT BOOKED SEATS
                    // =========================================

                    const bookedSeats = [];

                    if (
                      Array.isArray(
                        existingBookings
                      )
                    ) {

                      existingBookings.forEach(
                        (existingBooking) => {

                          if (
                            !existingBooking.seats
                          ) {
                            return;
                          }

                          try {

                            let seats =
                              existingBooking.seats;

                            if (
                              typeof seats ===
                              "string"
                            ) {

                              seats =
                                JSON.parse(
                                  seats
                                );

                            }

                            if (
                              !Array.isArray(
                                seats
                              )
                            ) {
                              return;
                            }

                            seats.forEach(
                              (seat) => {

                                let seatNumber;

                                if (
                                  typeof seat ===
                                    "object" &&
                                  seat !== null
                                ) {

                                  seatNumber =
                                    Number(
                                      seat.seat ??
                                      seat.seatNumber ??
                                      seat.number
                                    );

                                } else {

                                  seatNumber =
                                    Number(seat);

                                }

                                if (
                                  Number.isInteger(
                                    seatNumber
                                  ) &&
                                  seatNumber > 0
                                ) {

                                  bookedSeats.push(
                                    seatNumber
                                  );

                                }

                              }
                            );

                          } catch (error) {

                            console.error(
                              "Unable to parse existing booking seats:",
                              error
                            );

                          }

                        }
                      );

                    }


                    const uniqueBookedSeats = [
                      ...new Set(
                        bookedSeats
                      )
                    ];


                    // =========================================
                    // FIND CONFLICTS
                    // =========================================

                    const unavailableSeats =
                      requestedSeats.filter(
                        (seat) =>
                          uniqueBookedSeats.includes(
                            seat
                          )
                      );


                    console.log(
                      "========================================="
                    );

                    console.log(
                      "FINAL TRANSACTION SEAT CHECK"
                    );

                    console.log(
                      "Bus:",
                      finalBooking.busId
                    );

                    console.log(
                      "Route:",
                      finalBooking.routeId
                    );

                    console.log(
                      "Date:",
                      finalBooking.travelDate
                    );

                    console.log(
                      "Requested:",
                      requestedSeats
                    );

                    console.log(
                      "Already booked:",
                      uniqueBookedSeats
                    );

                    console.log(
                      "Unavailable:",
                      unavailableSeats
                    );

                    console.log(
                      "========================================="
                    );


                    // =========================================
                    // SEAT ALREADY BOOKED
                    // =========================================

                    if (
                      unavailableSeats.length > 0
                    ) {

                      return connection.rollback(
                        () => {

                          connection.release();

                          const error =
                            new Error(
                              "One or more selected seats are already booked."
                            );

                          error.code =
                            "SEATS_ALREADY_BOOKED";

                          error.bookedSeats =
                            unavailableSeats;

                          callback(error);

                        }
                      );

                    }


                    // =========================================
                    // INSERT BOOKING
                    //
                    // IMPORTANT:
                    //
                    // seat_number IS NOT HERE.
                    //
                    // It is a generated column:
                    //
                    // seat_number =
                    // JSON_EXTRACT(seats, '$[0]')
                    //
                    // MySQL generates it automatically.
                    // =========================================

                    const insertSql = `
                      INSERT INTO bookings (

                        ticket_number,
                        user_id,
                        route_id,
                        bus_id,
                        passenger_name,
                        passenger_phone,
                        travel_date,
                        passengers,
                        seats,
                        offer_id,
                        total_price,
                        discount,
                        total_payment,
                        payment_method,
                        payment_status,
                        booking_status,
                        payment_date

                      )

                      VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                      )
                    `;


                    const insertValues = [

                      finalBooking.ticketNumber,

                      finalBooking.userId,

                      finalBooking.routeId,

                      finalBooking.busId,

                      finalBooking.passengerName,

                      finalBooking.passengerPhone,

                      finalBooking.travelDate,

                      requestedSeats.length,

                      JSON.stringify(
                        requestedSeats
                      ),

                      finalBooking.offerId,

                      finalBooking.totalPrice,

                      finalBooking.discount,

                      finalBooking.totalPayment,

                      finalBooking.paymentMethod,

                      finalBooking.paymentStatus,

                      finalBooking.bookingStatus,

                      finalBooking.paymentDate

                    ];


                    connection.query(
                      insertSql,
                      insertValues,
                      (
                        insertError,
                        result
                      ) => {

                        if (insertError) {

                          return connection.rollback(
                            () => {

                              connection.release();

                              console.error(
                                "BOOKING INSERT ERROR:",
                                insertError
                              );

                              if (
                                insertError.code ===
                                "ER_DUP_ENTRY"
                              ) {

                                const error =
                                  new Error(
                                    "One or more seats were just booked by another user. Please try again."
                                  );

                                error.code =
                                  "SEATS_ALREADY_BOOKED";

                                error.bookedSeats =
                                  requestedSeats;

                                return callback(
                                  error
                                );

                              }

                              callback(
                                insertError
                              );

                            }
                          );

                        }


                        // =========================================
                        // COMMIT
                        // =========================================

                        connection.commit(
                          (commitError) => {

                            if (commitError) {

                              return connection.rollback(
                                () => {

                                  connection.release();

                                  callback(
                                    commitError
                                  );

                                }
                              );

                            }


                            connection.release();


                            console.log(
                              "========================================="
                            );

                            console.log(
                              "BOOKING CREATED SAFELY"
                            );

                            console.log(
                              "Booking ID:",
                              result.insertId
                            );

                            console.log(
                              "Seats:",
                              requestedSeats
                            );

                            console.log(
                              "========================================="
                            );


                            return callback(
                              null,
                              {
                                insertId:
                                  result.insertId,

                                affectedRows:
                                  result.affectedRows,

                                bookedSeats:
                                  requestedSeats
                              }
                            );

                          }
                        );

                      }
                    );

                  }
                );

              }
            );

          }
        );

      }
    );

  },


  // =========================================
  // OLD CREATE METHOD
  // KEPT FOR COMPATIBILITY
  // =========================================

  create: (
    booking,
    callback
  ) => {

    const sql = `
      INSERT INTO bookings (

        ticket_number,
        user_id,
        route_id,
        bus_id,
        passenger_name,
        passenger_phone,
        travel_date,
        passengers,
        seats,
        offer_id,
        total_price,
        discount,
        total_payment,
        payment_method,
        payment_status,
        booking_status,
        payment_date

      )

      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
    `;


    db.query(

      sql,

      [

        booking.ticketNumber,

        booking.userId,

        booking.routeId,

        booking.busId,

        booking.passengerName,

        booking.passengerPhone,

        booking.travelDate,

        booking.passengers,

        JSON.stringify(
          booking.seats
        ),

        booking.offerId,

        booking.totalPrice,

        booking.discount,

        booking.totalPayment,

        booking.paymentMethod,

        booking.paymentStatus,

        booking.bookingStatus,

        booking.paymentDate

      ],

      callback

    );

  },


  // =========================================
  // GET USER BOOKINGS
  // =========================================

  findByUserId: (
    userId,
    callback
  ) => {

    const sql = `
      SELECT

        bookings.*,

        routes.departure,

        routes.destination,

        buses.name AS bus_name,

        offers.title AS offer_title,

        offers.discount_percent

      FROM bookings

      LEFT JOIN routes
        ON bookings.route_id = routes.id

      LEFT JOIN buses
        ON bookings.bus_id = buses.id

      LEFT JOIN offers
        ON bookings.offer_id = offers.id

      WHERE bookings.user_id = ?

      ORDER BY bookings.created_at DESC
    `;


    console.log(
      "Loading bookings for user:",
      userId
    );


    db.query(
      sql,
      [userId],
      (err, results) => {

        if (err) {

          console.error(
            "Booking SQL error:",
            err
          );

          return callback(
            err,
            null
          );

        }

        console.log(
          "Bookings found:",
          results.length
        );

        callback(
          null,
          results
        );

      }
    );

  },


  // =========================================
  // CANCEL BOOKING
  // =========================================

  cancelByIdAndUserId: (
    bookingId,
    userId,
    callback
  ) => {

    const sql = `
      UPDATE bookings

      SET booking_status = 'Cancelled'

      WHERE id = ?
        AND user_id = ?
        AND booking_status = 'Confirmed'
    `;


    db.query(
      sql,
      [
        bookingId,
        userId
      ],
      callback
    );

  }

};


// =========================================
// EXPORT
// =========================================

module.exports = Booking;
