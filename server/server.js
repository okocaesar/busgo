const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

dotenv.config();

// =========================================
// BUSGO SERVER STARTING
// =========================================

console.log("=========================================");
console.log("BUSGO SERVER STARTING");
console.log("=========================================");

console.log(
  "PORT:",
  process.env.PORT || 5000
);

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
//
// FRONTEND_URL should be added to Render
// environment variables.
//
// Example:
//
// FRONTEND_URL=https://your-vercel-app.vercel.app
//
// Localhost URLs are always allowed.
//

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:10000",
  "http://localhost:10001",

  "http://127.0.0.1:3000",
  "http://127.0.0.1:10000",
  "http://127.0.0.1:10001"
];

// Add production frontend URL from Render ENV
if (process.env.FRONTEND_URL) {
  const productionOrigins =
    process.env.FRONTEND_URL
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

  allowedOrigins.push(
    ...productionOrigins
  );
}

// Remove duplicates
const uniqueOrigins = [
  ...new Set(allowedOrigins)
];

console.log(
  "Allowed frontend origins:",
  uniqueOrigins
);

// =========================================
// CORS OPTIONS
// =========================================

const corsOptions = {
  origin: function (origin, callback) {

    // Requests without Origin
    // are allowed.
    //
    // Useful for:
    // - Render health checks
    // - Postman
    // - server-to-server requests
    // - direct API testing

    if (!origin) {
      return callback(null, true);
    }

    if (
      uniqueOrigins.includes(origin)
    ) {

      console.log(
        "CORS ALLOWED:",
        origin
      );

      return callback(
        null,
        true
      );
    }

    // =====================================
    // OPTIONAL VERCEL PREVIEW SUPPORT
    // =====================================
    //
    // Allows Vercel preview deployments
    // belonging to the BusGo project.
    //
    // This prevents CORS problems when
    // Vercel generates a new deployment URL.
    //

    if (
      origin.endsWith(
        ".vercel.app"
      )
    ) {

      console.log(
        "CORS ALLOWED VERCEL:",
        origin
      );

      return callback(
        null,
        true
      );
    }

    console.log(
      "CORS BLOCKED:",
      origin
    );

    return callback(
      null,
      false
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
    "Pragma"
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
//
// IMPORTANT:
//
// Do NOT use:
//
// app.options("*", cors(corsOptions))
//
// Express 5 + path-to-regexp can crash
// with wildcard route paths.
//

app.use(
  cors(corsOptions)
);

// =========================================
// BODY PARSER
// =========================================

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

// =========================================
// SOCKET.IO
// =========================================

const io = new Server(
  server,
  {
    cors: {
      origin: function (
        origin,
        callback
      ) {

        if (!origin) {
          return callback(
            null,
            true
          );
        }

        if (
          uniqueOrigins.includes(
            origin
          )
        ) {
          return callback(
            null,
            true
          );
        }

        // Allow Vercel preview URLs
        if (
          origin.endsWith(
            ".vercel.app"
          )
        ) {
          return callback(
            null,
            true
          );
        }

        return callback(
          null,
          false
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
  }
);


// =========================================
// MAKE SOCKET.IO AVAILABLE TO CONTROLLERS
// =========================================

app.set("io", io);

console.log("Socket.IO instance attached to Express.");

// =========================================
// COMMUNITY DATA
// =========================================

const communityUsers =
  new Map();

const communityMessages =
  [];

const MAX_COMMUNITY_MESSAGES =
  200;

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

      if (
        !process.env.JWT_SECRET
      ) {

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

      socket.user =
        decoded;

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

      // =======================================
// PRIVATE USER NOTIFICATION ROOM
// =======================================

if (userId) {

  const notificationRoom =
    `user_${userId}`;

  socket.join(
    notificationRoom
  );

  console.log(
    "USER JOINED NOTIFICATION ROOM:",
    notificationRoom
  );
}

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
              messageData.message ||
              ""
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
          // ACKNOWLEDGE SENDER
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

      success: true,

      message:
        "BusGo server is working correctly.",

      socket:
        "Socket.IO is enabled.",

      community:
        "Community chat is enabled.",

      environment:
        process.env.NODE_ENV ||
        "production",

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

      success: true,

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

    res.status(200).send(
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

      success: false,

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
      err &&
      err.message &&
      err.message
        .toLowerCase()
        .includes("cors")
    ) {

      return res.status(403).json({

        success: false,

        message:
          "Request blocked by CORS policy."
      });
    }

    res.status(500).json({

      success: false,

      message:
        "Internal server error."
    });
  }
);

// =========================================
// START SERVER
// IMPORTANT:
// DO NOT USE app.listen()
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
      "Community socket: Socket.IO enabled"
    );

    console.log(
      "========================================="
    );

    console.log(
      "WhatsApp OTP endpoint:"
    );

    console.log(
      `/api/auth/send-whatsapp-otp`
    );

    console.log(
      "========================================="
    );
  }
);