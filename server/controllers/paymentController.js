const db = require("../config/database");


// =========================================
// CREATE PAYMENT
// POST /api/payments
// =========================================

exports.createPayment = (req, res) => {

  const {
    userId,
    bookingId,
    amount,
    currency,
    paymentMethod,
    phoneNumber
  } = req.body;


  // =========================================
  // AUTHENTICATION
  // =========================================

  const authenticatedUserId = req.user?.id;

  if (!authenticatedUserId) {

    return res.status(401).json({
      message: "Please login first."
    });

  }


  // =========================================
  // VALIDATION
  // =========================================

  if (!bookingId) {

    return res.status(400).json({
      message: "Booking ID is required."
    });

  }


  if (!amount || Number(amount) <= 0) {

    return res.status(400).json({
      message: "A valid payment amount is required."
    });

  }


  if (!paymentMethod) {

    return res.status(400).json({
      message: "Payment method is required."
    });

  }


  // =========================================
  // MAKE SURE USER CAN ONLY CREATE
  // PAYMENT FOR THEIR OWN BOOKING
  // =========================================

  const finalUserId =
    userId || authenticatedUserId;


  if (
    Number(finalUserId) !==
    Number(authenticatedUserId)
  ) {

    return res.status(403).json({
      message:
        "You are not allowed to create a payment for another user."
    });

  }


  // =========================================
  // VERIFY BOOKING
  // =========================================

  const bookingSql = `

    SELECT

      id,

      user_id,

      ticket_number,

      total_payment,

      booking_status

    FROM bookings

    WHERE id = ?

    AND user_id = ?

    LIMIT 1

  `;


  db.query(
    bookingSql,
    [
      bookingId,
      authenticatedUserId
    ],
    (bookingError, bookings) => {

      if (bookingError) {

        console.error(
          "VERIFY BOOKING FOR PAYMENT ERROR:",
          bookingError
        );

        return res.status(500).json({
          message:
            "Unable to verify the booking.",
          error:
            bookingError.message
        });

      }


      if (
        !bookings ||
        bookings.length === 0
      ) {

        return res.status(404).json({
          message:
            "Booking not found."
        });

      }


      const booking =
        bookings[0];


      // =========================================
      // CHECK PAYMENT AMOUNT
      // =========================================

      const bookingAmount =
        Number(booking.total_payment);


      const paymentAmount =
        Number(amount);


      if (
        Math.abs(
          bookingAmount -
          paymentAmount
        ) > 0.01
      ) {

        return res.status(400).json({
          message:
            "Payment amount does not match the booking total."
        });

      }


      // =========================================
      // PREVENT DUPLICATE PAYMENT
      // =========================================

      const existingPaymentSql = `

        SELECT

          id,

          transaction_id,

          status

        FROM payments

        WHERE booking_id = ?

        AND user_id = ?

        LIMIT 1

      `;


      db.query(
        existingPaymentSql,
        [
          bookingId,
          authenticatedUserId
        ],
        (existingError, existingPayments) => {

          if (existingError) {

            console.error(
              "CHECK EXISTING PAYMENT ERROR:",
              existingError
            );

            return res.status(500).json({
              message:
                "Unable to check existing payment.",
              error:
                existingError.message
            });

          }


          if (
            existingPayments &&
            existingPayments.length > 0
          ) {

            const existingPayment =
              existingPayments[0];


            return res.status(409).json({

              message:
                "A payment already exists for this booking.",

              payment:
                existingPayment

            });

          }


          // =========================================
          // GENERATE TRANSACTION ID
          // =========================================

          const transactionId =
            "BG-TXN-" +
            Date.now() +
            "-" +
            Math.floor(
              1000 +
              Math.random() * 9000
            );


          // =========================================
          // CREATE PAYMENT
          // =========================================

          const insertPaymentSql = `

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

              'Successful',

              ?,

              NOW(),

              NOW(),

              NOW()

            )

          `;


          db.query(
            insertPaymentSql,
            [

              authenticatedUserId,

              bookingId,

              transactionId,

              paymentAmount,

              currency || "XAF",

              paymentMethod,

              phoneNumber || null

            ],
            (insertError, result) => {

              if (insertError) {

                console.error(
                  "CREATE PAYMENT ERROR:",
                  insertError
                );

                return res.status(500).json({

                  message:
                    "Unable to save payment.",

                  error:
                    insertError.message

                });

              }


              return res.status(201).json({

                message:
                  "Payment recorded successfully.",

                paymentId:
                  result.insertId,

                transactionId,

                bookingId,

                amount:
                  paymentAmount,

                currency:
                  currency || "XAF",

                paymentMethod,

                status:
                  "Successful"

              });

            }
          );

        }
      );

    }
  );

};



