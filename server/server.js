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

console.log(
  "PORT:",
  process.env.PORT
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
// CORS CONFIGURATION
// =========================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://okocaesar-group2internship.vercel.app"
];


const corsOptions = {

  origin: function(origin, callback) {


    // Allow requests without origin
    // (Postman, mobile apps, server requests)

    if (!origin) {

      return callback(null, true);

    }


    if (allowedOrigins.includes(origin)) {

      return callback(null, true);

    }


    console.log(
      "BLOCKED BY CORS:",
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
    "Authorization"
  ]

};


// Apply CORS

app.use(cors(corsOptions));


// Handle preflight

// app.options(
//   "*",
//   cors(corsOptions)
// );


// JSON parser

app.use(
  express.json()
);



// =========================================
// SERVER TEST
// =========================================

app.get(
  "/api/server-test",
  (req,res)=>{

    res.status(200).json({

      message:
      "BusGo server is working correctly.",

      time:
      new Date().toISOString()

    });

  }
);



// =========================================
// ROUTES
// =========================================


app.use(
  "/api/auth",
  require("./routes/authRoutes")
);


app.use(
  "/api/bookings",
  require("./routes/bookingRoutes")
);


app.use(
  "/api/payments",
  require("./routes/paymentRoutes")
);


app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);


app.use(
  "/api/admin",
  require("./routes/adminRoutes")
);



// =========================================
// ROOT
// =========================================

app.get(
  "/",
  (req,res)=>{

    res.send(
      "BusGo API Server Running"
    );

  }
);



// =========================================
// 404
// =========================================

app.use(
  (req,res)=>{

    console.log(
      "404:",
      req.method,
      req.originalUrl
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
  (err,req,res,next)=>{


    console.error(
      "SERVER ERROR:",
      err
    );


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


app.listen(
  PORT,
  ()=>{

    console.log(
      "========================================="
    );

    console.log(
      `BusGo server running on port ${PORT}`
    );

    console.log(
      "========================================="
    );

  }
);