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

    db.query(
      sql,
      [from, to],
      callback
    );
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

    db.query(
      sql,
      [busType],
      callback
    );
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

    db.query(
      sql,
      [offerTitle],
      callback
    );
  },


  // =========================================
  // CREATE BOOKING
  // =========================================

  create: (booking, callback) => {

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
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
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
        JSON.stringify(booking.seats),
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

  findByUserId: (userId, callback) => {

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

      SET booking_status = ?

      WHERE id = ?
        AND user_id = ?
    `;

    db.query(
      sql,
      [
        "Cancelled",
        bookingId,
        userId
      ],
      callback
    );
  }

};

module.exports = Booking;