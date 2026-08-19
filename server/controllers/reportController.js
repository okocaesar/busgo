const db = require("../config/database");


// =========================================
// GET CURRENT USER ID
// =========================================

const getUserId = (req) => {
  return req.user?.id || req.user?.userId || null;
};


// =========================================
// CREATE REPORT
// =========================================
// POST /api/reports
// =========================================

const createReport = (req, res) => {

  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }


  const { message } = req.body;


  // =========================================
  // VALIDATE MESSAGE
  // =========================================

  if (
    !message ||
    typeof message !== "string" ||
    !message.trim()
  ) {

    return res.status(400).json({
      message: "Report message is required."
    });

  }


  const cleanMessage = message.trim();


  if (cleanMessage.length > 2000) {

    return res.status(400).json({
      message:
        "Report message cannot exceed 2000 characters."
    });

  }


  // =========================================
  // CREATE REPORT
  // =========================================

  const sql = `
    INSERT INTO reports
    (
      user_id,
      message,
      status
    )
    VALUES
    (
      ?,
      ?,
      'pending'
    )
  `;


  db.query(
    sql,
    [
      userId,
      cleanMessage
    ],
    (error, result) => {

      if (error) {

        console.error(
          "CREATE REPORT ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to submit report."
        });

      }


      console.log(
        "REPORT CREATED:",
        {
          reportId: result.insertId,
          userId
        }
      );


      return res.status(201).json({

        message:
          "Report submitted successfully.",

        report: {

          id:
            result.insertId,

          user_id:
            userId,

          message:
            cleanMessage,

          status:
            "pending"

        }

      });

    }
  );

};


// =========================================
// GET MY REPORTS
// =========================================
// GET /api/reports
//
// IMPORTANT:
// Users can only see their own reports.
// =========================================

const getMyReports = (req, res) => {

  const userId = getUserId(req);

  if (!userId) {

    return res.status(401).json({
      message:
        "Authentication required."
    });

  }


  const sql = `
    SELECT
      id,
      user_id,
      message,
      status,
      created_at,
      updated_at

    FROM reports

    WHERE user_id = ?

    ORDER BY
      created_at DESC
  `;


  db.query(
    sql,
    [userId],
    (error, results) => {

      if (error) {

        console.error(
          "GET MY REPORTS ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to load your reports."
        });

      }


      return res.status(200).json({

        reports:
          results || []

      });

    }
  );

};


// =========================================
// GET MY REPORT BY ID
// =========================================
// GET /api/reports/:id
// =========================================

const getMyReportById = (req, res) => {

  const userId = getUserId(req);

  if (!userId) {

    return res.status(401).json({
      message:
        "Authentication required."
    });

  }


  const { id } = req.params;


  if (!id) {

    return res.status(400).json({
      message:
        "Report ID is required."
    });

  }


  const sql = `
    SELECT
      r.id,
      r.user_id,
      r.message,
      r.status,
      r.created_at,
      r.updated_at

    FROM reports r

    WHERE r.id = ?
      AND r.user_id = ?

    LIMIT 1
  `;


  db.query(
    sql,
    [
      id,
      userId
    ],
    (error, results) => {

      if (error) {

        console.error(
          "GET MY REPORT ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to load report."
        });

      }


      if (
        !results ||
        results.length === 0
      ) {

        return res.status(404).json({
          message:
            "Report not found."
        });

      }


      return res.status(200).json({

        report:
          results[0]

      });

    }
  );

};


// =========================================
// GET ALL REPORTS
// =========================================
// ADMIN ONLY
// =========================================

const getAllReports = (req, res) => {

  const sql = `
    SELECT
      r.id,
      r.user_id,
      r.message,
      r.status,
      r.created_at,
      r.updated_at,

      u.name,
      u.email,
      u.phone

    FROM reports r

    LEFT JOIN users u
      ON r.user_id = u.id

    ORDER BY
      r.created_at DESC
  `;


  db.query(
    sql,
    (error, results) => {

      if (error) {

        console.error(
          "GET ALL REPORTS ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to load reports."
        });

      }


      return res.status(200).json({

        reports:
          results || []

      });

    }
  );

};


// =========================================
// UPDATE REPORT STATUS
// =========================================
// ADMIN ONLY
// PATCH /api/admin/reports/:reportId/status
// =========================================

const updateReportStatus = (req, res) => {

  const {
    reportId
  } = req.params;


  const {
    status
  } = req.body;


  // =========================================
  // VALIDATION
  // =========================================

  if (!reportId) {

    return res.status(400).json({
      message:
        "Report ID is required."
    });

  }


  const allowedStatuses = [
    "pending",
    "reviewed",
    "resolved",
    "rejected"
  ];


  if (
    !allowedStatuses.includes(status)
  ) {

    return res.status(400).json({
      message:
        "Invalid report status."
    });

  }


  // =========================================
  // UPDATE STATUS
  // =========================================

  const sql = `
    UPDATE reports

    SET
      status = ?,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
  `;


  db.query(
    sql,
    [
      status,
      reportId
    ],
    (error, result) => {

      if (error) {

        console.error(
          "UPDATE REPORT STATUS ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to update report status."
        });

      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            "Report not found."
        });

      }


      console.log(
        "REPORT STATUS UPDATED:",
        {
          reportId,
          status
        }
      );


      return res.status(200).json({

        message:
          "Report status updated successfully.",

        report: {

          id:
            Number(reportId),

          status

        }

      });

    }
  );

};


// =========================================
// EXPORT
// =========================================

module.exports = {

  createReport,

  getMyReports,

  getMyReportById,

  getAllReports,

  updateReportStatus

};