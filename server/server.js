const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


dotenv.config();

console.log("PORT:", process.env.PORT);
console.log(
  "JWT_SECRET loaded:",
  process.env.JWT_SECRET ? "YES" : "NO"
);


require("./config/database");


const app = express();


app.use(cors());

app.use(express.json());



// Authentication routes

app.use(
"/api/auth",
require("./routes/authRoutes")
);

// Booking routes

app.use(
    "/api/bookings",
    require("./routes/bookingRoutes")
);

// Admin route

app.use(
  "/api/admin",
  require("./routes/adminRoutes")
);



app.get("/",(req,res)=>{

    res.send(
        "BusGo API Server Running"
    );

});



const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(`Server running on port ${PORT}`);
  }
);