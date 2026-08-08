const db = require("../config/database");

const Notification = {

  // =========================================
  // CREATE NOTIFICATION
  // =========================================

  create: (notification, callback) => {

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
        notification.userId,
        notification.title,
        notification.message,
        notification.type || "general",
        notification.isRead || 0
      ],
      callback
    );
  },


  // =========================================
  // GET USER NOTIFICATIONS
  // =========================================

  findByUserId: (userId, callback) => {

    const sql = `
      SELECT
        id,
        user_id,
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
      callback
    );
  },


  // =========================================
  // GET UNREAD COUNT
  // =========================================

  getUnreadCount: (userId, callback) => {

    const sql = `
      SELECT COUNT(*) AS unreadCount
      FROM notifications
      WHERE user_id = ?
        AND is_read = 0
    `;

    db.query(
      sql,
      [userId],
      callback
    );
  },


  // =========================================
  // MARK ONE AS READ
  // =========================================

  markAsRead: (notificationId, userId, callback) => {

    const sql = `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
        AND user_id = ?
    `;

    db.query(
      sql,
      [notificationId, userId],
      callback
    );
  },


  // =========================================
  // MARK ALL AS READ
  // =========================================

  markAllAsRead: (userId, callback) => {

    const sql = `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
        AND is_read = 0
    `;

    db.query(
      sql,
      [userId],
      callback
    );
  },


  // =========================================
  // SEND NOTIFICATION TO ALL USERS
  // =========================================

  createForAllUsers: (
    title,
    message,
    type,
    callback
  ) => {

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
    `;

    db.query(
      sql,
      [
        title,
        message,
        type || "admin"
      ],
      callback
    );
  }

};

module.exports = Notification;