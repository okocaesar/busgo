const express = require("express");

const router = express.Router();

const bookingController =
  require("../controllers/bookingController");

// =========================================
// TEST BOOKING ROUTE
//
// GET /api/bookings/test
// =========================================

router.get(
  "/test",
  (req, res) => {

    res.json({

      message:
        "Booking routes are working"

    });

  }
);


// =========================================
// GET BOOKED SEATS / AVAILABILITY
//
// GET:
// /api/bookings/availability
//
// Example:
//
// /api/bookings/availability
// ?busId=1
// &routeId=2
// &date=2026-08-20
//
// IMPORTANT:
//
// Availability is based on:
//
// BUS + ROUTE + DATE
//
// Therefore:
//
// Bus 1
// Douala -> Yaoundé
// August 20
// Seat 1
//
// is separate from:
//
// Bus 1
// Yaoundé -> Douala
// August 20
// Seat 1
// =========================================

router.get(
  "/availability",
  bookingController.getBookedSeats
);


// =========================================
// GET BOOKED SEATS
//
// LEGACY / BACKWARD COMPATIBILITY
//
// GET:
//
// /api/bookings/booked-seats/:busId/:date
//
// NOTE:
// The new availability system requires
// routeId as well.
//
// The main Booking.jsx application uses
// /availability above.
// =========================================

router.get(
  "/booked-seats/:busId/:date",
  bookingController.getBookedSeats
);


// =========================================
// CREATE BOOKING
//
// POST:
//
// /api/bookings
//
// This is the FINAL booking endpoint.
//
// The controller performs:
//
// 1. Route lookup
// 2. Bus lookup
// 3. Seat availability check
// 4. Transaction
// 5. Bus row locking
// 6. Final seat verification
// 7. Booking insertion
//
// If another user already booked the seat:
//
// HTTP 409 Conflict
// =========================================

router.post(
  "/",
  bookingController.createBooking
);


// =========================================
// GET USER BOOKINGS
//
// GET:
//
// /api/bookings/user/:userId
// =========================================

router.get(
  "/user/:userId",
  bookingController.getUserBookings
);


// =========================================
// CANCEL BOOKING
//
// PATCH:
//
// /api/bookings/:bookingId/cancel/user/:userId
// =========================================

router.patch(
  "/:bookingId/cancel/user/:userId",
  bookingController.cancelBooking
);


// =========================================
// EXPORT ROUTER
// =========================================

module.exports = router;