const express = require("express");

const router = express.Router();

// =========================================
// BUSGO APP VERSION
// =========================================
//
// IMPORTANT:
// Change CURRENT_VERSION whenever you release
// a new frontend version.
//
// Example:
// 1.0.1 -> current release
// 1.0.2 -> next release
//
// MINIMUM_VERSION determines the oldest version
// that is still allowed to run.
//
// =========================================

const CURRENT_VERSION = "1.0.1";
const MINIMUM_VERSION = "1.0.1";

const UPDATE_URL =
  "https://okocaesar-group2internship.vercel.app";

// =========================================
// VERSION COMPARISON
// =========================================

const compareVersions = (versionA, versionB) => {
  const a = String(versionA || "0.0.0")
    .split(".")
    .map(Number);

  const b = String(versionB || "0.0.0")
    .split(".")
    .map(Number);

  for (let i = 0; i < 3; i++) {
    const partA = Number.isFinite(a[i])
      ? a[i]
      : 0;

    const partB = Number.isFinite(b[i])
      ? b[i]
      : 0;

    if (partA > partB) {
      return 1;
    }

    if (partA < partB) {
      return -1;
    }
  }

  return 0;
};

// =========================================
// GET BUSGO VERSION
// =========================================
//
// GET /api/version
//
// Optional frontend query:
// /api/version?version=1.0.0
//
// =========================================

router.get("/", (req, res) => {
  try {
    const installedVersion =
      String(
        req.query.version || CURRENT_VERSION
      ).trim();

    const comparison =
      compareVersions(
        installedVersion,
        MINIMUM_VERSION
      );

    // =======================================
    // FORCE UPDATE
    // =======================================

    const updateRequired =
      comparison < 0;

    // =======================================
    // RESPONSE
    // =======================================

    return res.status(200).json({
      success: true,

      currentVersion:
        CURRENT_VERSION,

      minimumVersion:
        MINIMUM_VERSION,

      installedVersion:
        installedVersion,

      updateRequired:
        updateRequired,

      updateUrl:
        UPDATE_URL,

      message: updateRequired
        ? "Your BusGo version is outdated. Please update to continue."
        : "BusGo is up to date."
    });

  } catch (error) {

    console.error(
      "VERSION CHECK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to check BusGo version."
    });
  }
});

// =========================================
// EXPORT
// =========================================

module.exports = router;