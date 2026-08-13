const nodemailer = require("nodemailer");

// =========================================
// EMAIL TRANSPORTER
// =========================================
//
// Configure these values in your backend
// .env file.
//
// Example:
//
// EMAIL_HOST=smtp.gmail.com
// EMAIL_PORT=587
// EMAIL_USER=your@email.com
// EMAIL_PASSWORD=your-app-password
//
// =========================================

const transporter = nodemailer.createTransport({

  host:
    process.env.EMAIL_HOST ||
    "smtp.gmail.com",

  port:
    Number(
      process.env.EMAIL_PORT || 587
    ),

  secure:
    String(
      process.env.EMAIL_SECURE || "false"
    ).toLowerCase() === "true",

  auth: {

    user:
      process.env.EMAIL_USER,

    pass:
      process.env.EMAIL_PASSWORD

  }

});


// =========================================
// VERIFY EMAIL CONNECTION
// =========================================

const verifyEmailConnection = () => {

  transporter.verify(
    (error) => {

      if (error) {

        console.error(
          "EMAIL SERVER CONNECTION ERROR:",
          error.message
        );

        return;

      }

      console.log(
        "EMAIL SERVER READY"
      );

    }
  );

};


// =========================================
// SEND BOOKING TICKET EMAIL
// =========================================

