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
    if (!Array.isArray(seats)) {
      return [];
    }

    return [
      ...new Set(
        seats
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
  // PARSE SEATS
  //
  // Converts MySQL JSON into a clean array.
  // =========================================

  parseSeats: (seats) => {
    if (!seats) {
      return [];
    }

    try {
      let parsedSeats = seats;

      if (typeof parsedSeats === "string") {
        parsedSeats = JSON.parse(parsedSeats);
      }

      return Booking.normalizeSeats(parsedSeats);
    } catch (error) {
      console.error(
        "Unable to parse booking seats:",
        error
      );

      return [];
    }
  },

  // =========================================
  // GET BOOKED SEATS
  //
  // Availability is based on:
  //
  // BUS + ROUTE + TRAVEL DATE
  //
  // Cancelled bookings are ignored.
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
      [
        busId,
        routeId,
        date
      ],
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
            const seats = Booking.parseSeats(
              booking.seats
            );

            bookedSeats.push(...seats);
          });
        }

        const uniqueSeats = [
          ...new Set(bookedSeats)
        ].sort((a, b) => a - b);

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
    const requestedSeats =
      Booking.normalizeSeats(seats);

    if (requestedSeats.length === 0) {
      return callback(null, []);
    }

    Booking.getBookedSeats(
      busId,
      routeId,
      date,
      (err, bookedSeats) => {
        if (err) {
          return callback(err, null);
        }

        const unavailableSeats =
          requestedSeats.filter((seat) =>
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
  // Uses:
  //
  // 1. Transaction
  // 2. Bus row lock
  // 3. Final seat check
  // 4. Database insert
  // 5. Commit
  //
  // IMPORTANT:
  //
  // seat_number is a GENERATED COLUMN.
  // We NEVER insert it manually.
  // =========================================

  createBookingSafely: (
    booking,
    callback
  ) => {
    const requestedSeats =
      Booking.normalizeSeats(
        booking.seats
      );

    // =========================================
    // VALIDATE SEATS
    // =========================================

    if (requestedSeats.length === 0) {
      const error = new Error(
        "No valid seats were selected."
      );

      error.code = "NO_VALID_SEATS";

      return callback(error);
    }

    // =========================================
    // VALIDATE REQUIRED DATABASE REFERENCES
    // =========================================

    if (
      !booking.userId ||
      !booking.busId ||
      !booking.routeId ||
      !booking.travelDate
    ) {
      const error = new Error(
        "Missing required booking information."
      );

      error.code = "INVALID_BOOKING_DATA";

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
            // This serializes booking attempts
            // for the same bus.
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
                // VERIFY ROUTE EXISTS
                //
                // Because route_id uses ON DELETE RESTRICT,
                // valid bookings should always reference
                // an existing route.
                // =========================================

                const routeSql = `
                  SELECT id
                  FROM routes
                  WHERE id = ?
                  LIMIT 1
                `;

                connection.query(
                  routeSql,
                  [finalBooking.routeId],
                  (
                    routeError,
                    routeRows
                  ) => {
                    if (routeError) {
                      return connection.rollback(
                        () => {
                          connection.release();

                          callback(
                            routeError
                          );
                        }
                      );
                    }

                    if (
                      !Array.isArray(routeRows) ||
                      routeRows.length === 0
                    ) {
                      return connection.rollback(
                        () => {
                          connection.release();

                          const error =
                            new Error(
                              "Selected route does not exist."
                            );

                          error.code =
                            "ROUTE_NOT_FOUND";

                          callback(error);
                        }
                      );
                    }

                    // =========================================
                    // GET CURRENT CONFIRMED BOOKINGS
                    //
                    // Cancelled bookings are excluded.
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
                        // COLLECT ALL BOOKED SEATS
                        // =========================================

                        const bookedSeats = [];

                        if (
                          Array.isArray(
                            existingBookings
                          )
                        ) {
                          existingBookings.forEach(
                            (existingBooking) => {
                              const seats =
                                Booking.parseSeats(
                                  existingBooking.seats
                                );

                              bookedSeats.push(
                                ...seats
                              );
                            }
                          );
                        }

                        const uniqueBookedSeats = [
                          ...new Set(
                            bookedSeats
                          )
                        ].sort(
                          (a, b) => a - b
                        );

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
                                  "Some seats have already been booked."
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
                        // seat_number IS NOT INCLUDED.
                        //
                        // MySQL generates it automatically:
                        //
                        // Confirmed -> first seat
                        // Cancelled -> NULL
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
                          finalBooking.offerId ??
                            null,
                          finalBooking.totalPrice ??
                            0,
                          finalBooking.discount ??
                            0,
                          finalBooking.totalPayment ??
                            0,
                          finalBooking.paymentMethod ??
                            null,
                          finalBooking.paymentStatus ??
                            "Pending",
                          finalBooking.bookingStatus ??
                            "Confirmed",
                          finalBooking.paymentDate ??
                            null
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

                                  // =========================================
                                  // DUPLICATE TICKET
                                  // =========================================

                                  if (
                                    insertError.code ===
                                    "ER_DUP_ENTRY"
                                  ) {
                                    const error =
                                      new Error(
                                        "This booking could not be created because a duplicate record was detected."
                                      );

                                    error.code =
                                      "BOOKING_DUPLICATE";

                                    error.originalError =
                                      insertError;

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
                            // COMMIT TRANSACTION
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
                                  "Ticket:",
                                  finalBooking.ticketNumber
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
      }
    );
  },

  // =========================================
  // OLD CREATE METHOD
  //
  // KEPT FOR BACKWARD COMPATIBILITY
  //
  // NOTE:
  // seat_number is still NOT inserted manually.
  // =========================================

  create: (
    booking,
    callback
  ) => {
    const seats =
      Booking.normalizeSeats(
        booking.seats
      );

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

    const values = [
      booking.ticketNumber,
      booking.userId,
      booking.routeId,
      booking.busId,
      booking.passengerName,
      booking.passengerPhone,
      booking.travelDate,
      seats.length,
      JSON.stringify(seats),
      booking.offerId ?? null,
      booking.totalPrice ?? 0,
      booking.discount ?? 0,
      booking.totalPayment ?? 0,
      booking.paymentMethod ?? null,
      booking.paymentStatus ??
        "Pending",
      booking.bookingStatus ??
        "Confirmed",
      booking.paymentDate ?? null
    ];

    db.query(
      sql,
      values,
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

        return callback(
          null,
          results
        );
      }
    );
  },

  // =========================================
  // GET BOOKING BY ID
  // =========================================

  findById: (
    bookingId,
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

      WHERE bookings.id = ?

      LIMIT 1
    `;

    db.query(
      sql,
      [bookingId],
      (err, results) => {
        if (err) {
          console.error(
            "Find booking by ID SQL error:",
            err
          );

          return callback(
            err,
            null
          );
        }

        return callback(
          null,
          results
        );
      }
    );
  },

  // =========================================
  // CANCEL BOOKING
  //
  // Only the owner can cancel.
  //
  // When booking_status changes to Cancelled,
  // the generated seat_number becomes NULL.
  //
  // This means the database UNIQUE constraint
  // no longer blocks those seats.
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
// EXPORT BOOKING MODEL
// =========================================

module.exports = Booking;