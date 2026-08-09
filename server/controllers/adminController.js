const db = require("../config/database");

// =========================================
// GET ADMIN STATISTICS
// GET /api/admin/stats
// =========================================

exports.getStats = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS totalUsers,

      (SELECT COUNT(*) FROM bookings) AS totalBookings,

      (
        SELECT COUNT(*)
        FROM bookings
        WHERE booking_status = ?
      ) AS confirmedBookings,

      (
        SELECT COUNT(*)
        FROM bookings
        WHERE booking_status = ?
      ) AS cancelledBookings,

      (
        SELECT COALESCE(SUM(total_payment), 0)
        FROM bookings
        WHERE booking_status = ?
      ) AS totalRevenue
  `;

  db.query(
    sql,
    ["Confirmed", "Cancelled", "Confirmed"],
    (err, results) => {
      if (err) {
        console.error(
          "ADMIN STATS DATABASE ERROR:",
          err
        );

        return res.status(500).json({
          message: "Unable to load admin statistics.",
          error: err.message
        });
      }

      console.log(
        "ADMIN STATS:",
        results[0]
      );

      res.json({
        totalUsers: Number(
          results[0].totalUsers || 0
        ),

        totalBookings: Number(
          results[0].totalBookings || 0
        ),

        confirmedBookings: Number(
          results[0].confirmedBookings || 0
        ),

        cancelledBookings: Number(
          results[0].cancelledBookings || 0
        ),

        totalRevenue: Number(
          results[0].totalRevenue || 0
        )
      });
    }
  );
};


// =========================================
// GET ALL USERS
// GET /api/admin/users
// =========================================

exports.getUsers = (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      role,
      created_at
    FROM users
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "ADMIN USERS DATABASE ERROR:",
        err
      );

      return res.status(500).json({
        message: "Unable to load users.",
        error: err.message
      });
    }

    res.json({
      users: results
    });
  });
};


// =========================================
// GET ALL BOOKINGS
// GET /api/admin/bookings
// =========================================

exports.getBookings = (req, res) => {
  const sql = `
    SELECT
      bookings.*,

      users.name AS user_name,
      users.email AS user_email,

      routes.departure,
      routes.destination,

      buses.name AS bus_name,

      offers.title AS offer_title

    FROM bookings

    LEFT JOIN users
      ON bookings.user_id = users.id

    LEFT JOIN routes
      ON bookings.route_id = routes.id

    LEFT JOIN buses
      ON bookings.bus_id = buses.id

    LEFT JOIN offers
      ON bookings.offer_id = offers.id

    ORDER BY bookings.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "ADMIN BOOKINGS DATABASE ERROR:",
        err
      );

      return res.status(500).json({
        message: "Unable to load bookings.",
        error: err.message
      });
    }

    res.json({
      bookings: results
    });
  });
};


// =========================================
// UPDATE BOOKING STATUS
// PATCH /api/admin/bookings/:bookingId/status
// =========================================

// =========================================
// UPDATE BOOKING STATUS
// PATCH /api/admin/bookings/:bookingId/status
// =========================================

