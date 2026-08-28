const express = require("express");

const {
  savePushSubscription,
  removePushSubscription
} = require("../controllers/pushController");

const router =
  express.Router();

// =========================================
// AUTHENTICATION MIDDLEWARE
// =========================================
//
// CHANGE THIS PATH IF YOUR AUTH MIDDLEWARE
// HAS A DIFFERENT FILE NAME.
//

const authenticateToken =
  require("../middleware/authMiddleware");

// =========================================
// SAVE SUBSCRIPTION
// =========================================

router.post(
  "/subscribe",
  authenticateToken,
  savePushSubscription
);

// =========================================
// REMOVE SUBSCRIPTION
// =========================================

router.delete(
  "/unsubscribe",
  authenticateToken,
  removePushSubscription
);

module.exports = router;