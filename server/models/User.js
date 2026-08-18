const db = require("../config/database");

const User = {

  // =========================================
  // CREATE USER
  // =========================================

  create: (user, callback) => {
    const sql = `
      INSERT INTO users
      (
        name,
        email,
        phone,
        password,
        email_verified,
        otp_code,
        otp_expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        user.name,
        user.email,
        user.phone,
        user.password,
        user.emailVerified || 0,
        user.otpCode || null,
        user.otpExpiresAt || null
      ],
      callback
    );
  },


  // =========================================
  // FIND USER BY EMAIL
  // =========================================

  findByEmail: (email, callback) => {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [email],
      callback
    );
  },


  // =========================================
  // FIND USER BY ID
  // =========================================

  findById: (userId, callback) => {
    const sql = `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        email_verified,
        profile_picture,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [userId],
      callback
    );
  },


  // =========================================
  // UPDATE PROFILE
  // =========================================

  updateProfile: (
    userId,
    name,
    email,
    phone,
    callback
  ) => {

    const sql = `
      UPDATE users
      SET
        name = ?,
        email = ?,
        phone = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        name,
        email,
        phone,
        userId
      ],
      callback
    );
  },


  // =========================================
  // UPDATE PROFILE PICTURE
  // =========================================

  updateProfilePicture: (
    userId,
    profilePicture,
    callback
  ) => {

    const sql = `
      UPDATE users
      SET profile_picture = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        profilePicture,
        userId
      ],
      callback
    );
  },


  // =========================================
  // VERIFY OTP
  // =========================================

  verifyOTP: (email, otp, callback) => {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
        AND otp_code = ?
        AND otp_expires_at > NOW()
      LIMIT 1
    `;

    db.query(
      sql,
      [email, otp],
      callback
    );
  },


  // =========================================
  // MARK EMAIL VERIFIED
  // =========================================

  markEmailVerified: (userId, callback) => {
    const sql = `
      UPDATE users
      SET
        email_verified = 1,
        otp_code = NULL,
        otp_expires_at = NULL
      WHERE id = ?
    `;

    db.query(
      sql,
      [userId],
      callback
    );
  },


  // =========================================
  // UPDATE OTP
  // =========================================

  updateOTP: (
    userId,
    otpCode,
    otpExpiresAt,
    callback
  ) => {

    const sql = `
      UPDATE users
      SET
        otp_code = ?,
        otp_expires_at = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        otpCode,
        otpExpiresAt,
        userId
      ],
      callback
    );
  }

};

module.exports = User;