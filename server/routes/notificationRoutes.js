const express = require("express");

const router = express.Router();

const notificationController = require(
  "../controllers/notificationController"
);

const {
  requireAuth
} = require("../middleware/authMiddleware");

// =========================================
// ALL NOTIFICATION ROUTES REQUIRE LOGIN
// =========================================

router.use(requireAuth);

// =========================================
// TEST
// GET /api/notifications/test
// =========================================

router.get(
  "/test",
  (req, res) => {
    res.json({
      success: true,
      message: "Notification routes are working",
      userId: req.user?.id
    });
  }
);

// =========================================
// GET USER NOTIFICATIONS
// GET /api/notifications
// =========================================

router.get(
  "/",
  notificationController.getUserNotifications
);

// =========================================
// CREATE NOTIFICATION
// POST /api/notifications
// =========================================

router.post(
  "/",
  notificationController.createNotification
);

// =========================================
// SAVE PUSH SUBSCRIPTION
// POST /api/notifications/subscribe
// =========================================
//
// Browser sends:
//
// {
//   endpoint: "...",
//   keys: {
//     p256dh: "...",
//     auth: "..."
//   }
// }
//
// =========================================

router.post(
  "/subscribe",
  notificationController.savePushSubscription
);

// =========================================
// REMOVE PUSH SUBSCRIPTION
// DELETE /api/notifications/subscribe
// =========================================

router.delete(
  "/subscribe",
  notificationController.removePushSubscription
);

// =========================================
// MARK ONE AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================

router.patch(
  "/:notificationId/read",
  notificationController.markAsRead
);

// =========================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// =========================================

router.patch(
  "/read-all",
  notificationController.markAllAsRead
);

module.exports = router;