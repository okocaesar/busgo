const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");


// =========================================
// REGISTER
// POST /api/auth/register
// =========================================

router.post(
  "/register",
  authController.register
);


// =========================================
// SEND EMAIL OTP
//
// POST /api/auth/send-email-otp
//
// IMPORTANT:
// This is ONLY called after the user
// explicitly chooses email fallback.
// =========================================

router.post(
  "/send-email-otp",
  authController.sendEmailOTP
);


// =========================================
// VERIFY OTP
//
// POST /api/auth/verify-otp
// =========================================

router.post(
  "/verify-otp",
  authController.verifyOTP
);


// =========================================
// RESEND OTP
//
// POST /api/auth/resend-otp
// =========================================

router.post(
  "/resend-otp",
  authController.resendOTP
);


// =========================================
// LOGIN
//
// POST /api/auth/login
// =========================================

router.post(
  "/login",
  authController.login
);


module.exports = router;