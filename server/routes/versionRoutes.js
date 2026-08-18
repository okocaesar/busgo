const express = require("express");

const router = express.Router();

// =========================================
// BUSGO APP VERSION
// =========================================

router.get("/", (req, res) => {
  res.status(200).json({
    currentVersion: "1.0.1",
    minimumVersion: "1.0.1",
    updateRequired: true,
    updateUrl:
      "https://okocaesar-group2internship.vercel.app",
    message:
      "A new version of BusGo is available. Please update to continue."
  });
});

module.exports = router;