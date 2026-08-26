const db = require("../config/database");

// =========================================
// PAYMENT MODEL
// =========================================
//
// BusGo uses MySQL.
// This model provides database operations for
// the `payments` table.
//
// Payment statuses used by the current system:
//
// Successful
// Requested Reversal
// Reversed
//
// =========================================

const Payment = {

  // =========================================
  // CREATE PAYMENT
  // =========================================
  //
  // Creates a successful payment record.
  //
  // =========================================

  create: (payment, callback) => {

    const sql = `
      INSERT INTO payments (
        user_id,
        booking_id,
        transaction_id,
        amount,
        currency,
        payment_method,
        status,
        phone_number,
        payment_date,
        created_at,
        updated_at
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
        NOW(),
        NOW(),
        NOW()
      )
    `;

    const values = [
      payment.userId,
      payment.bookingId,
      payment.transactionId,
      payment.amount,
      payment.currency || "XAF",
      payment.paymentMethod,
      payment.status || "Successful",
      payment.phoneNumber || null
    ];

    db.query(
      sql,
      values,
      callback
    );
  },

  // =========================================
  // FIND PAYMENT BY ID
  // =========================================

  findById: (
    paymentId,
    callback
  ) => {

    const sql = `
      SELECT
        payments.*,

        bookings.ticket_number,
        bookings.booking_status,
        bookings.travel_date,

        routes.departure,
        routes.destination,

        users.name AS user_name,
        users.email AS user_email

      FROM payments

      LEFT JOIN bookings
        ON payments.booking_id = bookings.id

      LEFT JOIN routes
        ON bookings.route_id = routes.id

      LEFT JOIN users
        ON payments.user_id = users.id

      WHERE payments.id = ?

      LIMIT 1
    `;

    db.query(
      sql,
      [paymentId],
      (err, results) => {

        if (err) {

          console.error(
            "FIND PAYMENT BY ID SQL ERROR:",
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
  // FIND PAYMENT FOR USER
  // =========================================
  //
  // Ensures the payment belongs to the
  // authenticated user.
  //
  // =========================================

  findByIdAndUserId: (
    paymentId,
    userId,
    callback
  ) => {

    const sql = `
      SELECT
        payments.*,

        bookings.ticket_number,
        bookings.booking_status,
        bookings.travel_date,

        routes.departure,
        routes.destination

      FROM payments

      LEFT JOIN bookings
        ON payments.booking_id = bookings.id

      LEFT JOIN routes
        ON bookings.route_id = routes.id

      WHERE payments.id = ?
        AND payments.user_id = ?

      LIMIT 1
    `;

    db.query(
      sql,
      [
        paymentId,
        userId
      ],
      (err, results) => {

        if (err) {

          console.error(
            "FIND USER PAYMENT SQL ERROR:",
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
  // FIND PAYMENT BY BOOKING
  // =========================================
  //
  // Used to prevent duplicate payments
  // for the same booking.
  //
  // =========================================

  findByBookingId: (
    bookingId,
    userId,
    callback
  ) => {

    const sql = `
      SELECT
        id,
        user_id,
        booking_id,
        transaction_id,
        amount,
        currency,
        payment_method,
        status,
        phone_number,
        payment_date,
        created_at,
        updated_at,
        reversal_requested_at,
        reversed_at,
        reversal_reason,
        reversal_processed_by

      FROM payments

      WHERE booking_id = ?
        AND user_id = ?

      LIMIT 1
    `;

    db.query(
      sql,
      [
        bookingId,
        userId
      ],
      (err, results) => {

        if (err) {

          console.error(
            "FIND PAYMENT BY BOOKING SQL ERROR:",
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
  // GET USER PAYMENTS
  // =========================================

  findByUserId: (
    userId,
    callback
  ) => {

    const sql = `
      SELECT

        payments.id,
        payments.user_id,
        payments.booking_id,
        payments.transaction_id,
        payments.amount,
        payments.currency,
        payments.payment_method,
        payments.status,
        payments.phone_number,
        payments.payment_date,
        payments.created_at,
        payments.updated_at,

        payments.reversal_requested_at,
        payments.reversed_at,
        payments.reversal_reason,
        payments.reversal_processed_by,

        bookings.ticket_number,
        bookings.booking_status,

        routes.departure,
        routes.destination,
        routes.departure_date

      FROM payments

      LEFT JOIN bookings
        ON payments.booking_id = bookings.id

      LEFT JOIN routes
        ON bookings.route_id = routes.id

      WHERE payments.user_id = ?

      ORDER BY payments.payment_date DESC
    `;

    db.query(
      sql,
      [userId],
      (err, results) => {

        if (err) {

          console.error(
            "GET USER PAYMENTS SQL ERROR:",
            err
          );

          return callback(
            err,
            null
          );
        }

        return callback(
          null,
          results || []
        );
      }
    );
  },

  // =========================================
  // REQUEST PAYMENT REVERSAL
  // =========================================
  //
  // Successful
  //       ↓
  // Requested Reversal
  //
  // =========================================

  requestReversal: (
    paymentId,
    userId,
    callback
  ) => {

    const sql = `
      UPDATE payments

      SET
        status = 'Requested Reversal',
        reversal_requested_at = NOW(),
        updated_at = NOW()

      WHERE id = ?
        AND user_id = ?
        AND status = 'Successful'
    `;

    db.query(
      sql,
      [
        paymentId,
        userId
      ],
      callback
    );
  },

  // =========================================
  // REVERSE PAYMENT
  // =========================================
  //
  // Intended for admin processing.
  //
  // Requested Reversal
  //        ↓
  // Reversed
  //
  // =========================================

  reversePayment: (
    paymentId,
    reason,
    processedBy,
    callback
  ) => {

    const sql = `
      UPDATE payments

      SET
        status = 'Reversed',
        reversed_at = NOW(),
        reversal_reason = ?,
        reversal_processed_by = ?,
        updated_at = NOW()

      WHERE id = ?
        AND status = 'Requested Reversal'
    `;

    db.query(
      sql,
      [
        reason || "",
        processedBy || null,
        paymentId
      ],
      callback
    );
  },

  // =========================================
  // DENY PAYMENT REVERSAL
  // =========================================
  //
  // If your database design keeps the payment
  // as Successful when an admin denies a
  // reversal request, this resets the status.
  //
  // =========================================

  denyReversal: (
    paymentId,
    reason,
    callback
  ) => {

    const sql = `
      UPDATE payments

      SET
        status = 'Successful',
        reversal_reason = ?,
        updated_at = NOW()

      WHERE id = ?
        AND status = 'Requested Reversal'
    `;

    db.query(
      sql,
      [
        reason || "",
        paymentId
      ],
      callback
    );
  }

};

// =========================================
// EXPORT PAYMENT MODEL
// =========================================

module.exports = Payment;