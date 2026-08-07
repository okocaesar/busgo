const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/bookingController");

// =========================================
// TEST BOOKING ROUTE
// GET /api/bookings/test
// =========================================

router.get("/test", (req, res) => {
  res.json({
    message: "Booking routes are working"
  });
});

// =========================================
// CREATE BOOKING
// POST /api/bookings
// =========================================

router.post(
  "/",
  bookingController.createBooking
);

// =========================================
// GET USER BOOKINGS
// GET /api/bookings/user/:userId
// =========================================

router.get(
  "/user/:userId",
  bookingController.getUserBookings
);

// =========================================
// CANCEL BOOKING
// PATCH /api/bookings/:bookingId/cancel/user/:userId
// =========================================

router.patch(
  "/:bookingId/cancel/user/:userId",
  bookingController.cancelBooking
);

module.exports = router;