const sendBookingTicketEmail = async ({
  userName,
  userEmail,
  ticketNumber,
  from,
  to,
  travelDate,
  passengerName,
  passengerPhone,
  busName,
  seats,
  totalPrice,
  discount,
  paymentMethod,
  paymentStatus
}) => {

  // =========================================
  // VALIDATE EMAIL
  // =========================================

  if (
    !userEmail ||
    !userEmail.trim()
  ) {

    throw new Error(
      "User email is required to send ticket email."
    );

  }


  // =========================================
  // NORMALIZE SEATS
  // =========================================

  const seatList =
    Array.isArray(seats)
      ? seats.join(", ")
      : String(seats || "");


  // =========================================
  // FORMAT AMOUNTS
  // =========================================

  const formattedTotalPrice =
    Number(
      totalPrice || 0
    ).toLocaleString("en-US");


  const formattedDiscount =
    Number(
      discount || 0
    ).toLocaleString("en-US");


  // =========================================
  // EMAIL SUBJECT
  // =========================================

  const subject =
    `BusGo Ticket Confirmed - ${ticketNumber}`;


  // =========================================
  // EMAIL HTML
  // =========================================

  const html = `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    BusGo Ticket Confirmation
  </title>

</head>


<body
  style="
    margin:0;
    padding:0;
    background:#f4f7f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#222;
  "
>

  <div
    style="
      max-width:650px;
      margin:30px auto;
      background:#ffffff;
      border-radius:12px;
      overflow:hidden;
      box-shadow:0 4px 15px rgba(0,0,0,0.08);
    "
  >

    <!-- HEADER -->

    <div
      style="
        background:#0b5ed7;
        padding:25px;
        text-align:center;
        color:white;
      "
    >

      <h1
        style="
          margin:0;
          font-size:28px;
        "
      >
        BUSGO
      </h1>

      <p
        style="
          margin:8px 0 0;
          font-size:15px;
        "
      >
        Ticket Confirmation
      </p>

    </div>


    <!-- CONTENT -->

    <div
      style="
        padding:30px;
      "
    >

      <h2
        style="
          margin-top:0;
          color:#222;
        "
      >
        Hello ${userName || "BusGo Customer"} 👋
      </h2>


      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Your BusGo ticket has been successfully
        created and confirmed.
      </p>


      <!-- TICKET NUMBER -->

      <div
        style="
          background:#f0f6ff;
          border-left:5px solid #0b5ed7;
          padding:15px;
          margin:20px 0;
        "
      >

        <strong>
          Ticket Number
        </strong>

        <div
          style="
            font-size:22px;
            font-weight:bold;
            margin-top:5px;
            color:#0b5ed7;
          "
        >
          ${ticketNumber}
        </div>

      </div>


      <!-- TRIP DETAILS -->

      <h3>
        Trip Details
      </h3>


      <table
        width="100%"
        cellpadding="8"
        cellspacing="0"
        style="
          border-collapse:collapse;
          font-size:14px;
        "
      >

        <tr>
          <td>
            <strong>From</strong>
          </td>

          <td>
            ${from}
          </td>
        </tr>


        <tr>
          <td>
            <strong>To</strong>
          </td>

          <td>
            ${to}
          </td>
        </tr>


        <tr>
          <td>
            <strong>Travel Date</strong>
          </td>

          <td>
            ${travelDate}
          </td>
        </tr>


        <tr>
          <td>
            <strong>Bus</strong>
          </td>

          <td>
            ${busName}
          </td>
        </tr>


        <tr>
          <td>
            <strong>Seat(s)</strong>
          </td>

          <td>
            ${seatList}
          </td>
        </tr>

      </table>


      <!-- PASSENGER -->

      <h3
        style="
          margin-top:25px;
        "
      >
        Passenger Details
      </h3>


      <table
        width="100%"
        cellpadding="8"
        cellspacing="0"
        style="
          border-collapse:collapse;
          font-size:14px;
        "
      >

        <tr>

          <td>
            <strong>Name</strong>
          </td>

          <td>
            ${passengerName}
          </td>

        </tr>


        <tr>

          <td>
            <strong>Phone</strong>
          </td>

          <td>
            ${passengerPhone || "Not provided"}
          </td>

        </tr>

      </table>


      <!-- PAYMENT -->

      <h3
        style="
          margin-top:25px;
        "
      >
        Payment Information
      </h3>


      <table
        width="100%"
        cellpadding="8"
        cellspacing="0"
        style="
          border-collapse:collapse;
          font-size:14px;
        "
      >

        <tr>

          <td>
            <strong>Ticket Value</strong>
          </td>

          <td>
            XAF ${formattedTotalPrice}
          </td>

        </tr>


        <tr>

          <td>
            <strong>Discount</strong>
          </td>

          <td>
            XAF ${formattedDiscount}
          </td>

        </tr>


        <tr>

          <td>
            <strong>Payment Method</strong>
          </td>

          <td>
            ${paymentMethod}
          </td>

        </tr>


        <tr>

          <td>
            <strong>Payment Status</strong>
          </td>

          <td>
            ${paymentStatus}
          </td>

        </tr>

      </table>


      <!-- CASH NOTICE -->

      <div
        style="
          margin-top:25px;
          padding:15px;
          background:#fff8e6;
          border-radius:8px;
          font-size:14px;
          line-height:1.5;
        "
      >

        <strong>
          Cash Payment
        </strong>

        <br>

        This ticket was registered by BusGo
        administration as a cash payment.

        No online payment was required.

      </div>


      <!-- FOOTER MESSAGE -->

      <p
        style="
          margin-top:30px;
          font-size:14px;
          line-height:1.6;
        "
      >

        Please keep your ticket number safe and
        present your ticket when required during
        your journey.

      </p>


      <p
        style="
          font-size:14px;
        "
      >

        Thank you for travelling with
        <strong>BusGo</strong>.

      </p>

    </div>


    <!-- FOOTER -->

    <div
      style="
        background:#f4f7f9;
        padding:20px;
        text-align:center;
        font-size:12px;
        color:#777;
      "
    >

      BusGo Ticket Reservation System

      <br>

      This is an automated email.
      Please do not reply directly to this message.

    </div>

  </div>

</body>

</html>

  `;


  // =========================================
  // PLAIN TEXT VERSION
  // =========================================

  const text = `

BUSGO - TICKET CONFIRMATION

Hello ${userName || "BusGo Customer"},

Your BusGo ticket has been successfully created and confirmed.

Ticket Number:
${ticketNumber}

TRIP DETAILS

From: ${from}
To: ${to}
Travel Date: ${travelDate}
Bus: ${busName}
Seat(s): ${seatList}

PASSENGER

Name: ${passengerName}
Phone: ${passengerPhone || "Not provided"}

PAYMENT

Ticket Value: XAF ${formattedTotalPrice}
Discount: XAF ${formattedDiscount}
Payment Method: ${paymentMethod}
Payment Status: ${paymentStatus}

This ticket was registered by BusGo administration as a cash payment.

No online payment was required.

Please keep your ticket number safe.

Thank you for travelling with BusGo.

`;


  // =========================================
  // SEND EMAIL
  // =========================================

  const mailOptions = {

    from:
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER,

    to:
      userEmail.trim(),

    subject,

    text,

    html

  };


  const info =
    await transporter.sendMail(
      mailOptions
    );


  console.log(
    "BOOKING TICKET EMAIL SENT:",
    {
      ticketNumber,
      userEmail,
      messageId:
        info.messageId
    }
  );


  return info;

};


// =========================================
// EXPORT
// =========================================

module.exports = {

  transporter,

  verifyEmailConnection,

  sendBookingTicketEmail

};