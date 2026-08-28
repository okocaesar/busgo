const db = require("../config/database");

/* =========================================================
   GET CURRENT USER ID
   ========================================================= */

const getUserId = (req) => {
  return req.user?.id || req.user?.userId || null;
};


/* =========================================================
   CREATE REPORT
   POST /api/reports
   ========================================================= */

const createReport = (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }

  const {
    subject,
    message
  } = req.body;


  /* =======================================================
     VALIDATE SUBJECT
     ======================================================= */

  if (
    !subject ||
    typeof subject !== "string" ||
    !subject.trim()
  ) {
    return res.status(400).json({
      message: "Report subject is required."
    });
  }

  const cleanSubject = subject.trim();

  if (cleanSubject.length > 255) {
    return res.status(400).json({
      message: "Report subject cannot exceed 255 characters."
    });
  }


  /* =======================================================
     VALIDATE MESSAGE
     ======================================================= */

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

  if (cleanMessage.length > 5000) {
    return res.status(400).json({
      message: "Report message cannot exceed 5000 characters."
    });
  }


  /* =======================================================
     CREATE REPORT
     ======================================================= */

  const sql = `
    INSERT INTO reports
    (
      user_id,
      subject,
      message,
      status
    )
    VALUES
    (
      ?,
      ?,
      ?,
      'Pending'
    )
  `;

  db.query(
    sql,
    [
      userId,
      cleanSubject,
      cleanMessage
    ],
    (error, result) => {

      if (error) {
        console.error(
          "CREATE REPORT ERROR:",
          error
        );

        return res.status(500).json({
          message: "Unable to submit report."
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
        message: "Report submitted successfully.",

        report: {
          id: result.insertId,
          user_id: userId,
          subject: cleanSubject,
          message: cleanMessage,
          status: "Pending",
          admin_reply: null,
          replied_at: null
        }
      });
    }
  );
};


/* =========================================================
   GET MY REPORTS
   GET /api/reports
   =========================================================

   IMPORTANT:
   Users can only see their own reports.
   ========================================================= */

const getMyReports = (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }


  const sql = `
    SELECT
      id,
      user_id,
      subject,
      message,
      status,
      admin_reply,
      replied_at,
      created_at,
      updated_at
    FROM reports
    WHERE user_id = ?
    ORDER BY created_at DESC
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
          message: "Unable to load your reports."
        });
      }


      return res.status(200).json({
        reports: results || []
      });
    }
  );
};


/* =========================================================
   GET MY REPORT BY ID
   GET /api/reports/:id
   ========================================================= */

const getMyReportById = (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }


  const { id } = req.params;


  if (!id) {
    return res.status(400).json({
      message: "Report ID is required."
    });
  }


  const sql = `
    SELECT
      id,
      user_id,
      subject,
      message,
      status,
      admin_reply,
      replied_at,
      created_at,
      updated_at
    FROM reports
    WHERE id = ?
      AND user_id = ?
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
          message: "Unable to load report."
        });
      }


      if (
        !results ||
        results.length === 0
      ) {
        return res.status(404).json({
          message: "Report not found."
        });
      }


      return res.status(200).json({
        report: results[0]
      });
    }
  );
};


/* =========================================================
   GET ALL REPORTS
   ADMIN ONLY
   GET /api/admin/reports
   ========================================================= */

