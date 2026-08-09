const db = require("../config/database");


// =========================================
// CREATE NOTIFICATION
// POST /api/notifications
// =========================================

exports.createNotification = (req, res) => {

  console.log("=========================================");
  console.log("CREATE NOTIFICATION");
  console.log("REQ.USER:", req.user);
  console.log("=========================================");


  // =========================================
  // CHECK AUTHENTICATED USER
  // =========================================

  if (!req.user || !req.user.id) {

    console.error(
      "NOTIFICATION ERROR: req.user.id is missing"
    );

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });

  }


  const userId = req.user.id;


  // =========================================
  // GET NOTIFICATION DATA
  // =========================================

  const {
    title,
    message,
    type
  } = req.body;


  // =========================================
  // VALIDATE NOTIFICATION
  // =========================================

  if (!title || !message) {

    return res.status(400).json({
      message:
        "Notification title and message are required."
    });

  }


  // =========================================
  // DATABASE QUERY
  // =========================================

  const sql = `
    INSERT INTO notifications
    (
      user_id,
      title,
      message,
      type,
      is_read
    )
    VALUES (?, ?, ?, ?, ?)
  `;


  db.query(
    sql,
    [
      userId,
      title,
      message,
      type || "general",
      0
    ],
    (err, result) => {

      if (err) {

        console.error(
          "========================================="
        );

        console.error(
          "CREATE NOTIFICATION DATABASE ERROR:"
        );

        console.error(err);

        console.error(
          "========================================="
        );

        return res.status(500).json({
          message:
            "Unable to create notification.",
          error:
            err.message
        });

      }


      console.log(
        "Notification created successfully."
      );

      console.log(
        "Notification ID:",
        result.insertId
      );


      return res.status(201).json({

        message:
          "Notification created successfully.",

        notificationId:
          result.insertId

      });

    }
  );

};


// =========================================
// GET USER NOTIFICATIONS
// GET /api/notifications
// =========================================

exports.getUserNotifications = (req, res) => {

  console.log("=========================================");
  console.log("GET USER NOTIFICATIONS");
  console.log("REQ.USER:", req.user);
  console.log("=========================================");


  // =========================================
  // CHECK AUTHENTICATED USER
  // =========================================

  if (!req.user || !req.user.id) {

    console.error(
      "NOTIFICATION ERROR: req.user.id is missing"
    );

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });

  }


  const userId = req.user.id;


  // =========================================
  // DATABASE QUERY
  // =========================================

  const sql = `
    SELECT
      id,
      title,
      message,
      type,
      is_read,
      created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;


  console.log(
    "Loading notifications for user:",
    userId
  );


  db.query(
    sql,
    [userId],
    (err, results) => {

      if (err) {

        console.error(
          "========================================="
        );

        console.error(
          "GET NOTIFICATIONS DATABASE ERROR:"
        );

        console.error(err);

        console.error(
          "========================================="
        );

        return res.status(500).json({
          message:
            "Unable to load notifications.",
          error:
            err.message
        });

      }


      console.log(
        "Notifications found:",
        results.length
      );


      return res.status(200).json({

        notifications:
          results

      });

    }
  );

};


// =========================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================

exports.markAsRead = (req, res) => {

  if (!req.user || !req.user.id) {

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });

  }


  const userId = req.user.id;

  const {
    notificationId
  } = req.params;


  const sql = `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
      AND user_id = ?
  `;


  db.query(
    sql,
    [
      notificationId,
      userId
    ],
    (err, result) => {

      if (err) {

        console.error(
          "MARK NOTIFICATION READ ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to update notification.",
          error:
            err.message
        });

      }


      if (result.affectedRows === 0) {

        return res.status(404).json({
          message:
            "Notification not found."
        });

      }


      return res.status(200).json({

        message:
          "Notification marked as read."

      });

    }
  );

};


// =========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// =========================================

exports.markAllAsRead = (req, res) => {

  if (!req.user || !req.user.id) {

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });

  }


  const userId = req.user.id;


  const sql = `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
  `;


  db.query(
    sql,
    [userId],
    (err, result) => {

      if (err) {

        console.error(
          "MARK ALL NOTIFICATIONS READ ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to update notifications.",
          error:
            err.message
        });

      }


      return res.status(200).json({

        message:
          "All notifications marked as read.",

        updated:
          result.affectedRows

      });

    }
  );

};