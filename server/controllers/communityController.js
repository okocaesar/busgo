const db = require("../config/database");


// =========================================
// GET COMMUNITY MESSAGES
// =========================================

exports.getMessages = (req, res) => {

  const limit = Math.min(
    Number(req.query.limit) || 50,
    100
  );

  const sql = `
    SELECT
      id,
      user_id,
      user_name,
      message,
      created_at
    FROM community_messages
    ORDER BY created_at ASC
    LIMIT ?
  `;

  db.query(
    sql,
    [limit],
    (err, results) => {

      if (err) {

        console.error(
          "GET COMMUNITY MESSAGES ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Failed to load community messages."
        });
      }

      return res.status(200).json({
        success: true,
        messages: results
      });
    }
  );
};



// =========================================
// SEND COMMUNITY MESSAGE
// =========================================

exports.sendMessage = (req, res) => {

  const {
    message
  } = req.body;


  // =======================================
  // VALIDATE MESSAGE
  // =======================================

  if (
    !message ||
    typeof message !== "string"
  ) {

    return res.status(400).json({
      message:
        "Message is required."
    });
  }


  const cleanMessage =
    message.trim();


  if (!cleanMessage) {

    return res.status(400).json({
      message:
        "Message cannot be empty."
    });
  }


  if (cleanMessage.length > 1000) {

    return res.status(400).json({
      message:
        "Message cannot exceed 1000 characters."
    });
  }


  // =======================================
  // GET USER FROM JWT
  // =======================================

  const userId =
    req.user.id ||
    req.user.userId;


  const userName =
    req.user.name ||
    req.user.fullName ||
    req.user.username ||
    req.user.email ||
    "BusGo User";


  if (!userId) {

    return res.status(401).json({
      message:
        "User authentication information is missing."
    });
  }


  // =======================================
  // INSERT MESSAGE
  // =======================================

  const sql = `
    INSERT INTO community_messages
    (
      user_id,
      user_name,
      message
    )
    VALUES (?, ?, ?)
  `;


  db.query(
    sql,
    [
      userId,
      userName,
      cleanMessage
    ],
    (err, result) => {

      if (err) {

        console.error(
          "SEND COMMUNITY MESSAGE ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Failed to send community message."
        });
      }


      // =====================================
      // RETURN CREATED MESSAGE
      // =====================================

      const newMessage = {
        id: result.insertId,

        user_id: userId,

        user_name: userName,

        message: cleanMessage,

        created_at:
          new Date()
      };


      return res.status(201).json({
        success: true,

        message:
          "Message sent successfully.",

        data:
          newMessage
      });
    }
  );
};



// =========================================
// DELETE COMMUNITY MESSAGE
// =========================================
//
// This can later be restricted to admins.
// For now we keep the controller ready.
//

exports.deleteMessage = (req, res) => {

  const {
    id
  } = req.params;


  if (!id) {

    return res.status(400).json({
      message:
        "Message ID is required."
    });
  }


  const sql = `
    DELETE FROM community_messages
    WHERE id = ?
  `;


  db.query(
    sql,
    [id],
    (err, result) => {

      if (err) {

        console.error(
          "DELETE COMMUNITY MESSAGE ERROR:",
          err
        );

        return res.status(500).json({
          message:
            "Failed to delete message."
        });
      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            "Message not found."
        });
      }


      return res.status(200).json({
        success: true,

        message:
          "Message deleted successfully."
      });
    }
  );
};