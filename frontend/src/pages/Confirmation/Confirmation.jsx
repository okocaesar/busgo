import React, { useState } from "react";
import axios from "axios";
import {
  useLocation,
  NavLink,
  useNavigate
} from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { API_URL } from "../../api";

import "./Confirmation.css";

function Confirmation() {

  const navigate = useNavigate();
  const location = useLocation();

  const booking = location.state;

  // =========================================
  // TICKET NUMBER
  // =========================================

  const [ticketNumber] = useState(() => {

    return (
      "BG-" +
      Math.floor(
        100000 +
        Math.random() * 900000
      )
    );

  });


  // =========================================
  // SAVING STATE
  // =========================================

  const [saving, setSaving] = useState(false);


  // =========================================
  // PRICE VALUES
  // =========================================

  const totalPrice = Number(
    booking?.totalPrice ??
    booking?.total ??
    0
  );

  const discount = Number(
    booking?.discount ?? 0
  );

  const discountPercentage = Number(
    booking?.discountPercentage ?? 0
  );

  const totalPayment = Number(
    booking?.totalPayment ??
    Math.max(
      0,
      totalPrice - discount
    )
  );


  // =========================================
  // QR CODE DATA
  // =========================================

  const qrData = `
BUSGO TICKET

Ticket: ${ticketNumber}

Passenger: ${booking?.name || ""}

Phone: ${booking?.phone || ""}

Route:
${booking?.from || ""} → ${booking?.to || ""}

Bus:
${booking?.busType || ""}

Seats:
${booking?.seats?.join(", ") || ""}

Date:
${booking?.date || ""}

Total Price:
XAF ${totalPrice.toLocaleString("en-GB")}

Discount:
XAF ${discount.toLocaleString("en-GB")}

Total Payment:
XAF ${totalPayment.toLocaleString("en-GB")}

Payment Method:
${booking?.paymentMethod || ""}
`;


  // =========================================
  // CONFIRM BOOKING
  // =========================================

  const confirmBooking = async () => {

    // =========================================
    // PREVENT DOUBLE CLICK
    // =========================================

    if (saving) {
      return;
    }


    // =========================================
    // CHECK BOOKING DATA
    // =========================================

    if (!booking) {

      alert(
        "No booking information found."
      );

      navigate("/booking");

      return;

    }


    // =========================================
    // GET CURRENT USER
    // =========================================

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );


    if (!currentUser) {

      alert(
        "Please login before confirming your booking."
      );

      navigate("/login");

      return;

    }


    // =========================================
    // GET AUTH TOKEN
    // =========================================

    const authToken =
      localStorage.getItem("authToken");


    if (!authToken) {

      alert(
        "Your login session has expired. Please login again."
      );

      navigate("/login");

      return;

    }


    // =========================================
    // VALIDATE BOOKING INFORMATION
    // =========================================

    if (!booking.from || !booking.to) {

      alert(
        "Booking route information is missing."
      );

      return;

    }


    // =========================================
    // ROUTE ID
    //
    // IMPORTANT:
    // Booking.jsx sends routeId.
    // The backend also independently verifies
    // the route using from + to.
    // =========================================

    if (!booking.routeId) {

      alert(
        "Route information is missing. Please return to booking and try again."
      );

      return;

    }


    // =========================================
    // BUS
    // =========================================

    if (!booking.busType) {

      alert(
        "Bus type is missing."
      );

      return;

    }


    // =========================================
    // BUS ID
    //
    // IMPORTANT:
    // Booking.jsx sends busId.
    // The backend independently resolves
    // the bus as an additional protection.
    // =========================================

    if (!booking.busId) {

      alert(
        "Bus information is missing. Please return to booking and try again."
      );

      return;

    }


    // =========================================
    // SEATS
    // =========================================

    if (
      !Array.isArray(booking.seats) ||
      booking.seats.length === 0
    ) {

      alert(
        "No seats have been selected."
      );

      return;

    }


    // =========================================
    // NORMALIZE SEATS
    // =========================================

    const normalizedSeats = [
      ...new Set(

        booking.seats

          .map((seat) => {

            if (
              typeof seat === "object" &&
              seat !== null
            ) {

              return Number(
                seat.seat ??
                seat.seatNumber ??
                seat.number
              );

            }

            return Number(seat);

          })

          .filter(
            (seat) =>
              Number.isInteger(seat) &&
              seat > 0
          )

      )
    ];


    if (normalizedSeats.length === 0) {

      alert(
        "No valid seats have been selected."
      );

      return;

    }


    // =========================================
    // DATE
    // =========================================

    if (!booking.date) {

      alert(
        "Travel date is missing."
      );

      return;

    }


    // =========================================
    // PASSENGER NAME
    // =========================================

    if (!booking.name) {

      alert(
        "Passenger name is missing."
      );

      return;

    }


    // =========================================
    // PHONE
    // =========================================

    if (!booking.phone) {

      alert(
        "Passenger phone is missing."
      );

      return;

    }


    // =========================================
    // PAYMENT METHOD
    // =========================================

    if (!booking.paymentMethod) {

      alert(
        "Payment method is missing."
      );

      return;

    }


    // =========================================
    // PAYMENT AMOUNT
    // =========================================

    if (totalPayment <= 0) {

      alert(
        "Invalid payment amount."
      );

      return;

    }


    try {

      setSaving(true);


      // =========================================
      // DEBUG
      // =========================================

      console.log(
        "========================================="
      );

      console.log(
        "BUSGO CONFIRMATION"
      );

      console.log(
        "========================================="
      );

      console.log(
        "Booking data:",
        booking
      );

      console.log(
        "Route ID:",
        booking.routeId
      );

      console.log(
        "Bus ID:",
        booking.busId
      );

      console.log(
        "Seats:",
        normalizedSeats
      );

      console.log(
        "Date:",
        booking.date
      );


      // =========================================
      // STEP 1
      // CREATE BOOKING
      // =========================================

      console.log(
        "========================================="
      );

      console.log(
        "CREATING BUSGO BOOKING"
      );

      console.log(
        "========================================="
      );


      const bookingResponse =
        await axios.post(

          `${API_URL}/api/bookings`,

          {

            // =====================================
            // TICKET
            // =====================================

            ticketNumber:
              ticketNumber,


            // =====================================
            // USER
            // =====================================

            userId:
              currentUser.id,


            // =====================================
            // PASSENGER
            // =====================================

            name:
              booking.name,

            phone:
              booking.phone,


            // =====================================
            // ROUTE
            // =====================================

            from:
              booking.from,

            to:
              booking.to,

            routeId:
              booking.routeId,


            // =====================================
            // BUS
            // =====================================

            busType:
              booking.busType,

            busId:
              booking.busId,


            // =====================================
            // SEATS
            // =====================================

            seats:
              normalizedSeats,


            // =====================================
            // PASSENGERS
            // =====================================

            passengers:
              Number(
                booking.passengers ??
                normalizedSeats.length
              ),


            // =====================================
            // DATE
            // =====================================

            date:
              booking.date,


            // =====================================
            // PRICE
            // =====================================

            totalPrice:
              totalPrice,

            discountPercentage:
              discountPercentage,

            discount:
              discount,

            totalPayment:
              totalPayment,


            // =====================================
            // OFFER
            // =====================================

            offerId:
              booking.offerId || null,

            offerTitle:
              booking.offerTitle ||
              "No Offer",


            // =====================================
            // PAYMENT
            // =====================================

            paymentStatus:
              "Successful",

            paymentMethod:
              booking.paymentMethod,

            paymentDate:
              booking.paymentDate ||
              new Date().toISOString()

          }

        );


      console.log(
        "BOOKING RESPONSE:",
        bookingResponse.data
      );


      // =========================================
      // GET BOOKING ID
      // =========================================

      const bookingId =
        bookingResponse.data?.bookingId;


      if (!bookingId) {

        throw new Error(
          "Booking was created but the server did not return a booking ID."
        );

      }


      console.log(
        "========================================="
      );

      console.log(
        "BOOKING CREATED SUCCESSFULLY"
      );

      console.log(
        "Booking ID:",
        bookingId
      );

      console.log(
        "========================================="
      );


      // =========================================
      // STEP 2
      // CREATE PAYMENT RECORD
      // =========================================

      console.log(
        "========================================="
      );

      console.log(
        "CREATING PAYMENT RECORD"
      );

      console.log(
        "========================================="
      );


      const paymentResponse =
        await axios.post(

          `${API_URL}/api/payments`,

          {

            // =====================================
            // USER
            // =====================================

            userId:
              currentUser.id,


            // =====================================
            // BOOKING
            // =====================================

            bookingId:
              bookingId,


            // =====================================
            // PAYMENT AMOUNT
            // =====================================

            amount:
              totalPayment,


            // =====================================
            // CURRENCY
            // =====================================

            currency:
              "XAF",


            // =====================================
            // PAYMENT METHOD
            // =====================================

            paymentMethod:
              booking.paymentMethod,


            // =====================================
            // PHONE
            // =====================================

            phoneNumber:
              booking.phone

          },

          {

            headers: {

              Authorization:
                `Bearer ${authToken}`

            }

          }

        );


      console.log(
        "PAYMENT RESPONSE:",
        paymentResponse.data
      );


      // =========================================
      // SUCCESS
      // =========================================

      console.log(
        "========================================="
      );

      console.log(
        "BOOKING + PAYMENT SUCCESSFUL"
      );

      console.log(
        "========================================="
      );


      alert(
        "Booking and payment confirmed successfully!"
      );


      // =========================================
      // GO TO DASHBOARD
      // =========================================

      navigate(
        "/dashboard"
      );


    } catch (error) {

      // =========================================
      // ERROR LOGGING
      // =========================================

      console.error(
        "========================================="
      );

      console.error(
        "BUSGO BOOKING/PAYMENT ERROR"
      );

      console.error(
        "========================================="
      );

      console.error(
        "Error message:",
        error.message
      );

      console.error(
        "HTTP status:",
        error.response?.status
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      console.error(
        "Full error:",
        error
      );


      // =========================================
      // SEAT CONFLICT — HTTP 409
      //
      // THIS IS THE IMPORTANT PART.
      //
      // If another user booked the same seat
      // between the availability check and this
      // confirmation request, the backend returns:
      //
      // 409 Conflict
      //
      // The booking is NOT created.
      // =========================================

      if (
        error.response?.status === 409
      ) {

        const conflictMessage =
          error.response.data?.message ||
          "One or more selected seats have already been booked.";

        const conflictSeats =
          error.response.data?.bookedSeats || [];


        if (
          Array.isArray(conflictSeats) &&
          conflictSeats.length > 0
        ) {

          alert(
            `${conflictMessage}\n\nBooked seat(s): ${conflictSeats.join(", ")}\n\nPlease return to the booking page and select another seat.`
          );

        } else {

          alert(
            `${conflictMessage}\n\nPlease return to the booking page and select another seat.`
          );

        }


        return;

      }


      // =========================================
      // SERVER ERROR
      // =========================================

      if (error.response) {

        const serverMessage =
          error.response.data?.message ||
          "Unable to save booking.";


        const serverError =
          error.response.data?.error ||
          "";


        if (serverError) {

          alert(
            `${serverMessage}\n\n${serverError}`
          );

        } else {

          alert(
            serverMessage
          );

        }

      }


      // =========================================
      // NETWORK ERROR
      // =========================================

      else {

        alert(
          "Unable to connect to the BusGo server."
        );

      }

    } finally {

      setSaving(false);

    }

  };


  // =========================================
  // DOWNLOAD TICKET
  // =========================================

  const downloadTicket = () => {

    const ticket =
      document.getElementById(
        "ticket"
      );


    if (!ticket) {

      alert(
        "Ticket could not be found."
      );

      return;

    }


    html2canvas(
      ticket,
      {
        scale: 2,
        useCORS: true
      }
    )

      .then((canvas) => {

        const imgData =
          canvas.toDataURL(
            "image/png"
          );


        const pdf =
          new jsPDF(
            "p",
            "mm",
            "a4"
          );


        const width = 190;


        const height =
          (
            canvas.height *
            width
          ) /
          canvas.width;


        pdf.addImage(
          imgData,
          "PNG",
          10,
          10,
          width,
          height
        );


        pdf.save(
          `BusGo-${ticketNumber}.pdf`
        );

      })

      .catch((error) => {

        console.error(
          "PDF download error:",
          error
        );

        alert(
          "Unable to download the ticket."
        );

      });

  };


  // =========================================
  // NO BOOKING
  // =========================================

  if (!booking) {

    return (

      <>

        <Navbar />


        <div className="empty-booking">

          <h2>
            No booking found
          </h2>


          <NavLink to="/booking">

            Make Booking

          </NavLink>

        </div>


        <Footer />

      </>

    );

  }


  // =========================================
  // PAGE
  // =========================================

  return (

    <>

      <Navbar />


      <section className="ticket-page">


        {/* =====================================
            TICKET
        ===================================== */}

        <div
          className="ticket"
          id="ticket"
        >


          {/* =====================================
              HEADER
          ===================================== */}

          <div className="ticket-header">

            <h1>
              BUSGO
            </h1>

            <p>
              BUS TRANSPORT RESERVATION
            </p>

          </div>


          {/* =====================================
              TICKET NUMBER
          ===================================== */}

          <div className="ticket-number">

            Ticket No:

            <strong>
              {ticketNumber}
            </strong>

          </div>


          {/* =====================================
              ROUTE
          ===================================== */}

          <div className="route-box">

            <div>

              <small>
                FROM
              </small>

              <h2>
                {booking.from}
              </h2>

            </div>


            <span>
              →
            </span>


            <div>

              <small>
                TO
              </small>

              <h2>
                {booking.to}
              </h2>

            </div>

          </div>


          {/* =====================================
              DETAILS
          ===================================== */}

          <div className="details">


            {/* PASSENGER */}

            <p>

              <span>
                Passenger
              </span>

              {booking.name}

            </p>


            {/* PHONE */}

            <p>

              <span>
                Phone
              </span>

              {booking.phone}

            </p>


            {/* BUS */}

            <p>

              <span>
                Bus Type
              </span>

              {booking.busType}

            </p>


            {/* SEATS */}

            <p>

              <span>
                Seats
              </span>

              {booking.seats?.join(", ") ||
                "Not selected"}

            </p>


            {/* PASSENGERS */}

            <p>

              <span>
                Passengers
              </span>

              {booking.passengers ??
                booking.seats?.length ??
                0}

            </p>


            {/* DATE */}

            <p>

              <span>
                Travel Date
              </span>

              {booking.date}

            </p>


            {/* PAYMENT */}

            <p>

              <span>
                Payment
              </span>

              {booking.paymentMethod}

            </p>


            {/* OFFER */}

            {booking.offerTitle &&
              booking.offerTitle !==
                "No Offer" && (

              <p>

                <span>
                  Offer
                </span>

                <strong
                  className="offer-used"
                >

                  {booking.offerTitle}


                  {discountPercentage > 0 &&
                    ` (${discountPercentage}% OFF)`}

                </strong>

              </p>

            )}


            {/* STATUS */}

            <p>

              <span>
                Status
              </span>

              <span className="paid">

                Successful ✓

              </span>

            </p>


          </div>


          {/* =====================================
              PRICE BREAKDOWN
          ===================================== */}

          <div className="ticket-price-breakdown">


            {/* TOTAL PRICE */}

            <div className="ticket-price-row">

              <span>
                Total Price
              </span>

              <strong>

                XAF{" "}

                {totalPrice.toLocaleString(
                  "en-GB"
                )}

              </strong>

            </div>


            {/* DISCOUNT */}

            <div
              className="
                ticket-price-row
                ticket-discount
              "
            >

              <span>

                Discount

                {discountPercentage > 0 &&
                  ` (${discountPercentage}%)`}

              </span>


              <strong>

                - XAF{" "}

                {discount.toLocaleString(
                  "en-GB"
                )}

              </strong>

            </div>


            {/* DIVIDER */}

            <div
              className="
                ticket-price-divider
              "
            ></div>


            {/* FINAL PRICE */}

            <div
              className="
                ticket-final-price
              "
            >

              <span>
                TOTAL PAYMENT
              </span>


              <h2>

                XAF{" "}

                {totalPayment.toLocaleString(
                  "en-GB"
                )}

              </h2>

            </div>


          </div>


          {/* =====================================
              QR CODE
          ===================================== */}

          <div className="qr-box">

            <QRCodeCanvas

              value={qrData}

              size={120}

              bgColor="#ffffff"

              fgColor="#0b7d45"

            />

          </div>


          {/* =====================================
              THANK YOU
          ===================================== */}

          <p className="thank">

            Thank you for travelling with BusGo

          </p>


        </div>


        {/* =====================================
            ACTION BUTTONS
        ===================================== */}


        <button

          type="button"

          className="download-btn"

          onClick={downloadTicket}

        >

          Download Ticket PDF

        </button>


        <button

          type="button"

          className="print-btn"

          onClick={() =>
            window.print()
          }

        >

          Print Ticket

        </button>


        <button

          type="button"

          className="confirm-btn"

          onClick={confirmBooking}

          disabled={saving}

        >

          {saving
            ? "Saving Booking..."
            : "Confirm Booking"}

        </button>


      </section>


      <Footer />

    </>

  );

}

export default Confirmation;