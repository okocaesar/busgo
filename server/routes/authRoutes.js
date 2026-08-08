const express = require("express");

const router = express.Router();

const authController =
  require("../controllers/authController");


// =========================================
// REGISTER
// =========================================

router.post(
  "/register",
  authController.register
);


// =========================================
// VERIFY OTP
// =========================================

router.post(
  "/verify-otp",
  authController.verifyOTP
);


// =========================================
// RESEND OTP
// =========================================

router.post(
  "/resend-otp",
  authController.resendOTP
);


// =========================================
// LOGIN
// =========================================

router.post(
  "/login",
  authController.login
);


module.exports = router;