const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


dotenv.config();
console.log(process.env.PORT);


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



app.listen(
process.env.PORT,
()=>{

console.log(
`Server running on port ${process.env.PORT}`
);

});