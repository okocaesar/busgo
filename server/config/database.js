const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const useSsl = process.env.DB_SSL === "true";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : undefined
});

db.getConnection((err, connection) => {
  if (err) {
    console.log(
      "Database connection failed:",
      err.message
    );

    return;
  }

  console.log("MySQL Connected Successfully");

  connection.release();
});

module.exports = db;