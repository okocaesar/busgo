const db = require("../config/database");
const { webPush } = require("../config/webPush");

// =========================================
// GET SOCKET.IO INSTANCE
// =========================================

const getIO = (req) => {
  return req.app.get("io");
};

// =========================================
// GET CURRENT USER ID
// =========================================

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?.userId ||
    req.user?.user_id ||
    null
  );
};

// =========================================
// SEND WEB PUSH NOTIFICATION
// =========================================
//
// Sends a notification to every browser/device
// subscribed to this user.
//
// =========================================

const sendWebPushNotification = (
  userId,
  notification
) => {
  return new Promise((resolve) => {
    // =======================================
    // GET USER PUSH SUBSCRIPTIONS
    // =======================================

    const sql = `
      SELECT
        id,
        endpoint,
        p256dh,
        auth
      FROM push_subscriptions
      WHERE user_id = ?
    `;

    db.query(
      sql,
      [userId],
      async (err, subscriptions) => {
        if (err) {
          console.error(
            "GET PUSH SUBSCRIPTIONS ERROR:",
            err
          );

          return resolve();
        }

        // =====================================
        // NO SUBSCRIPTIONS
        // =====================================

        if (
          !subscriptions ||
          subscriptions.length === 0
        ) {
          console.log(
            "NO WEB PUSH SUBSCRIPTIONS FOR USER:",
            userId
          );

          return resolve();
        }

        console.log(
          "WEB PUSH SUBSCRIPTIONS FOUND:",
          subscriptions.length
        );

        // =====================================
        // PUSH PAYLOAD
        // =====================================

        const payload = JSON.stringify({
          title: notification.title,

          body: notification.message,

          type: notification.type,

          notificationId: notification.id,

          userId: notification.user_id,

          createdAt: notification.created_at
        });

        // =====================================
        // SEND TO ALL USER DEVICES
        // =====================================

        const pushResults =
          await Promise.allSettled(
            subscriptions.map(
              async (subscription) => {
                const pushSubscription = {
                  endpoint:
                    subscription.endpoint,

                  keys: {
                    p256dh:
                      subscription.p256dh,

                    auth:
                      subscription.auth
                  }
                };

                try {
                  await webPush.sendNotification(
                    pushSubscription,
                    payload
                  );

                  console.log(
                    "WEB PUSH SENT SUCCESSFULLY"
                  );

                  console.log(
                    "User ID:",
                    userId
                  );

                  console.log(
                    "Subscription ID:",
                    subscription.id
                  );

                  return {
                    success: true,
                    subscriptionId:
                      subscription.id
                  };
                } catch (pushError) {
                  console.error(
                    "WEB PUSH SEND ERROR:",
                    pushError.statusCode ||
                      pushError.message
                  );

                  // =================================
                  // EXPIRED / INVALID SUBSCRIPTION
                  // =================================
                  //
                  // 404 and 410 generally mean the
                  // browser subscription is no longer
                  // usable.
                  //
                  // Remove it from the database.
                  // =================================

                  if (
                    pushError.statusCode === 404 ||
                    pushError.statusCode === 410
                  ) {
                    const deleteSql = `
                      DELETE FROM push_subscriptions
                      WHERE id = ?
                    `;

                    db.query(
                      deleteSql,
                      [subscription.id],
                      (deleteError) => {
                        if (deleteError) {
                          console.error(
                            "DELETE EXPIRED PUSH SUBSCRIPTION ERROR:",
                            deleteError
                          );
                        } else {
                          console.log(
                            "EXPIRED PUSH SUBSCRIPTION REMOVED:",
                            subscription.id
                          );
                        }
                      }
                    );
                  }

                  return {
                    success: false,
                    subscriptionId:
                      subscription.id
                  };
                }
              }
            )
          );

        const successful =
          pushResults.filter(
            (result) =>
              result.status === "fulfilled" &&
              result.value?.success === true
          ).length;

        const failed =
          pushResults.length - successful;

        console.log(
          "========================================="
        );

        console.log(
          "WEB PUSH COMPLETE"
        );

        console.log(
          "User ID:",
          userId
        );

        console.log(
          "Successful:",
          successful
        );

        console.log(
          "Failed:",
          failed
        );

        console.log(
          "========================================="
        );

        return resolve({
          successful,
          failed
        });
      }
    );
  });
};

// =========================================
// SAVE PUSH SUBSCRIPTION
// POST /api/notifications/subscribe
// =========================================

