const express = require("express");

const {
  getMessages,
  sendMessage,
  deleteMessage
} = require("../controllers/communityController");

const {
  requireAuth
} = require("../middleware/authMiddleware");


const router =
  express.Router();


// =========================================
// GET COMMUNITY MESSAGES
// =========================================
//
// GET /api/community
//
// =========================================

router.get(
  "/",
  requireAuth,
  getMessages
);


// =========================================
// SEND COMMUNITY MESSAGE
// =========================================
//
// POST /api/community
//
// Body:
//
// {
//   "message": "Hi everyone!"
// }
//
// =========================================

router.post(
  "/",
  requireAuth,
  sendMessage
);


// =========================================
// DELETE COMMUNITY MESSAGE
// =========================================
//
// DELETE /api/community/:id
//
// =========================================

router.delete(
  "/:id",
  requireAuth,
  deleteMessage
);


module.exports = router;