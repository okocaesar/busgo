const express = require("express");

const router = express.Router();

const bookingController =
  require("../controllers/bookingController");

router.get("/test", (req, res) => {
  res.json({
    message: "Booking routes are working"
  });
});

router.post(
  "/",
  bookingController.createBooking
);

router.patch(
  "/:bookingId/cancel/user/:userId",
  bookingController.cancelBooking
);

router.get(
  "/:userId",
  bookingController.getUserBookings
);

module.exports = router;