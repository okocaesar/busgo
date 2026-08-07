const jwt = require("jsonwebtoken");

exports.requireAdmin = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please login first."
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only."
      });
    }

    req.admin = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Your login session has expired."
    });
  }
};