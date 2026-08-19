const db = require("../config/database");

const {
  sendBookingTicketEmail
} = require("../services/emailService");


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
          message:
            "Unable to load admin statistics.",
          error:
            err.message
        });

      }

      res.json({

        totalUsers:
          Number(results[0].totalUsers || 0),

        totalBookings:
          Number(results[0].totalBookings || 0),

        confirmedBookings:
          Number(results[0].confirmedBookings || 0),

        cancelledBookings:
          Number(results[0].cancelledBookings || 0),

        totalRevenue:
          Number(results[0].totalRevenue || 0)

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

  db.query(
    sql,
    (err, results) => {

      if (err) {

        console.error(
          "ADMIN USERS DATABASE ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to load users.",
          error:
            err.message
        });

      }

      res.json({
        users: results
      });

    }
  );

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

  db.query(
    sql,
    (err, results) => {

      if (err) {

        console.error(
          "ADMIN BOOKINGS DATABASE ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to load bookings.",
          error:
            err.message
        });

      }

      res.json({
        bookings: results
      });

    }
  );

};


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

      if (
        oldStatus === bookingStatus
      ) {

        return res.status(200).json({
          message:
            `Booking is already ${bookingStatus}.`
        });

      }

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

          let notificationTitle = "";
          let notificationMessage = "";
          let notificationType = "info";

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

              if (notificationError) {

                console.error(
                  "BOOKING STATUS NOTIFICATION ERROR:",
                  notificationError
                );

                return res.status(200).json({
                  message:
                    `Booking status changed to ${bookingStatus}, but the user notification could not be created.`,
                  bookingStatus,
                  notification: false
                });

              }

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
// GET ALL REPORTS
// GET /api/admin/reports
// =========================================

exports.getReports = (req, res) => {

  const sql = `
    SELECT
      reports.*,

      users.name AS user_name,
      users.email AS user_email,
      users.phone AS user_phone

    FROM reports

    LEFT JOIN users
      ON reports.user_id = users.id

    ORDER BY reports.created_at DESC
  `;

  db.query(
    sql,
    (err, results) => {

      if (err) {

        console.error(
          "ADMIN REPORTS DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to load reports.",

          error:
            err.message

        });

      }

      return res.status(200).json({

        reports:
          results || []

      });

    }
  );

};


// =========================================
// UPDATE REPORT STATUS
// PATCH /api/admin/reports/:reportId/status
// =========================================

exports.updateReportStatus = (req, res) => {

  const {
    reportId
  } = req.params;

  const {
    status
  } = req.body;

  const allowedStatuses = [
    "Pending",
    "Reviewed",
    "Resolved",
    "Rejected"
  ];

  if (
    !allowedStatuses.includes(status)
  ) {

    return res.status(400).json({

      message:
        "Invalid report status."

    });

  }

  const sql = `
    UPDATE reports

    SET status = ?

    WHERE id = ?
  `;

  db.query(
    sql,
    [
      status,
      reportId
    ],
    (err, result) => {

      if (err) {

        console.error(
          "ADMIN UPDATE REPORT STATUS ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to update report status.",

          error:
            err.message

        });

      }

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          message:
            "Report not found."

        });

      }

      return res.status(200).json({

        message:
          "Report status updated successfully.",

        status

      });

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


// =========================================
// CREATE BOOKING FOR REGISTERED USER
// POST /api/admin/bookings/create
// =========================================

