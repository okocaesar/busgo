const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// =========================================
// ENVIRONMENT CHECK
// =========================================

console.log("=========================================");
console.log("BUSGO SERVER STARTING");
console.log("=========================================");

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
// SERVER TEST
// =========================================

app.get("/api/server-test", (req, res) => {
  res.status(200).json({
    message: "BusGo server is working correctly.",
    time: new Date().toISOString()
  });
});

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
// PAYMENT ROUTES
// =========================================

app.use(
  "/api/payments",
  require("./routes/paymentRoutes")
);

// =========================================
// NOTIFICATION TEST ROUTE
// =========================================

app.get("/api/notifications-test", (req, res) => {
  res.status(200).json({
    message: "BusGo notification system route is working."
  });
});

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
  res.status(200).send(
    "BusGo API Server Running"
  );
});

// =========================================
// 404 HANDLER
// =========================================

app.use((req, res) => {
  console.log(
    "404 ROUTE NOT FOUND:",
    req.method,
    req.originalUrl
  );

  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl
  });
});

// =========================================
// GLOBAL ERROR HANDLER
// =========================================

app.use((err, req, res, next) => {
  console.error(
    "GLOBAL SERVER ERROR:",
    err
  );

  res.status(500).json({
    message: "Internal server error."
  });
});

// =========================================
// SERVER
// =========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=========================================");
  console.log(
    `BusGo server running on port ${PORT}`
  );
  console.log("=========================================");
});