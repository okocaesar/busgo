const db = require("../config/database");

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
// SAVE PUSH SUBSCRIPTION
// POST /api/push/subscribe
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
  // AUTHENTICATION
  // =======================================

  const userId =
    getUserId(req);

  if (!userId) {

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });
  }

  // =======================================
  // GET SUBSCRIPTION
  // =======================================

  const subscription =
    req.body?.subscription;

  if (
    !subscription ||
    !subscription.endpoint ||
    !subscription.keys
  ) {

    return res.status(400).json({
      message:
        "Valid push subscription is required."
    });
  }

  const endpoint =
    String(
      subscription.endpoint
    ).trim();

  const p256dh =
    String(
      subscription.keys.p256dh || ""
    ).trim();

  const auth =
    String(
      subscription.keys.auth || ""
    ).trim();

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {

    return res.status(400).json({
      message:
        "Push subscription keys are incomplete."
    });
  }

  // =======================================
  // CHECK EXISTING SUBSCRIPTION
  // =======================================

  const findSql = `
    SELECT
      id
    FROM push_subscriptions
    WHERE endpoint = ?
    LIMIT 1
  `;

  db.query(
    findSql,
    [endpoint],
    (findError, existing) => {

      if (findError) {

        console.error(
          "FIND PUSH SUBSCRIPTION ERROR:",
          findError
        );

        return res.status(500).json({
          message:
            "Unable to save push subscription.",
          error:
            findError.message
        });
      }

      // ===================================
      // UPDATE EXISTING
      // ===================================

      if (
        existing &&
        existing.length > 0
      ) {

        const updateSql = `
          UPDATE push_subscriptions
          SET
            user_id = ?,
            p256dh = ?,
            auth = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE endpoint = ?
        `;

        return db.query(
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
                message:
                  "Unable to update push subscription.",
                error:
                  updateError.message
              });
            }

            console.log(
              "Push subscription updated."
            );

            return res.status(200).json({
              message:
                "Push subscription updated successfully."
            });
          }
        );
      }

      // ===================================
      // INSERT NEW
      // ===================================

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
              message:
                "Unable to save push subscription.",
              error:
                insertError.message
            });
          }

          console.log(
            "Push subscription saved."
          );

          console.log(
            "Subscription ID:",
            result.insertId
          );

          console.log(
            "User ID:",
            userId
          );

          return res.status(201).json({
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
// DELETE /api/push/unsubscribe
// =========================================

exports.removePushSubscription = (
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

  const endpoint =
    String(
      req.body?.endpoint || ""
    ).trim();

  if (!endpoint) {

    return res.status(400).json({
      message:
        "Push subscription endpoint is required."
    });
  }

  const sql = `
    DELETE FROM push_subscriptions
    WHERE user_id = ?
      AND endpoint = ?
  `;

  db.query(
    sql,
    [
      userId,
      endpoint
    ],
    (err, result) => {

      if (err) {

        console.error(
          "REMOVE PUSH SUBSCRIPTION ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to remove push subscription.",
          error:
            err.message
        });
      }

      return res.status(200).json({
        message:
          "Push subscription removed successfully.",

        removed:
          result.affectedRows
      });
    }
  );
};