exports.savePushSubscription = (
  req,
  res
) => {
  console.log(
    "========================================="
  );

  console.log(
    "SAVE PUSH SUBSCRIPTION"
  );

  console.log(
    "REQ.USER:",
    req.user
  );

  console.log(
    "========================================="
  );

  // =======================================
  // GET USER
  // =======================================

  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message:
        "User authentication information is missing."
    });
  }

  // =======================================
  // GET SUBSCRIPTION
  // =======================================

  const subscription =
    req.body?.subscription ||
    req.body;

  const endpoint =
    subscription?.endpoint;

  const p256dh =
    subscription?.keys?.p256dh;

  const auth =
    subscription?.keys?.auth;

  // =======================================
  // VALIDATE
  // =======================================

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {
    console.error(
      "INVALID PUSH SUBSCRIPTION"
    );

    return res.status(400).json({
      success: false,
      message:
        "A valid push subscription is required."
    });
  }

  // =======================================
  // CHECK WHETHER ENDPOINT EXISTS
  // =======================================

  const checkSql = `
    SELECT
      id,
      user_id
    FROM push_subscriptions
    WHERE endpoint = ?
    LIMIT 1
  `;

  db.query(
    checkSql,
    [endpoint],
    (checkError, existingRows) => {
      if (checkError) {
        console.error(
          "CHECK PUSH SUBSCRIPTION ERROR:",
          checkError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to check push subscription."
        });
      }

      // =====================================
      // EXISTING SUBSCRIPTION
      // =====================================

      if (
        existingRows &&
        existingRows.length > 0
      ) {
        const existing =
          existingRows[0];

        const updateSql = `
          UPDATE push_subscriptions
          SET
            user_id = ?,
            p256dh = ?,
            auth = ?
          WHERE endpoint = ?
        `;

        db.query(
          updateSql,
          [
            userId,
            p256dh,
            auth,
            endpoint
          ],
          (updateError) => {
            if (updateError) {
              console.error(
                "UPDATE PUSH SUBSCRIPTION ERROR:",
                updateError
              );

              return res.status(500).json({
                success: false,
                message:
                  "Unable to update push subscription."
              });
            }

            console.log(
              "PUSH SUBSCRIPTION UPDATED"
            );

            console.log(
              "Subscription ID:",
              existing.id
            );

            console.log(
              "User ID:",
              userId
            );

            return res.status(200).json({
              success: true,
              message:
                "Push subscription updated successfully.",
              subscriptionId:
                existing.id
            });
          }
        );

        return;
      }

      // =====================================
      // NEW SUBSCRIPTION
      // =====================================

      const insertSql = `
        INSERT INTO push_subscriptions
        (
          user_id,
          endpoint,
          p256dh,
          auth
        )
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          userId,
          endpoint,
          p256dh,
          auth
        ],
        (insertError, result) => {
          if (insertError) {
            console.error(
              "INSERT PUSH SUBSCRIPTION ERROR:",
              insertError
            );

            return res.status(500).json({
              success: false,
              message:
                "Unable to save push subscription.",
              error:
                insertError.message
            });
          }

          console.log(
            "========================================="
          );

          console.log(
            "PUSH SUBSCRIPTION SAVED"
          );

          console.log(
            "Subscription ID:",
            result.insertId
          );

          console.log(
            "User ID:",
            userId
          );

          console.log(
            "========================================="
          );

          return res.status(201).json({
            success: true,
            message:
              "Push subscription saved successfully.",
            subscriptionId:
              result.insertId
          });
        }
      );
    }
  );
};

// =========================================
// REMOVE PUSH SUBSCRIPTION
// DELETE /api/notifications/subscribe
// =========================================

exports.removePushSubscription = (
  req,
  res
) => {
  console.log(
    "REMOVE PUSH SUBSCRIPTION"
  );

  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message:
        "User authentication information is missing."
    });
  }

  const endpoint =
    req.body?.endpoint;

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message:
        "Push subscription endpoint is required."
    });
  }

  const sql = `
    DELETE FROM push_subscriptions
    WHERE endpoint = ?
      AND user_id = ?
  `;

  db.query(
    sql,
    [
      endpoint,
      userId
    ],
    (err, result) => {
      if (err) {
        console.error(
          "REMOVE PUSH SUBSCRIPTION ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to remove push subscription."
        });
      }

      console.log(
        "PUSH SUBSCRIPTION REMOVED:",
        result.affectedRows
      );

      return res.status(200).json({
        success: true,
        message:
          "Push subscription removed successfully.",
        removed:
          result.affectedRows
      });
    }
  );
};

// =========================================
// CREATE NOTIFICATION
// POST /api/notifications
// =========================================

exports.createNotification = (
  req,
  res
) => {
  console.log(
    "========================================="
  );

  console.log(
    "CREATE NOTIFICATION"
  );

  console.log(
    "REQ.USER:",
    req.user
  );

  console.log(
    "========================================="
  );

  const userId = getUserId(req);

  if (!userId) {
    console.error(
      "NOTIFICATION ERROR: req.user.id is missing"
    );

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });
  }

  const {
    title,
    message,
    type
  } = req.body;

  // =======================================
  // VALIDATE
  // =======================================

  if (
    !title ||
    !String(title).trim() ||
    !message ||
    !String(message).trim()
  ) {
    return res.status(400).json({
      message:
        "Notification title and message are required."
    });
  }

  const cleanTitle =
    String(title).trim();

  const cleanMessage =
    String(message).trim();

  const cleanType =
    type
      ? String(type).trim()
      : "general";

  // =======================================
  // INSERT NOTIFICATION
  // =======================================

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
      cleanTitle,
      cleanMessage,
      cleanType,
      0
    ],
    async (err, result) => {
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

      // =====================================
      // NOTIFICATION OBJECT
      // =====================================

      const notification = {
        id:
          result.insertId,

        user_id:
          userId,

        title:
          cleanTitle,

        message:
          cleanMessage,

        type:
          cleanType,

        is_read:
          0,

        created_at:
          new Date().toISOString()
      };

      console.log(
        "========================================="
      );

      console.log(
        "NOTIFICATION CREATED"
      );

      console.log(
        "Notification ID:",
        result.insertId
      );

      console.log(
        "User ID:",
        userId
      );

      console.log(
        "Title:",
        cleanTitle
      );

      console.log(
        "========================================="
      );

      // =====================================
      // SOCKET.IO
      // =====================================

      try {
        const io =
          getIO(req);

        if (io) {
          const room =
            `user_${userId}`;

          io.to(room).emit(
            "notification:new",
            notification
          );

          console.log(
            "REAL-TIME NOTIFICATION SENT"
          );

          console.log(
            "Room:",
            room
          );
        } else {
          console.warn(
            "Socket.IO instance not available."
          );
        }
      } catch (socketError) {
        console.error(
          "NOTIFICATION SOCKET ERROR:",
          socketError
        );

        // Socket.IO failure must not
        // break notification creation.
      }

      // =====================================
      // WEB PUSH
      // =====================================

      try {
        await sendWebPushNotification(
          userId,
          notification
        );
      } catch (pushError) {
        console.error(
          "WEB PUSH NOTIFICATION ERROR:",
          pushError
        );

        // Web Push failure must not
        // break notification creation.
      }

      // =====================================
      // RESPONSE
      // =====================================

      return res.status(201).json({
        success: true,

        message:
          "Notification created successfully.",

        notificationId:
          result.insertId,

        notification
      });
    }
  );
};

// =========================================
// GET USER NOTIFICATIONS
// GET /api/notifications
// =========================================

exports.getUserNotifications = (
  req,
  res
) => {
  console.log(
    "========================================="
  );

  console.log(
    "GET USER NOTIFICATIONS"
  );

  console.log(
    "REQ.USER:",
    req.user
  );

  console.log(
    "========================================="
  );

  const userId =
    getUserId(req);

  if (!userId) {
    console.error(
      "NOTIFICATION ERROR: req.user.id is missing"
    );

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });
  }

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
          results || []
      });
    }
  );
};

// =========================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================

exports.markAsRead = (
  req,
  res
) => {
  const userId =
    getUserId(req);

  if (!userId) {
    return res.status(401).json({
      message:
        "User authentication information is missing."
    });
  }

  const {
    notificationId
  } = req.params;

  if (!notificationId) {
    return res.status(400).json({
      message:
        "Notification ID is required."
    });
  }

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

      if (
        result.affectedRows === 0
      ) {
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

exports.markAllAsRead = (
  req,
  res
) => {
  const userId =
    getUserId(req);

  if (!userId) {
    return res.status(401).json({
      message:
        "User authentication information is missing."
    });
  }

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