const getAllReports = (req, res) => {

  const sql = `
    SELECT
      r.id,
      r.user_id,
      r.subject,
      r.message,
      r.status,
      r.admin_reply,
      r.replied_at,
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
          message: "Unable to load reports."
        });
      }


      return res.status(200).json({
        reports: results || []
      });
    }
  );
};


/* =========================================================
   GET REPORT STATISTICS
   ADMIN ONLY
   GET /api/admin/reports/stats
   =========================================================

   Returns:

   Total Reports
   Pending
   In Progress
   Resolved
   Rejected
   ========================================================= */

const getReportStats = (req, res) => {

  const sql = `
    SELECT

      COUNT(*) AS total_reports,

      SUM(
        CASE
          WHEN status = 'Pending'
          THEN 1
          ELSE 0
        END
      ) AS pending,

      SUM(
        CASE
          WHEN status = 'In Progress'
          THEN 1
          ELSE 0
        END
      ) AS in_progress,

      SUM(
        CASE
          WHEN status = 'Resolved'
          THEN 1
          ELSE 0
        END
      ) AS resolved,

      SUM(
        CASE
          WHEN status = 'Rejected'
          THEN 1
          ELSE 0
        END
      ) AS rejected

    FROM reports
  `;


  db.query(
    sql,
    (error, results) => {

      if (error) {
        console.error(
          "GET REPORT STATS ERROR:",
          error
        );

        return res.status(500).json({
          message: "Unable to load report statistics."
        });
      }


      const stats = results?.[0] || {};


      return res.status(200).json({

        stats: {
          total_reports:
            Number(stats.total_reports || 0),

          pending:
            Number(stats.pending || 0),

          in_progress:
            Number(stats.in_progress || 0),

          resolved:
            Number(stats.resolved || 0),

          rejected:
            Number(stats.rejected || 0)
        }

      });
    }
  );
};


/* =========================================================
   UPDATE REPORT STATUS
   ADMIN ONLY
   PATCH /api/admin/reports/:reportId/status
   ========================================================= */

const updateReportStatus = (req, res) => {

  const {
    reportId
  } = req.params;


  const {
    status
  } = req.body;


  /* =======================================================
     VALIDATE REPORT ID
     ======================================================= */

  if (!reportId) {
    return res.status(400).json({
      message: "Report ID is required."
    });
  }


  /* =======================================================
     ALLOWED STATUSES
     ======================================================= */

  const allowedStatuses = [
    "Pending",
    "In Progress",
    "Resolved",
    "Rejected"
  ];


  if (
    !allowedStatuses.includes(status)
  ) {
    return res.status(400).json({
      message:
        "Invalid report status. Allowed statuses are Pending, In Progress, Resolved, and Rejected."
    });
  }


  /* =======================================================
     UPDATE STATUS
     ======================================================= */

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
          message: "Report not found."
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
          id: Number(reportId),
          status
        }

      });
    }
  );
};


/* =========================================================
   ADMIN REPLY TO REPORT
   ADMIN ONLY
   PATCH /api/admin/reports/:reportId/reply
   ========================================================= */

const replyToReport = (req, res) => {

  const {
    reportId
  } = req.params;


  const {
    admin_reply
  } = req.body;


  /* =======================================================
     VALIDATE REPORT ID
     ======================================================= */

  if (!reportId) {
    return res.status(400).json({
      message: "Report ID is required."
    });
  }


  /* =======================================================
     VALIDATE ADMIN REPLY
     ======================================================= */

  if (
    !admin_reply ||
    typeof admin_reply !== "string" ||
    !admin_reply.trim()
  ) {
    return res.status(400).json({
      message: "Admin reply is required."
    });
  }


  const cleanReply =
    admin_reply.trim();


  if (cleanReply.length > 5000) {
    return res.status(400).json({
      message:
        "Admin reply cannot exceed 5000 characters."
    });
  }


  /* =======================================================
     UPDATE REPORT
     ======================================================= */

  const sql = `
    UPDATE reports

    SET
      admin_reply = ?,
      replied_at = CURRENT_TIMESTAMP,
      status = 'In Progress',
      updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
  `;


  db.query(
    sql,
    [
      cleanReply,
      reportId
    ],
    (error, result) => {

      if (error) {
        console.error(
          "REPLY TO REPORT ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to send admin reply."
        });
      }


      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          message: "Report not found."
        });
      }


      console.log(
        "ADMIN REPLIED TO REPORT:",
        {
          reportId
        }
      );


      return res.status(200).json({

        message:
          "Reply sent successfully.",

        report: {
          id: Number(reportId),
          admin_reply: cleanReply,
          status: "In Progress"
        }

      });
    }
  );
};


/* =========================================================
   DELETE REPORT
   ADMIN ONLY
   DELETE /api/admin/reports/:reportId
   ========================================================= */

const deleteReport = (req, res) => {

  const {
    reportId
  } = req.params;


  if (!reportId) {
    return res.status(400).json({
      message: "Report ID is required."
    });
  }


  const sql = `
    DELETE FROM reports
    WHERE id = ?
  `;


  db.query(
    sql,
    [reportId],
    (error, result) => {

      if (error) {
        console.error(
          "DELETE REPORT ERROR:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to delete report."
        });
      }


      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          message: "Report not found."
        });
      }


      return res.status(200).json({
        message:
          "Report deleted successfully."
      });
    }
  );
};


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {

  createReport,

  getMyReports,

  getMyReportById,

  getAllReports,

  getReportStats,

  updateReportStatus,

  replyToReport,

  deleteReport

};