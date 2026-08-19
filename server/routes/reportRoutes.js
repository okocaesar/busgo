const express = require("express");

const {
  createReport,
  getMyReports,
  getMyReportById
} = require("../controllers/reportController");

const {
  requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();


// =========================================
// CREATE REPORT
// POST /api/reports
// =========================================

router.post(
  "/",
  requireAuth,
  createReport
);


// =========================================
// GET MY REPORTS
// GET /api/reports
// =========================================

router.get(
  "/",
  requireAuth,
  getMyReports
);


// =========================================
// GET MY REPORT BY ID
// GET /api/reports/:id
// =========================================

router.get(
  "/:id",
  requireAuth,
  getMyReportById
);


module.exports = router;