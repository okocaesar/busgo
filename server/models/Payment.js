const mongoose = require("mongoose");


const paymentSchema = new mongoose.Schema(

{

    userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true

    },


    bookingId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Booking",

        required: true

    },


    transactionId: {

        type: String,

        required: true,

        unique: true

    },


    amount: {

        type: Number,

        required: true

    },


    currency: {

        type: String,

        default: "XAF"

    },


    paymentMethod: {

        type: String,

        enum: [

            "MTN Mobile Money",

            "Orange Money",

            "Bank Card"

        ],

        required: true

    },


    status: {

        type: String,

        enum: [

            "Pending",

            "Paid",

            "Failed",

            "Refunded"

        ],

        default: "Pending"

    },


    phoneNumber: {

        type: String

    },


    paymentDate: {

        type: Date,

        default: Date.now

    }


},

{

timestamps:true

}


);



module.exports =
mongoose.model(
"Payment",
paymentSchema
);