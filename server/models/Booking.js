const db = require("../config/database");

const Booking = {
  findRouteId: (from, to, callback) => {
    const sql = `
      SELECT id
      FROM routes
      WHERE departure = ? AND destination = ?
      LIMIT 1
    `;

    db.query(sql, [from, to], callback);
  },

  findBusId: (busType, callback) => {
    const sql = `
      SELECT id
      FROM buses
      WHERE name = ?
      LIMIT 1
    `;

    db.query(sql, [busType], callback);
  },

  findOfferId: (offerTitle, callback) => {
    const sql = `
      SELECT id
      FROM offers
      WHERE title = ?
      LIMIT 1
    `;

    db.query(sql, [offerTitle], callback);
  },

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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        AND bookings.booking_status <> "Cancelled"
      ORDER BY bookings.created_at DESC
    `;

    db.query(sql, [userId], callback);
  },

  cancelByIdAndUserId: (bookingId, userId, callback) => {
    const sql = `
      UPDATE bookings
      SET booking_status = "Cancelled"
      WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [bookingId, userId], callback);
  }
};

module.exports = Booking;