// =========================================
// GET MY PAYMENTS
// GET /api/payments/my-payments
// =========================================

exports.getMyPayments = (req, res) => {

  const userId = req.user?.id;


  if (!userId) {

    return res.status(401).json({
      message: "Please login first."
    });

  }


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
          "GET MY PAYMENTS ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to load your payment history.",

          error:
            err.message

        });

      }


      return res.status(200).json({

        payments:
          results || []

      });

    }
  );

};



// =========================================
// REQUEST PAYMENT REVERSAL
// PATCH /api/payments/:paymentId/request-reversal
// =========================================

exports.requestPaymentReversal = (req, res) => {

  const {
    paymentId
  } = req.params;


  const userId =
    req.user?.id;


  if (!userId) {

    return res.status(401).json({
      message:
        "Please login first."
    });

  }


  if (!paymentId) {

    return res.status(400).json({
      message:
        "Payment ID is required."
    });

  }


  const findPaymentSql = `

    SELECT

      id,

      user_id,

      booking_id,

      transaction_id,

      amount,

      currency,

      payment_method,

      status,

      payment_date,

      reversal_requested_at,

      reversed_at

    FROM payments

    WHERE id = ?

    AND user_id = ?

    LIMIT 1

  `;


  db.query(
    findPaymentSql,
    [
      paymentId,
      userId
    ],
    (findError, payments) => {

      if (findError) {

        console.error(
          "FIND PAYMENT FOR REVERSAL ERROR:",
          findError
        );

        return res.status(500).json({
          message:
            "Unable to find the payment.",
          error:
            findError.message
        });

      }


      if (
        !payments ||
        payments.length === 0
      ) {

        return res.status(404).json({
          message:
            "Payment not found."
        });

      }


      const payment =
        payments[0];


      // =========================================
      // ALREADY REVERSED
      // =========================================

      if (
        payment.status ===
        "Reversed"
      ) {

        return res.status(400).json({
          message:
            "This payment has already been reversed."
        });

      }


      // =========================================
      // ALREADY REQUESTED
      // =========================================

      if (
        payment.status ===
        "Requested Reversal"
      ) {

        return res.status(400).json({
          message:
            "A reversal request has already been submitted for this payment."
        });

      }


      // =========================================
      // ONLY SUCCESSFUL PAYMENTS
      // =========================================

      if (
        payment.status !==
        "Successful"
      ) {

        return res.status(400).json({
          message:
            "Only successful payments can be submitted for reversal."
        });

      }


      // =========================================
      // REQUEST REVERSAL
      // =========================================

      const reversalSql = `

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
        reversalSql,
        [
          paymentId,
          userId
        ],
        (updateError, result) => {

          if (updateError) {

            console.error(
              "REQUEST PAYMENT REVERSAL ERROR:",
              updateError
            );

            return res.status(500).json({

              message:
                "Unable to submit the reversal request.",

              error:
                updateError.message

            });

          }


          if (
            result.affectedRows === 0
          ) {

            return res.status(400).json({

              message:
                "The payment could not be submitted for reversal. It may have already been processed."

            });

          }


          return res.status(200).json({

            message:
              "Payment reversal request submitted successfully.",

            paymentId,

            status:
              "Requested Reversal"

          });

        }
      );

    }
  );

};