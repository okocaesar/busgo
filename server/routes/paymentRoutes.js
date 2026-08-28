
const express = require("express");

const router = express.Router();

const paymentController =
  require("../controllers/paymentController");

const {
  requireAuth
} = require("../middleware/authMiddleware");

// =========================================
// CREATE PAYMENT
// POST /api/payments
// =========================================
//
// Initializes a Flutterwave V4 payment.
// Payment remains Pending until verified.
//
router.post(
  "/",
  requireAuth,
  paymentController.createPayment
);

// =========================================
// VERIFY PAYMENT
// POST /api/payments/verify
// =========================================
//
// Verifies the payment directly with
// Flutterwave before marking it Successful.
//
router.post(
  "/verify",
  requireAuth,
  paymentController.verifyPayment
);

// =========================================
// GET MY PAYMENTS
// GET /api/payments/my-payments
// =========================================
//
// Returns the authenticated user's
// payment history.
//
router.get(
  "/my-payments",
  requireAuth,
  paymentController.getMyPayments
);

// =========================================
// REQUEST PAYMENT REVERSAL
// PATCH /api/payments/:paymentId/request-reversal
// =========================================
//
// Allows a user to request reversal of
// a successful payment.
//
router.patch(
  "/:paymentId/request-reversal",
  requireAuth,
  paymentController.requestPaymentReversal
);

module.exports = router;
