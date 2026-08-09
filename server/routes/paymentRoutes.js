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

router.post(
  "/",
  requireAuth,
  paymentController.createPayment
);


// =========================================
// GET MY PAYMENTS
// GET /api/payments/my-payments
// =========================================

router.get(
  "/my-payments",
  requireAuth,
  paymentController.getMyPayments
);


// =========================================
// REQUEST PAYMENT REVERSAL
// PATCH /api/payments/:paymentId/request-reversal
// =========================================

router.patch(
  "/:paymentId/request-reversal",
  requireAuth,
  paymentController.requestPaymentReversal
);


module.exports = router;