const express = require("express");

const router = express.Router();

const notificationController = require(
  "../controllers/notificationController"
);

const {
  requireAuth
} = require("../middleware/authMiddleware");


// =========================================
// AUTHENTICATION
// All notification routes require login
// =========================================

router.use(requireAuth);


// =========================================
// TEST
// GET /api/notifications/test
// =========================================

router.get("/test", (req, res) => {
  res.json({
    message: "Notification routes are working",
    userId: req.user.id
  });
});


// =========================================
// GET USER NOTIFICATIONS
// GET /api/notifications
// =========================================

router.get(
  "/",
  notificationController.getUserNotifications
);


// =========================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================

router.patch(
  "/:notificationId/read",
  notificationController.markAsRead
);


// =========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// =========================================

router.patch(
  "/read-all",
  notificationController.markAllAsRead
);


module.exports = router;