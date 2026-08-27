const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

dotenv.config();

// =========================================
// ENVIRONMENT CHECK
// =========================================

console.log("=========================================");
console.log("BUSGO SERVER STARTING");
console.log("=========================================");

console.log("PORT:", process.env.PORT || 5000);

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
// HTTP SERVER
// IMPORTANT FOR SOCKET.IO
// =========================================

const server = http.createServer(app);

// =========================================
// CORS
// =========================================

const allowedOrigins = [
  // Local development
  "http://localhost:3000",
  "http://localhost:10001",
  "http://localhost:10000",

  "http://127.0.0.1:3000",
  "http://127.0.0.1:10001",
  "http://127.0.0.1:10000",

  // Main Vercel deployment
  "https://okocaesar-group2internship.vercel.app",

  // Optional environment variable
  process.env.FRONTEND_URL
].filter(Boolean);

// =========================================
// CHECK WHETHER ORIGIN IS ALLOWED
// =========================================

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  // Exact allowed origins
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow Vercel preview deployments
  try {
    const url = new URL(origin);

    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(".vercel.app")
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
}

// =========================================
// CORS OPTIONS
// =========================================

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      console.log(
        "CORS ALLOWED:",
        origin || "NO ORIGIN"
      );

      return callback(null, true);
    }

    console.log(
      "CORS BLOCKED:",
      origin
    );

    return callback(
      new Error(
        `CORS blocked origin: ${origin}`
      )
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Cache-Control",
    "Pragma",
    "Expires"
  ],

  exposedHeaders: [
    "Content-Length",
    "Content-Type"
  ],

  optionsSuccessStatus: 204
};

// =========================================
// APPLY CORS
// =========================================

app.use(cors(corsOptions));

// Explicit OPTIONS handler
app.options("*", cors(corsOptions));

// =========================================
// BODY PARSER
// =========================================

app.use(
  express.json({
    limit: "10mb"
  })
);

// =========================================
// REQUEST LOGGER
// =========================================

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
  );

  next();
});

