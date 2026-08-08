const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// =========================================
// ENVIRONMENT CHECK
// =========================================

console.log("PORT:", process.env.PORT);

console.log(
  "JWT_SECRET loaded:",
  process.env.JWT_SECRET ? "YES" : "NO"
);

// =========================================
// DATABASE
// =========================================

require("./config/database");

// =========================================
// EXPRESS APP
// =========================================

const app = express();

// =========================================
// MIDDLEWARE
// =========================================

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

// =========================================
// AUTHENTICATION ROUTES
// =========================================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

// =========================================
// BOOKING ROUTES
// =========================================

app.use(
  "/api/bookings",
  require("./routes/bookingRoutes")
);

// =========================================
// NOTIFICATION ROUTES
// =========================================

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);

// =========================================
// ADMIN ROUTES
// =========================================

app.use(
  "/api/admin",
  require("./routes/adminRoutes")
);

// =========================================
// ROOT ROUTE
// =========================================

app.get("/", (req, res) => {
  res.send("BusGo API Server Running");
});

// =========================================
// 404 HANDLER
// =========================================

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl
  });
});

// =========================================
// SERVER
// =========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});