const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// =========================================
// REGISTER
// =========================================

exports.register = async (req, res) => {
  const {
    name,
    email,
    phone,
    password
  } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      message: "Please provide name, email, phone and password."
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    User.create(
      {
        name,
        email,
        phone,
        password: hashedPassword
      },
      (err, result) => {
        if (err) {
          console.error("Registration database error:", err);

          return res.status(500).json({
            message: err.message
          });
        }

        return res.status(201).json({
          message: "Registration successful",
          userId: result.insertId
        });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};


// =========================================
// LOGIN
// =========================================

exports.login = (req, res) => {
  const {
    email,
    password
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required."
    });
  }

  User.findByEmail(email, async (err, result) => {

    // DATABASE ERROR
    if (err) {
      console.error("Login database error:", err);

      return res.status(500).json({
        message: "Database error during login."
      });
    }

    // USER DOES NOT EXIST
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    try {
      const user = result[0];

      // CHECK PASSWORD
      const match = await bcrypt.compare(
        password,
        user.password
      );

      if (!match) {
        return res.status(401).json({
          message: "Wrong password."
        });
      }

      // CHECK JWT SECRET
      if (!process.env.JWT_SECRET) {
        console.error(
          "JWT_SECRET is missing from environment variables."
        );

        return res.status(500).json({
          message: "Server authentication configuration is missing."
        });
      }

      // CREATE TOKEN
      const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error("JWT_SECRET is missing when creating token.");

  return res.status(500).json({
    message: "Server authentication configuration is missing."
  });
}

const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role
  },
  jwtSecret,
  {
    expiresIn: "24h"
  }
);

      // SUCCESS
      return res.status(200).json({
        message: "Login successful",

        token,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {

      console.error("Login authentication error:", error);

      return res.status(500).json({
        message: "Authentication error during login."
      });
    }
  });
};