exports.createBooking = (req, res) => {

  const {
    email,
    from,
    to,
    date,
    name,
    phone,
    busType,
    seats,
    totalPrice,
    discount
  } = req.body;

  if (
    !email ||
    !email.trim()
  ) {

    return res.status(400).json({

      message:
        "Registered user email is required."

    });

  }

  if (!from || !to) {

    return res.status(400).json({

      message:
        "Departure and destination are required."

    });

  }

  if (!date) {

    return res.status(400).json({

      message:
        "Travel date is required."

    });

  }

  if (
    !name ||
    !name.trim()
  ) {

    return res.status(400).json({

      message:
        "Passenger name is required."

    });

  }

  if (
    !busType ||
    !busType.trim()
  ) {

    return res.status(400).json({

      message:
        "Bus type is required."

    });

  }

  if (
    !Array.isArray(seats) ||
    seats.length === 0
  ) {

    return res.status(400).json({

      message:
        "At least one seat must be selected."

    });

  }

  const userSql = `
    SELECT
      id,
      name,
      email,
      phone
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  db.query(
    userSql,
    [email.trim()],
    (userError, users) => {

      if (userError) {

        console.error(
          "ADMIN CREATE BOOKING USER SEARCH ERROR:",
          userError
        );

        return res.status(500).json({

          message:
            "Unable to verify the registered user.",

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
            "No registered user was found with this email address."

        });

      }

      const user =
        users[0];

      const routeSql = `
        SELECT
          id,
          departure,
          destination
        FROM routes
        WHERE departure = ?
          AND destination = ?
        LIMIT 1
      `;

      db.query(
        routeSql,
        [
          from,
          to
        ],
        (routeError, routes) => {

          if (routeError) {

            console.error(
              "ADMIN CREATE BOOKING ROUTE ERROR:",
              routeError
            );

            return res.status(500).json({

              message:
                "Unable to find the selected route.",

              error:
                routeError.message

            });

          }

          if (
            !routes ||
            routes.length === 0
          ) {

            return res.status(404).json({

              message:
                "The selected route does not exist."

            });

          }

          const route =
            routes[0];

          const busSql = `
            SELECT
              id,
              name
            FROM buses
            WHERE name = ?
            LIMIT 1
          `;

          db.query(
            busSql,
            [busType],
            (busError, buses) => {

              if (busError) {

                console.error(
                  "ADMIN CREATE BOOKING BUS ERROR:",
                  busError
                );

                return res.status(500).json({

                  message:
                    "Unable to find the selected bus.",

                  error:
                    busError.message

                });

              }

              if (
                !buses ||
                buses.length === 0
              ) {

                return res.status(404).json({

                  message:
                    "The selected bus type does not exist."

                });

              }

              const bus =
                buses[0];

              const ticketNumber =
                "BG-" +
                Date.now() +
                "-" +
                Math.floor(
                  1000 +
                  Math.random() * 9000
                );

              const booking = {

                ticketNumber,

                userId:
                  user.id,

                routeId:
                  route.id,

                busId:
                  bus.id,

                passengerName:
                  name.trim(),

                passengerPhone:
                  phone ||
                  user.phone ||
                  "",

                travelDate:
                  date,

                seats,

                offerId:
                  null,

                totalPrice:
                  Number(totalPrice || 0),

                discount:
                  Number(discount || 0),

                totalPayment:
                  0,

                paymentMethod:
                  "Cash",

                paymentStatus:
                  "Successful",

                bookingStatus:
                  "Confirmed",

                paymentDate:
                  new Date()

              };

              const Booking =
                require("../models/Booking");

              Booking.createBookingSafely(
                booking,
                (bookingError, result) => {

                  if (bookingError) {

                    console.error(
                      "ADMIN CREATE BOOKING ERROR:",
                      bookingError
                    );

                    if (
                      bookingError.code ===
                      "SEATS_ALREADY_BOOKED"
                    ) {

                      return res.status(409).json({

                        message:
                          bookingError.message,

                        bookedSeats:
                          bookingError.bookedSeats ||
                          []

                      });

                    }

                    if (
                      bookingError.code ===
                      "BUS_NOT_FOUND"
                    ) {

                      return res.status(404).json({

                        message:
                          "Selected bus does not exist."

                      });

                    }

                    if (
                      bookingError.code ===
                      "NO_VALID_SEATS"
                    ) {

                      return res.status(400).json({

                        message:
                          bookingError.message

                      });

                    }

                    return res.status(500).json({

                      message:
                        "Unable to create the booking.",

                      error:
                        bookingError.message

                    });

                  }

                  const bookingId =
                    result.insertId;

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

                  const notificationTitle =
                    "BusGo Ticket Created Successfully 🎫";

                  const notificationMessage =
                    `Hello ${user.name || name}, your BusGo ticket ${ticketNumber} has been created successfully. ` +
                    `Your trip is from ${from} to ${to} on ${date}. ` +
                    `Passenger: ${booking.passengerName}. ` +
                    `Seat(s): ${result.bookedSeats.join(", ")}. ` +
                    `Bus: ${bus.name}. ` +
                    `Payment method: Cash. ` +
                    `Your ticket is confirmed. Please keep this ticket information safe for your journey.`;

                  db.query(
                    notificationSql,
                    [
                      user.id,
                      notificationTitle,
                      notificationMessage,
                      "booking"
                    ],
                    async (notificationError) => {

                      if (notificationError) {

                        console.error(
                          "ADMIN CREATE BOOKING NOTIFICATION ERROR:",
                          notificationError
                        );

                      }

                      let emailSent =
                        false;

                      try {

                        await sendBookingTicketEmail({

                          userName:
                            user.name ||
                            name,

                          userEmail:
                            user.email,

                          ticketNumber,

                          from:
                            route.departure,

                          to:
                            route.destination,

                          travelDate:
                            date,

                          passengerName:
                            booking.passengerName,

                          passengerPhone:
                            booking.passengerPhone,

                          busName:
                            bus.name,

                          seats:
                            result.bookedSeats,

                          totalPrice:
                            booking.totalPrice,

                          discount:
                            booking.discount,

                          paymentMethod:
                            booking.paymentMethod,

                          paymentStatus:
                            booking.paymentStatus

                        });

                        emailSent =
                          true;

                        console.log(
                          "ADMIN BOOKING TICKET EMAIL SENT:",
                          {
                            ticketNumber,
                            email:
                              user.email
                          }
                        );

                      } catch (emailError) {

                        console.error(
                          "ADMIN CREATE BOOKING EMAIL ERROR:",
                          emailError
                        );

                      }

                      return res.status(201).json({

                        message:
                          "Booking registered successfully.",

                        booking: {

                          id:
                            bookingId,

                          ticketNumber,

                          userId:
                            user.id,

                          userName:
                            user.name,

                          userEmail:
                            user.email,

                          from:
                            route.departure,

                          to:
                            route.destination,

                          date,

                          passengerName:
                            booking.passengerName,

                          passengerPhone:
                            booking.passengerPhone,

                          busType:
                            bus.name,

                          seats:
                            result.bookedSeats,

                          totalPrice:
                            booking.totalPrice,

                          discount:
                            booking.discount,

                          totalPayment:
                            0,

                          paymentMethod:
                            "Cash",

                          paymentStatus:
                            "Successful",

                          bookingStatus:
                            "Confirmed"

                        },

                        notification:
                          !notificationError,

                        email:
                          emailSent

                      });

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

};


// =========================================
// GET ALL ROUTES FOR ADMIN
// GET /api/admin/routes
// =========================================

exports.getRoutes = (req, res) => {

  const sql = `
    SELECT
      *
    FROM routes
    ORDER BY id DESC
  `;

  db.query(
    sql,
    (err, results) => {

      if (err) {

        console.error(
          "ADMIN ROUTES DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to load routes.",

          error:
            err.message

        });

      }

      return res.status(200).json({

        routes:
          results || []

      });

    }
  );

};