exports.updateBookingStatus = (req, res) => {

  const {
    bookingId
  } = req.params;

  const {
    bookingStatus
  } = req.body;


  // =========================================
  // ALLOWED STATUSES
  // =========================================

  const allowedStatuses = [
    "Confirmed",
    "Cancelled"
  ];


  if (
    !allowedStatuses.includes(
      bookingStatus
    )
  ) {

    return res.status(400).json({
      message:
        "Invalid booking status."
    });

  }


  // =========================================
  // GET BOOKING INFORMATION FIRST
  // =========================================

  const bookingSql = `
    SELECT

      bookings.id,
      bookings.ticket_number,
      bookings.user_id,
      bookings.booking_status,
      bookings.travel_date,

      users.name AS user_name,
      users.email AS user_email,

      routes.departure,
      routes.destination

    FROM bookings

    LEFT JOIN users
      ON bookings.user_id = users.id

    LEFT JOIN routes
      ON bookings.route_id = routes.id

    WHERE bookings.id = ?

    LIMIT 1
  `;


  db.query(
    bookingSql,
    [bookingId],
    (bookingError, bookingResults) => {

      if (bookingError) {

        console.error(
          "GET BOOKING BEFORE STATUS UPDATE ERROR:",
          bookingError
        );

        return res.status(500).json({

          message:
            "Unable to retrieve booking information.",

          error:
            bookingError.message

        });

      }


      // =========================================
      // BOOKING NOT FOUND
      // =========================================

      if (
        !bookingResults ||
        bookingResults.length === 0
      ) {

        return res.status(404).json({

          message:
            "Booking not found."

        });

      }


      const booking =
        bookingResults[0];


      const oldStatus =
        booking.booking_status;


      // =========================================
      // NO STATUS CHANGE
      // =========================================

      if (
        oldStatus === bookingStatus
      ) {

        return res.status(200).json({

          message:
            `Booking is already ${bookingStatus}.`

        });

      }


      // =========================================
      // UPDATE BOOKING STATUS
      // =========================================

      const updateSql = `
        UPDATE bookings

        SET booking_status = ?

        WHERE id = ?
      `;


      db.query(
        updateSql,
        [
          bookingStatus,
          bookingId
        ],
        (updateError, result) => {

          if (updateError) {

            console.error(
              "ADMIN UPDATE BOOKING ERROR:",
              updateError
            );

            return res.status(500).json({

              message:
                "Unable to update booking status.",

              error:
                updateError.message

            });

          }


          if (
            result.affectedRows === 0
          ) {

            return res.status(404).json({

              message:
                "Booking was not updated."

            });

          }


          // =========================================
          // DETERMINE NOTIFICATION
          // =========================================

          let notificationTitle = "";

          let notificationMessage = "";

          let notificationType = "info";


          // =========================================
          // BOOKING CANCELLED
          // =========================================

          if (
            bookingStatus === "Cancelled"
          ) {

            notificationTitle =
              "Booking Cancelled ❌";


            notificationMessage =
              `Hello ${booking.user_name || "BusGo customer"}, your BusGo ticket ${booking.ticket_number} for ${booking.departure} to ${booking.destination} has been cancelled. Please contact BusGo support if you need further assistance.`;


            notificationType =
              "warning";

          }


          // =========================================
          // BOOKING RESTORED
          // =========================================

          if (
            bookingStatus === "Confirmed"
          ) {

            notificationTitle =
              "Booking Restored 🎫";


            notificationMessage =
              `Hello ${booking.user_name || "BusGo customer"}, your BusGo ticket ${booking.ticket_number} from ${booking.departure} to ${booking.destination} is active again. Please prepare for your travel date ${booking.travel_date}. We wish you a safe and pleasant journey!`;


            notificationType =
              "success";

          }


          // =========================================
          // CREATE NOTIFICATION
          // =========================================

          const notificationSql = `
            INSERT INTO notifications
            (
              user_id,
              title,
              message,
              type,
              is_read
            )

            VALUES (?, ?, ?, ?, 0)
          `;


          db.query(
            notificationSql,
            [
              booking.user_id,
              notificationTitle,
              notificationMessage,
              notificationType
            ],
            (notificationError) => {

              // =========================================
              // NOTIFICATION ERROR
              // =========================================

              if (notificationError) {

                console.error(
                  "BOOKING STATUS NOTIFICATION ERROR:",
                  notificationError
                );


                // ---------------------------------------
                // IMPORTANT
                // ---------------------------------------
                //
                // The booking status was already updated.
                //
                // Therefore we do NOT return an Internal
                // Server Error to the admin.
                //
                // The booking update succeeded.
                // ---------------------------------------

                return res.status(200).json({

                  message:
                    `Booking status changed to ${bookingStatus}, but the user notification could not be created.`,

                  bookingStatus,

                  notification:
                    false

                });

              }


              // =========================================
              // SUCCESS
              // =========================================

              console.log(
                "BOOKING STATUS UPDATED:",
                booking.ticket_number,
                oldStatus,
                "→",
                bookingStatus
              );


              console.log(
                "BOOKING STATUS NOTIFICATION CREATED FOR USER:",
                booking.user_id
              );


              return res.status(200).json({

                message:
                  `Booking ${bookingStatus.toLowerCase()} successfully.`,

                bookingStatus,

                notification:
                  true

              });

            }
          );

        }
      );

    }
  );

};


// =========================================
// SEND NOTIFICATION
// POST /api/admin/notifications
// =========================================

