const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// =========================================
// DATABASE ENVIRONMENT
// =========================================

const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// =========================================
// SSL
// =========================================

const useSsl =
  process.env.DB_SSL === "true";

// =========================================
// ENVIRONMENT CHECK
// =========================================

console.log("=========================================");
console.log("MYSQL DATABASE CONFIGURATION");
console.log("=========================================");

console.log(
  "DB_HOST:",
  DB_HOST || "NOT SET"
);

console.log(
  "DB_PORT:",
  DB_PORT
);

console.log(
  "DB_USER:",
  DB_USER || "NOT SET"
);

console.log(
  "DB_NAME:",
  DB_NAME || "NOT SET"
);

console.log(
  "DB_SSL:",
  useSsl ? "ENABLED" : "DISABLED"
);

console.log("=========================================");

// =========================================
// REQUIRED ENVIRONMENT VARIABLES
// =========================================

if (
  !DB_HOST ||
  !DB_USER ||
  !DB_NAME
) {
  console.error(
    "WARNING: Required MySQL environment variables are missing."
  );

  console.error(
    "Required variables:"
  );

  console.error(
    "DB_HOST, DB_USER, DB_NAME"
  );
}

// =========================================
// MYSQL CONNECTION POOL
// =========================================
//
// A connection pool is required because
// Booking.js uses:
//
// db.query()
// db.getConnection()
//
// and transactions:
//
// beginTransaction()
// commit()
// rollback()
// release()
//
// =========================================

const db = mysql.createPool({

  host: DB_HOST,

  port: DB_PORT,

  user: DB_USER,

  password: DB_PASSWORD,

  database: DB_NAME,

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,

  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : undefined
});

// =========================================
// TEST DATABASE CONNECTION
// =========================================

db.getConnection(
  (err, connection) => {

    if (err) {

      console.error(
        "========================================="
      );

      console.error(
        "MYSQL CONNECTION FAILED"
      );

      console.error(
        "========================================="
      );

      console.error(
        "Error:",
        err.message
      );

      console.error(
        "Code:",
        err.code
      );

      console.error(
        "========================================="
      );

      return;
    }

    console.log(
      "========================================="
    );

    console.log(
      "MYSQL CONNECTED SUCCESSFULLY"
    );

    console.log(
      "Database:",
      DB_NAME
    );

    console.log(
      "Host:",
      DB_HOST
    );

    console.log(
      "========================================="
    );

    connection.release();
  }
);

// =========================================
// HANDLE POOL ERRORS
// =========================================

db.on(
  "error",
  (err) => {

    console.error(
      "MYSQL POOL ERROR:",
      err.message
    );

  }
);

// =========================================
// EXPORT DATABASE POOL
// =========================================

module.exports = db;