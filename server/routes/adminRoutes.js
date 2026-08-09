const express = require("express");

const router = express.Router();

const adminController =
  require("../controllers/adminController");

const {
  requireAdmin
} = require("../middleware/adminMiddleware");

router.use(requireAdmin);

router.get(
  "/stats",
  adminController.getStats
);

router.get(
  "/users",
  adminController.getUsers
);

router.get(
  "/bookings",
  adminController.getBookings
);

router.patch(
  "/bookings/:bookingId/status",
  adminController.updateBookingStatus
);


// =========================================
// SEND NOTIFICATION
// POST /api/admin/notifications
// =========================================

router.post(
  "/notifications",
  adminController.sendNotification
);


// =========================================
// PAYMENT MANAGEMENT
// =========================================

router.get(
  "/payments",
  adminController.getPayments
);


router.patch(
  "/payments/:paymentId/accept-reversal",
  adminController.acceptPaymentReversal
);


router.patch(
  "/payments/:paymentId/deny-reversal",
  adminController.denyPaymentReversal
);

module.exports = router;