import React, { useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Confirmation.css";


function Confirmation() {

  const navigate = useNavigate();
  const location = useLocation();

  const booking = location.state;


  // =========================================
  // TICKET NUMBER
  // =========================================

  const [ticketNumber] = useState(
    "BG-" + Math.floor(100000 + Math.random() * 900000)
  );


  // =========================================
  // PRICE VALUES
  // =========================================

  const totalPrice = booking?.total ?? 0;

  const discount = booking?.discount ?? 0;

  const discountPercentage =
    booking?.discountPercentage ?? 0;

  const totalPayment =
    booking?.totalPayment ?? totalPrice;


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

  const confirmBooking = () => {

    const currentUser =
      JSON.parse(
        localStorage.getItem("currentUser")
      );


    const savedTicket = {

      ticketNumber,

      email: currentUser?.email,

      name: booking.name,

      phone: booking.phone,

      from: booking.from,

      to: booking.to,

      busType: booking.busType,

      seats: booking.seats,

      date: booking.date,


      // Original price
      total: totalPrice,

      totalPrice: totalPrice,


      // Offer
      offerTitle:
        booking.offerTitle || "No Offer",

      discountPercentage:
        discountPercentage,

      discount:
        discount,


      // Final amount
      totalPayment:
        totalPayment,


      paymentStatus:
        booking.paymentStatus,

      paymentMethod:
        booking.paymentMethod,

      paymentDate:
        booking.paymentDate,

      createdAt:
        new Date().toLocaleDateString("en-GB")

    };


    const existingTickets =
      JSON.parse(
        localStorage.getItem("bookings")
      ) || [];


    localStorage.setItem(
      "bookings",
      JSON.stringify([
        ...existingTickets,
        savedTicket
      ])
    );


    alert(
      "Booking confirmed successfully!"
    );


    navigate("/dashboard");

  };


  // =========================================
  // DOWNLOAD TICKET
  // =========================================

  const downloadTicket = () => {

    const ticket =
      document.getElementById("ticket");


    html2canvas(ticket)
      .then((canvas) => {

        const imgData =
          canvas.toDataURL("image/png");


        const pdf =
          new jsPDF(
            "p",
            "mm",
            "a4"
          );


        const width = 190;


        const height =
          (canvas.height * width)
          / canvas.width;


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


          {/* HEADER */}

          <div className="ticket-header">

            <h1>
              BUSGO
            </h1>

            <p>
              BUS TRANSPORT RESERVATION
            </p>

          </div>


          {/* TICKET NUMBER */}

          <div className="ticket-number">

            Ticket No:

            <strong>
              {ticketNumber}
            </strong>

          </div>


          {/* ROUTE */}

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


          {/* DETAILS */}

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


            {/* OFFER */}

            {booking.offerTitle &&
              booking.offerTitle !== "No Offer" && (

              <p>

                <span>
                  Offer
                </span>

                <strong className="offer-used">

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
                Paid ✓
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
                XAF {totalPrice.toLocaleString("en-GB")}
              </strong>

            </div>


            <div className="ticket-price-row ticket-discount">

              <span>
                Discount
                {discountPercentage > 0 &&
                  ` (${discountPercentage}%)`}
              </span>

              <strong>
                - XAF {discount.toLocaleString("en-GB")}
              </strong>

            </div>


            <div className="ticket-price-divider"></div>


            <div className="ticket-final-price">

              <span>
                TOTAL PAYMENT
              </span>

              <h2>
                XAF {totalPayment.toLocaleString("en-GB")}
              </h2>

            </div>

          </div>


          {/* QR CODE */}

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
          onClick={() => window.print()}
        >
          Print Ticket
        </button>


        <button
          className="confirm-btn"
          onClick={confirmBooking}
        >
          Confirm Booking
        </button>


      </section>


      <Footer />

    </>
  );
}


export default Confirmation;