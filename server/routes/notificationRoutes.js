const express = require("express");

const router = express.Router();

const notificationController = require(
  "../controllers/notificationController"
);

// =========================================
// TEST
// GET /api/notifications/test
// =========================================

router.get("/test", (req, res) => {
  res.json({
    message: "Notification routes are working"
  });
});

// =========================================
// GET USER NOTIFICATIONS
// GET /api/notifications/:userId
// =========================================

router.get(
  "/:userId",
  notificationController.getUserNotifications
);

// =========================================
// MARK NOTIFICATION AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================

router.patch(
  "/:notificationId/read",
  notificationController.markAsRead
);

// =========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/user/:userId/read-all
// =========================================

router.patch(
  "/user/:userId/read-all",
  notificationController.markAllAsRead
);

module.exports = router;