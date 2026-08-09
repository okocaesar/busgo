const mongoose = require("mongoose");


const paymentSchema = new mongoose.Schema(

  {

    // =========================================
    // USER
    // =========================================

    userId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true

    },


    // =========================================
    // BOOKING
    // =========================================

    bookingId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "Booking",

      required: true

    },


    // =========================================
    // TRANSACTION ID
    // =========================================

    transactionId: {

      type: String,

      required: true,

      unique: true,

      trim: true

    },


    // =========================================
    // PAYMENT AMOUNT
    // =========================================

    amount: {

      type: Number,

      required: true,

      min: 0

    },


    // =========================================
    // CURRENCY
    // =========================================

    currency: {

      type: String,

      default: "XAF",

      trim: true

    },


    // =========================================
    // PAYMENT METHOD
    // =========================================

    paymentMethod: {

      type: String,

      enum: [

        "MTN Mobile Money",

        "Orange Money",

        "Bank Card"

      ],

      required: true

    },


    // =========================================
    // PAYMENT STATUS
    // =========================================

    status: {

      type: String,

      enum: [

        "Pending",

        "Paid",

        "Failed",

        "Reversal Requested",

        "Reversed",

        "Refunded"

      ],

      default: "Pending"

    },


    // =========================================
    // PHONE NUMBER
    // =========================================

    phoneNumber: {

      type: String,

      trim: true

    },


    // =========================================
    // PAYMENT DATE
    // =========================================

    paymentDate: {

      type: Date,

      default: Date.now

    },


    // =========================================
    // REVERSAL REQUEST DATE
    // =========================================

    reversalRequestedAt: {

      type: Date,

      default: null

    },


    // =========================================
    // REVERSAL PROCESSED DATE
    // =========================================

    reversalProcessedAt: {

      type: Date,

      default: null

    },


    // =========================================
    // REVERSAL REASON
    // =========================================

    reversalReason: {

      type: String,

      default: "",

      trim: true,

      maxlength: 500

    },


    // =========================================
    // ADMIN REVERSAL DECISION
    // =========================================

    reversalDecision: {

      type: String,

      enum: [

        "Pending",

        "Accepted",

        "Denied",

        null

      ],

      default: null

    },


    // =========================================
    // ADMIN WHO PROCESSED REVERSAL
    // =========================================

    reversalProcessedBy: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null

    }

  },

  {

    timestamps: true

  }

);


module.exports =
  mongoose.model(
    "Payment",
    paymentSchema
  );