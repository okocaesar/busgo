const db = require("../config/database");

// =========================================
// GET USER NOTIFICATIONS
// GET /api/notifications
// =========================================

exports.getUserNotifications = (req, res) => {

  const userId = req.user.id;

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

  db.query(
    sql,
    [userId],
    (err, results) => {

      if (err) {

        console.error(
          "GET NOTIFICATIONS ERROR:",
          err
        );

        return res.status(500).json({
          message: "Unable to load notifications."
        });
      }

      res.json({
        notifications: results
      });

    }
  );
};


// =========================================
// MARK ONE AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================

exports.markAsRead = (req, res) => {

  const userId = req.user.id;
  const { notificationId } = req.params;

  const sql = `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
      AND user_id = ?
  `;

  db.query(
    sql,
    [notificationId, userId],
    (err, result) => {

      if (err) {

        console.error(
          "MARK NOTIFICATION READ ERROR:",
          err
        );

        return res.status(500).json({
          message: "Unable to update notification."
        });
      }

      if (result.affectedRows === 0) {

        return res.status(404).json({
          message: "Notification not found."
        });
      }

      res.json({
        message: "Notification marked as read."
      });

    }
  );
};


// =========================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// =========================================

exports.markAllAsRead = (req, res) => {

  const userId = req.user.id;

  const sql = `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
  `;

  db.query(
    sql,
    [userId],
    (err) => {

      if (err) {

        console.error(
          "MARK ALL NOTIFICATIONS READ ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to update notifications."
        });
      }

      res.json({
        message:
          "All notifications marked as read."
      });

    }
  );
};