exports.sendNotification = (req, res) => {

  const {
    userId,
    title,
    message,
    type
  } = req.body;


  // =========================================
  // VALIDATION
  // =========================================

  if (!title || !title.trim()) {
    return res.status(400).json({
      message:
        "Notification title is required."
    });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({
      message:
        "Notification message is required."
    });
  }


  // =========================================
  // NOTIFICATION TYPE
  // =========================================

  const notificationType =
    type || "info";

  const allowedTypes = [
    "info",
    "success",
    "warning",
    "booking"
  ];

  if (
    !allowedTypes.includes(
      notificationType
    )
  ) {
    return res.status(400).json({
      message:
        "Invalid notification type."
    });
  }


  // =========================================
  // SEND TO ALL USERS
  // =========================================

  if (
    !userId ||
    userId === "all"
  ) {

    const sql = `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        type,
        is_read
      )

      SELECT
        id,
        ?,
        ?,
        ?,
        0

      FROM users

      WHERE role != 'admin'
    `;


    db.query(
      sql,
      [
        title.trim(),
        message.trim(),
        notificationType
      ],
      (err, result) => {

        if (err) {

          console.error(
            "SEND NOTIFICATION TO ALL ERROR:",
            err
          );

          return res.status(500).json({
            message:
              "Unable to send notification.",
            error:
              err.message
          });
        }


        console.log(
          "ADMIN NOTIFICATION SENT:",
          result.affectedRows,
          "users"
        );


        return res.status(201).json({
          message:
            "Notification sent to all users successfully.",

          recipients:
            result.affectedRows
        });

      }
    );


    return;
  }


  // =========================================
  // SEND TO ONE USER
  // =========================================

  const checkUserSql = `
    SELECT
      id
    FROM users
    WHERE id = ?
  `;


  db.query(
    checkUserSql,
    [userId],
    (userError, users) => {

      if (userError) {

        console.error(
          "CHECK NOTIFICATION USER ERROR:",
          userError
        );

        return res.status(500).json({
          message:
            "Unable to find the selected user.",

          error:
            userError.message
        });
      }


      if (
        !users ||
        users.length === 0
      ) {

        return res.status(404).json({
          message:
            "Selected user was not found."
        });
      }


      const insertSql = `
        INSERT INTO notifications
        (
          user_id,
          title,
          message,
          type,
          is_read
        )

        VALUES (?, ?, ?, ?, 0)
      `;


      db.query(
        insertSql,
        [
          userId,
          title.trim(),
          message.trim(),
          notificationType
        ],
        (insertError) => {

          if (insertError) {

            console.error(
              "SEND USER NOTIFICATION ERROR:",
              insertError
            );

            return res.status(500).json({
              message:
                "Unable to send notification.",

              error:
                insertError.message
            });
          }


          return res.status(201).json({
            message:
              "Notification sent successfully.",

            recipients: 1
          });

        }
      );

    }
  );
};

// =========================================
// GET ALL PAYMENTS
// GET /api/admin/payments
// =========================================

exports.getPayments = (req, res) => {

  const sql = `
    SELECT
      payments.*,

      users.name AS user_name,
      users.email AS user_email,
      users.phone AS user_phone,

      bookings.ticket_number,

      routes.departure,
      routes.destination

    FROM payments

    LEFT JOIN users
      ON payments.user_id = users.id

    LEFT JOIN bookings
      ON payments.booking_id = bookings.id

    LEFT JOIN routes
      ON bookings.route_id = routes.id

    ORDER BY payments.payment_date DESC
  `;


  db.query(
    sql,
    (err, results) => {

      if (err) {

        console.error(
          "ADMIN PAYMENTS DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to load payment transactions.",

          error:
            err.message

        });

      }


      res.json({

        payments:
          results || []

      });

    }
  );

};


// =========================================
// ACCEPT PAYMENT REVERSAL
// PATCH /api/admin/payments/:paymentId/accept-reversal
// =========================================

exports.acceptPaymentReversal = (req, res) => {

  const {
    paymentId
  } = req.params;


  const adminId =
    req.user?.id || null;


  const sql = `
    UPDATE payments

    SET
      status = 'Reversed',

      reversed_at = NOW(),

      reversal_processed_by = ?,

      updated_at = NOW()

    WHERE id = ?

    AND status = 'Requested Reversal'
  `;


  db.query(
    sql,
    [
      adminId,
      paymentId
    ],
    (err, result) => {

      if (err) {

        console.error(
          "ACCEPT PAYMENT REVERSAL ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to accept the reversal request.",

          error:
            err.message

        });

      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          message:
            "Reversal request was not found or has already been processed."

        });

      }


      res.json({

        message:
          "Payment reversal accepted successfully."

      });

    }
  );

};


// =========================================
// DENY PAYMENT REVERSAL
// PATCH /api/admin/payments/:paymentId/deny-reversal
// =========================================

exports.denyPaymentReversal = (req, res) => {

  const {
    paymentId
  } = req.params;


  const sql = `
    UPDATE payments

    SET
      status = 'Successful',

      reversal_requested_at = NULL,

      updated_at = NOW()

    WHERE id = ?

    AND status = 'Requested Reversal'
  `;


  db.query(
    sql,
    [paymentId],
    (err, result) => {

      if (err) {

        console.error(
          "DENY PAYMENT REVERSAL ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to deny the reversal request.",

          error:
            err.message

        });

      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          message:
            "Reversal request was not found or has already been processed."

        });

      }


      res.json({

        message:
          "Payment reversal request denied."

      });

    }
  );

};