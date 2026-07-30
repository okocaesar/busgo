const mongoose = require("mongoose");


const bookingSchema = new mongoose.Schema({

userId:{

type:mongoose.Schema.Types.ObjectId,

ref:"User",

required:true

},


from:{

type:String,

required:true

},


to:{

type:String,

required:true

},


busType:{

type:String,

required:true

},


seats:[

String

],


travelDate:{

type:Date,

required:true

},


totalPrice:{

type:Number,

required:true

},


bookingStatus:{

type:String,

default:"Pending"

}


},

{

timestamps:true

}

);



module.exports =
mongoose.model(
"Booking",
bookingSchema
);