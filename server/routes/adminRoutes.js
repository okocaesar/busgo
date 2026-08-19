const express = require("express");

const router = express.Router();

const {
  getAllReports,
  updateReportStatus
} = require("../controllers/reportController");

const adminController =
  require("../controllers/adminController");

const {
  requireAdmin
} = require("../middleware/adminMiddleware");


// =========================================
// ADMIN AUTHENTICATION
// =========================================

router.use(requireAdmin);


// =========================================
// ADMIN STATISTICS
// GET /api/admin/stats
// =========================================

router.get(
  "/stats",
  adminController.getStats
);


// =========================================
// ALL USERS
// GET /api/admin/users
// =========================================

router.get(
  "/users",
  adminController.getUsers
);


// =========================================
// ALL BOOKINGS
// GET /api/admin/bookings
// =========================================

router.get(
  "/bookings",
  adminController.getBookings
);


// =========================================
// ALL ROUTES
// GET /api/admin/routes
// =========================================

router.get(
  "/routes",
  adminController.getRoutes
);


// =========================================
// CREATE BOOKING FOR REGISTERED USER
// POST /api/admin/bookings/create
// =========================================

router.post(
  "/bookings/create",
  adminController.createBooking
);


// =========================================
// UPDATE BOOKING STATUS
// PATCH /api/admin/bookings/:bookingId/status
// =========================================

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
// REPORTS
// GET /api/admin/reports
// =========================================

// =========================================
// REPORTS
// GET /api/admin/reports
// =========================================

router.get(
  "/reports",
  getAllReports
);


// =========================================
// UPDATE REPORT STATUS
// PATCH /api/admin/reports/:reportId/status
// =========================================

router.patch(
  "/reports/:reportId/status",
  updateReportStatus
);


// =========================================
// ALL PAYMENTS
// GET /api/admin/payments
// =========================================

router.get(
  "/payments",
  adminController.getPayments
);


// =========================================
// ACCEPT PAYMENT REVERSAL
// PATCH /api/admin/payments/:paymentId/accept-reversal
// =========================================

router.patch(
  "/payments/:paymentId/accept-reversal",
  adminController.acceptPaymentReversal
);


// =========================================
// DENY PAYMENT REVERSAL
// PATCH /api/admin/payments/:paymentId/deny-reversal
// =========================================

router.patch(
  "/payments/:paymentId/deny-reversal",
  adminController.denyPaymentReversal
);


module.exports = router;