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

exports.updateBookingStatus = (req, res) => {
  const { bookingId } = req.params;
  const { bookingStatus } = req.body;

  const allowedStatuses = [
    "Confirmed",
    "Cancelled"
  ];

  if (!allowedStatuses.includes(bookingStatus)) {
    return res.status(400).json({
      message: "Invalid booking status."
    });
  }

  const sql = `
    UPDATE bookings
    SET booking_status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [bookingStatus, bookingId],
    (err, result) => {
      if (err) {
        console.error(
          "ADMIN UPDATE BOOKING ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to update booking status.",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Booking not found."
        });
      }

      res.json({
        message:
          "Booking status updated successfully."
      });
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