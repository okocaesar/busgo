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

  const [ticketNumber] = useState(
    "BG-" +
    Math.floor(
      100000 +
      Math.random() * 900000
    )
  );


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

Passenger: ${booking?.name}

Phone: ${booking?.phone}

Route:
${booking?.from} → ${booking?.to}

Bus:
${booking?.busType}

Seats:
${booking?.seats?.join(", ")}

Date:
${booking?.date}

Total Price:
XAF ${totalPrice.toLocaleString("en-GB")}

Discount:
XAF ${discount.toLocaleString("en-GB")}

Total Payment:
XAF ${totalPayment.toLocaleString("en-GB")}
`;


  // =========================================
  // CONFIRM BOOKING
  // =========================================

  const confirmBooking = async () => {

    // Prevent double clicking
    if (saving) {
      return;
    }


    // =========================================
    // GET CURRENT USER
    // =========================================

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser")
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


    try {

      setSaving(true);


      // =========================================
      // STEP 1
      // CREATE BOOKING
      // =========================================

      console.log(
        "================================="
      );

      console.log(
        "CREATING BUSGO BOOKING"
      );

      console.log(
        "================================="
      );


      const bookingResponse =
        await axios.post(

          `${API_URL}/api/bookings`,

          {

            // Ticket

            ticketNumber:


              ticketNumber,


            // User

            userId:
              currentUser.id,


            email:
              currentUser.email,


            // Passenger

            name:
              booking.name,


            phone:
              booking.phone,


            // Route

            from:
              booking.from,


            to:
              booking.to,


            // Bus

            busType:
              booking.busType,


            // Seats

            seats:
              booking.seats,


            // Travel date

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
              booking.paymentDate

          }

        );


      console.log(
        "BOOKING RESPONSE:",
        bookingResponse.data
      );


      // =========================================
      // GET CREATED BOOKING ID
      // =========================================

      const bookingId =
        bookingResponse.data?.bookingId;


      if (!bookingId) {

        throw new Error(
          "Booking was created but the server did not return a booking ID."
        );

      }


      console.log(
        "BOOKING CREATED SUCCESSFULLY"
      );

      console.log(
        "Booking ID:",
        bookingId
      );


      // =========================================
      // STEP 2
      // CREATE PAYMENT RECORD
      // =========================================

      console.log(
        "================================="
      );

      console.log(
        "CREATING PAYMENT RECORD"
      );

      console.log(
        "================================="
      );


      const paymentResponse =
        await axios.post(

          `${API_URL}/api/payments`,

          {

            // User

            userId:
              currentUser.id,


            // Booking

            bookingId:
              bookingId,


            // Amount

            amount:
              totalPayment,


            // Currency

            currency:
              "XAF",


            // Payment method

            paymentMethod:
              booking.paymentMethod,


            // Passenger phone

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
        "================================="
      );

      console.log(
        "BOOKING + PAYMENT SUCCESSFUL"
      );

      console.log(
        "================================="
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
        "================================="
      );

      console.error(
        "BUSGO BOOKING/PAYMENT ERROR"
      );

      console.error(
        "================================="
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

      // =========================================
      // STOP LOADING
      // =========================================

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

      return;

    }


    html2canvas(ticket)
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


            <p>

              <span>
                Passenger
              </span>

              {booking.name}

            </p>


            <p>

              <span>
                Phone
              </span>

              {booking.phone}

            </p>


            <p>

              <span>
                Bus Type
              </span>

              {booking.busType}

            </p>


            <p>

              <span>
                Seats
              </span>

              {booking.seats?.join(", ") ||
                "Not selected"}

            </p>


            <p>

              <span>
                Travel Date
              </span>

              {booking.date}

            </p>


            <p>

              <span>
                Payment
              </span>

              {booking.paymentMethod}

            </p>


            {/* =====================================
                OFFER
            ===================================== */}

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


            {/* =====================================
                STATUS
            ===================================== */}

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


            <div
              className="
                ticket-price-divider
              "
            ></div>


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


          <p className="thank">

            Thank you for travelling with BusGo

          </p>


        </div>


        {/* =====================================
            ACTION BUTTONS
        ===================================== */}


        <button

          className="download-btn"

          onClick={downloadTicket}

        >

          Download Ticket PDF

        </button>


        <button

          className="print-btn"

          onClick={() =>
            window.print()
          }

        >

          Print Ticket

        </button>


        <button

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