// =========================================
// SOCKET.IO
// =========================================

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Socket.IO CORS blocked origin: ${origin}`
        )
      );
    },

    methods: [
      "GET",
      "POST"
    ],

    credentials: true
  },

  transports: [
    "websocket",
    "polling"
  ]
});

// =========================================
// COMMUNITY DATA
// =========================================

const communityUsers = new Map();

const communityMessages = [];

const MAX_COMMUNITY_MESSAGES = 200;

// =========================================
// SOCKET AUTHENTICATION
// =========================================

io.use(
  (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error(
            "Authentication token is missing."
          )
        );
      }

      if (!process.env.JWT_SECRET) {
        console.error(
          "JWT_SECRET is missing."
        );

        return next(
          new Error(
            "Server authentication configuration is missing."
          )
        );
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      socket.user = decoded;

      next();

    } catch (error) {
      console.error(
        "SOCKET AUTH ERROR:",
        error.message
      );

      next(
        new Error(
          "Invalid authentication token."
        )
      );
    }
  }
);

// =========================================
// SOCKET CONNECTION
// =========================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "========================================="
    );

    console.log(
      "COMMUNITY USER CONNECTED"
    );

    console.log(
      "Socket ID:",
      socket.id
    );

    console.log(
      "User:",
      socket.user
    );

    console.log(
      "========================================="
    );

    // =======================================
    // GET USER INFORMATION
    // =======================================

    const decodedUser =
      socket.user || {};

    const userId =
      decodedUser.id ||
      decodedUser.userId ||
      decodedUser.user_id;

    const userName =
      decodedUser.name ||
      decodedUser.fullName ||
      decodedUser.username ||
      decodedUser.email ||
      "BusGo User";

    // =======================================
    // STORE USER
    // =======================================

    const user = {
      id:
        userId ||
        socket.id,

      name:
        userName,

      socketId:
        socket.id
    };

    communityUsers.set(
      socket.id,
      user
    );

    socket.data.user =
      user;

    console.log(
      "COMMUNITY USER JOINED:",
      user.name
    );

    // =======================================
    // SEND MESSAGE HISTORY
    // =======================================

    socket.emit(
      "community-history",
      communityMessages
    );

    // =======================================
    // ONLINE COUNT
    // =======================================

    io.emit(
      "community-online-count",
      communityUsers.size
    );

    // =======================================
    // ONLINE USERS
    // =======================================

    io.emit(
      "community-users",
      Array.from(
        communityUsers.values()
      ).map(
        (item) => ({
          id: item.id,
          name: item.name
        })
      )
    );

    // =======================================
    // COMMUNITY MESSAGE
    // =======================================

    socket.on(
      "community-send-message",
      (
        messageData = {},
        acknowledgement
      ) => {

        try {

          const message =
            String(
              messageData.message || ""
            ).trim();

          // ===================================
          // EMPTY MESSAGE
          // ===================================

          if (!message) {

            if (
              typeof acknowledgement ===
              "function"
            ) {
              acknowledgement({
                success: false,
                message:
                  "Message cannot be empty."
              });
            }

            return;
          }

          // ===================================
          // MESSAGE LENGTH
          // ===================================

          if (
            message.length > 1000
          ) {

            if (
              typeof acknowledgement ===
              "function"
            ) {
              acknowledgement({
                success: false,
                message:
                  "Message cannot exceed 1000 characters."
              });
            }

            return;
          }

          // ===================================
          // USER
          // ===================================

          const currentUser =
            socket.data.user || {};

          // ===================================
          // CREATE MESSAGE
          // ===================================

          const communityMessage = {
            id:
              `${Date.now()}-${socket.id}`,

            user_id:
              currentUser.id ||
              socket.id,

            user_name:
              currentUser.name ||
              "BusGo User",

            message:

              message,

            created_at:
              new Date().toISOString()
          };

          // ===================================
          // SAVE IN MEMORY
          // ===================================

          communityMessages.push(
            communityMessage
          );

          // ===================================
          // LIMIT HISTORY
          // ===================================

          if (
            communityMessages.length >
            MAX_COMMUNITY_MESSAGES
          ) {
            communityMessages.shift();
          }

          console.log(
            "========================================="
          );

          console.log(
            "COMMUNITY MESSAGE"
          );

          console.log(
            "User:",
            communityMessage.user_name
          );

          console.log(
            "Message:",
            communityMessage.message
          );

          console.log(
            "========================================="
          );

          // ===================================
          // SEND TO EVERYONE
          // ===================================

          io.emit(
            "community-new-message",
            communityMessage
          );

          // ===================================
          // ACKNOWLEDGE
          // ===================================

          if (
            typeof acknowledgement ===
            "function"
          ) {
            acknowledgement({
              success: true,
              message:
                communityMessage
            });
          }

        } catch (error) {

          console.error(
            "COMMUNITY MESSAGE ERROR:",
            error
          );

          if (
            typeof acknowledgement ===
            "function"
          ) {
            acknowledgement({
              success: false,
              message:
                "Unable to send message."
            });
          }

          socket.emit(
            "community-message-error",
            {
              message:
                "Unable to send message."
            }
          );
        }
      }
    );

    // =======================================
    // DISCONNECT
    // =======================================

    socket.on(
      "disconnect",
      (reason) => {

        const disconnectedUser =
          communityUsers.get(
            socket.id
          );

        console.log(
          "========================================="
        );

        console.log(
          "COMMUNITY USER DISCONNECTED"
        );

        console.log(
          "User:",
          disconnectedUser?.name ||
          socket.id
        );

        console.log(
          "Reason:",
          reason
        );

        console.log(
          "========================================="
        );

        communityUsers.delete(
          socket.id
        );

        // ===================================
        // UPDATE ONLINE COUNT
        // ===================================

        io.emit(
          "community-online-count",
          communityUsers.size
        );

        // ===================================
        // UPDATE ONLINE USERS
        // ===================================

        io.emit(
          "community-users",
          Array.from(
            communityUsers.values()
          ).map(
            (item) => ({
              id: item.id,
              name: item.name
            })
          )
        );
      }
    );
  }
);

// =========================================
// SERVER TEST
// =========================================

app.get(
  "/api/server-test",
  (req, res) => {

    res.status(200).json({

      message:
        "BusGo server is working correctly.",

      socket:
        "Socket.IO is enabled.",

      community:
        "Community chat is enabled.",

      time:
        new Date().toISOString()
    });
  }
);

// =========================================
// LOAD ROUTES
// =========================================

const authRoutes =
  require("./routes/authRoutes");

const bookingRoutes =
  require("./routes/bookingRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const versionRoutes =
  require("./routes/versionRoutes");

// =========================================
// API ROUTES
// =========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/bookings",
  bookingRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/version",
  versionRoutes
);

// =========================================
// AUTH ROUTE TEST
// =========================================

app.post(
  "/api/auth/route-test",
  (req, res) => {

    res.status(200).json({

      message:
        "Authentication route system is working.",

      endpoint:
        "/api/auth/route-test"
    });
  }
);

// =========================================
// ROOT
// =========================================

app.get(
  "/",
  (req, res) => {

    res.send(
      "BusGo API Server Running - Socket.IO Enabled"
    );
  }
);

// =========================================
// 404 HANDLER
// =========================================

app.use(
  (req, res) => {

    console.log(
      "========================================="
    );

    console.log(
      "404 ROUTE NOT FOUND"
    );

    console.log(
      "METHOD:",
      req.method
    );

    console.log(
      "URL:",
      req.originalUrl
    );

    console.log(
      "========================================="
    );

    res.status(404).json({

      message:
        "API route not found",

      path:
        req.originalUrl
    });
  }
);

// =========================================
// ERROR HANDLER
// =========================================

app.use(
  (err, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    if (
      err.message &&
      err.message.startsWith("CORS blocked")
    ) {
      return res.status(403).json({
        message:
          "CORS policy blocked this request."
      });
    }

    res.status(500).json({

      message:
        "Internal server error."
    });
  }
);

// =========================================
// START SERVER
// =========================================

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "========================================="
    );

    console.log(
      `BusGo server running on port ${PORT}`
    );

    console.log(
      `Socket.IO running on port ${PORT}`
    );

    console.log(
      `Community socket: http://localhost:${PORT}`
    );

    console.log(
      "========================================="
    );

    console.log(
      "WhatsApp OTP endpoint:"
    );

    console.log(
      `POST http://localhost:${PORT}/api/auth/send-whatsapp-otp`
    );

    console.log(
      "========================================="
    );
  }
);