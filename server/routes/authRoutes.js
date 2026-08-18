const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

const {
  requireAuth
} = require("../middleware/authMiddleware");


// =========================================
// REGISTER
// POST /api/auth/register
// =========================================

router.post(
  "/register",
  authController.register
);


// =========================================
// SEND WHATSAPP OTP
// POST /api/auth/send-whatsapp-otp
// =========================================

router.post(
  "/send-whatsapp-otp",
  authController.sendWhatsAppOTP
);


// =========================================
// SEND EMAIL OTP
// POST /api/auth/send-email-otp
// =========================================

router.post(
  "/send-email-otp",
  authController.sendEmailOTP
);


// =========================================
// VERIFY OTP
// POST /api/auth/verify-otp
// =========================================

router.post(
  "/verify-otp",
  authController.verifyOTP
);


// =========================================
// RESEND OTP
// POST /api/auth/resend-otp
// =========================================

router.post(
  "/resend-otp",
  authController.resendOTP
);


// =========================================
// LOGIN
// POST /api/auth/login
// =========================================

router.post(
  "/login",
  authController.login
);


// =========================================
// GET PROFILE
// GET /api/auth/profile
// Requires authentication
// =========================================

router.get(
  "/profile",
  requireAuth,
  authController.getProfile
);


// =========================================
// UPDATE PROFILE
// PUT /api/auth/profile
// Requires authentication
// =========================================

router.put(
  "/profile",
  requireAuth,
  authController.updateProfile
);


module.exports = router;