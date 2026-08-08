const jwt = require("jsonwebtoken");

exports.requireAuth = (req, res, next) => {
  try {
    // =========================================
    // CHECK AUTHORIZATION HEADER
    // =========================================

    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: "Please login first."
      });
    }

    // =========================================
    // CHECK BEARER TOKEN
    // =========================================

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authentication format."
      });
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing."
      });
    }

    // =========================================
    // CHECK JWT SECRET
    // =========================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        message:
          "Server authentication configuration is missing."
      });
    }

    // =========================================
    // VERIFY TOKEN
    // =========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =========================================
    // STORE USER INFORMATION
    // =========================================

    req.user = decoded;

    console.log(
      "AUTHENTICATED USER:",
      req.user
    );

    next();

  } catch (error) {

    console.error(
      "AUTH TOKEN ERROR:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Your login session has expired."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid authentication token."
      });
    }

    return res.status(401).json({
      message: "Authentication failed."
    });
  }
};