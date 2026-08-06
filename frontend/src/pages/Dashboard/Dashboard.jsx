import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Dashboard.css";


function Dashboard() {

  const downloadTicket = (ticket) => {

  const ticketElement =
    document.createElement("div");

  ticketElement.style.position = "fixed";
  ticketElement.style.left = "-99999px";
  ticketElement.style.top = "0";
  ticketElement.style.width = "600px";
  ticketElement.style.padding = "30px";
  ticketElement.style.background = "#ffffff";
  ticketElement.style.fontFamily = "Arial, sans-serif";

  const totalPrice =
    ticket.totalPrice ??
    ticket.total ??
    0;

  const discount =
    ticket.discount ??
    0;

  const discountPercentage =
    ticket.discountPercentage ??
    0;

  const totalPayment =
    ticket.totalPayment ??
    totalPrice;

  ticketElement.innerHTML = `

    <div style="
      border:1px solid #ddd;
      border-radius:15px;
      padding:30px;
      color:#222;
    ">

      <div style="
        text-align:center;
        border-bottom:1px solid #ddd;
        padding-bottom:20px;
        margin-bottom:20px;
      ">

        <h1 style="
          color:#0b7d45;
          margin:0;
        ">
          BUSGO
        </h1>

        <p style="
          margin:5px 0 0;
          color:#777;
        ">
          BUS TRANSPORT RESERVATION
        </p>

      </div>


      <p>
        <strong>Ticket:</strong>
        ${ticket.ticketNumber || ""}
      </p>

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:20px 0;
        background:#f5f9f6;
        margin:20px 0;
      ">

        <div>
          <small>FROM</small>
          <h2 style="margin:5px 0;">
            ${ticket.from || ""}
          </h2>
        </div>

        <strong style="font-size:25px;">
          →
        </strong>

        <div>
          <small>TO</small>
          <h2 style="margin:5px 0;">
            ${ticket.to || ""}
          </h2>
        </div>

      </div>


      <p>
        <strong>Passenger:</strong>
        ${ticket.name || ""}
      </p>

      <p>
        <strong>Phone:</strong>
        ${ticket.phone || ""}
      </p>

      <p>
        <strong>Bus Type:</strong>
        ${ticket.busType || ""}
      </p>

      <p>
        <strong>Seats:</strong>
        ${ticket.seats?.join(", ") || ""}
      </p>

      <p>
        <strong>Travel Date:</strong>
        ${ticket.date || ""}
      </p>

      <p>
        <strong>Payment:</strong>
        ${ticket.paymentMethod || ""}
      </p>


      ${
        ticket.offerTitle &&
        ticket.offerTitle !== "No Offer"

        ? `

          <div style="
            margin:20px 0;
            padding:15px;
            background:#eef8f2;
            border-radius:10px;
            color:#0b7d45;
          ">

            <strong>
              ${ticket.offerTitle}
            </strong>

            <br />

            ${discountPercentage}% OFF

          </div>

        `

        : ""
      }


      <div style="
        margin-top:25px;
        padding:20px;
        background:#f8faf9;
        border-radius:10px;
      ">

        <p>
          Total Price:
          <strong style="float:right;">
            XAF ${Number(totalPrice)
              .toLocaleString("en-GB")}
          </strong>
        </p>

        <p style="color:#0b7d45;">
          Discount (${discountPercentage}%):
          <strong style="float:right;">
            - XAF ${Number(discount)
              .toLocaleString("en-GB")}
          </strong>
        </p>

        <hr />

        <h2 style="
          color:#0b7d45;
          margin-bottom:0;
        ">

          Total Payment:

          <span style="float:right;">
            XAF ${Number(totalPayment)
              .toLocaleString("en-GB")}
          </span>

        </h2>

      </div>


      <p style="
        text-align:center;
        margin-top:30px;
        color:#777;
      ">
        Thank you for travelling with BusGo
      </p>

    </div>

  `;


  document.body.appendChild(ticketElement);


  html2canvas(ticketElement)
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
        `BusGo-${ticket.ticketNumber}.pdf`
      );


      document.body.removeChild(
        ticketElement
      );

    });

};

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [bookings, setBookings] = useState([]);


  // =========================================
  // LOAD USER + BOOKINGS
  // =========================================

  useEffect(() => {

    const loggedIn =
      localStorage.getItem("loggedIn");


    const currentUser =
      JSON.parse(
        localStorage.getItem("currentUser")
      );


    if (!loggedIn || !currentUser) {

      navigate("/login");

      return;

    }


    setUser(currentUser);


    const savedBookings =
      JSON.parse(
        localStorage.getItem("bookings")
      ) || [];


    const userBookings =
      savedBookings.filter(
        (ticket) =>
          ticket.email === currentUser.email
      );


    setBookings(userBookings);

  }, [navigate]);


  // =========================================
  // CALCULATE DASHBOARD STATS
  // =========================================

  const totalBookings = bookings.length;


  const totalSpent = bookings.reduce(
    (sum, ticket) => {

      // New bookings use totalPayment
      // Old bookings use total
      const amount =
        ticket.totalPayment ??
        ticket.total ??
        0;

      return sum + Number(amount);

    },
    0
  );


  const totalDiscount = bookings.reduce(
    (sum, ticket) => {

      return sum + Number(
        ticket.discount ?? 0
      );

    },
    0
  );

  const printTicket = (ticket) => {

  const totalPrice =
    ticket.totalPrice ??
    ticket.total ??
    0;

  const discount =
    ticket.discount ??
    0;

  const discountPercentage =
    ticket.discountPercentage ??
    0;

  const totalPayment =
    ticket.totalPayment ??
    totalPrice;


  const printWindow =
    window.open(
      "",
      "_blank",
      "width=800,height=900"
    );


  printWindow.document.write(`

    <html>

      <head>

        <title>
          BusGo Ticket - ${ticket.ticketNumber}
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #222;
          }

          .ticket {
            max-width: 650px;
            margin: auto;
            border: 1px solid #ddd;
            border-radius: 15px;
            padding: 30px;
          }

          .header {
            text-align: center;
            border-bottom: 1px solid #ddd;
            padding-bottom: 20px;
          }

          .header h1 {
            color: #0b7d45;
            margin: 0;
          }

          .route {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 25px 0;
            padding: 20px;
            background: #f5f9f6;
          }

          .price {
            margin-top: 25px;
            padding: 20px;
            background: #f8faf9;
          }

          .discount {
            color: #0b7d45;
          }

          .total {
            color: #0b7d45;
            font-size: 22px;
          }

        </style>

      </head>


      <body>

        <div class="ticket">

          <div class="header">

            <h1>BUSGO</h1>

            <p>
              BUS TRANSPORT RESERVATION
            </p>

          </div>


          <p>
            <strong>Ticket:</strong>
            ${ticket.ticketNumber}
          </p>


          <div class="route">

            <div>

              <small>FROM</small>

              <h2>
                ${ticket.from}
              </h2>

            </div>


            <strong>
              →
            </strong>


            <div>

              <small>TO</small>

              <h2>
                ${ticket.to}
              </h2>

            </div>

          </div>


          <p>
            <strong>Passenger:</strong>
            ${ticket.name}
          </p>

          <p>
            <strong>Phone:</strong>
            ${ticket.phone}
          </p>

          <p>
            <strong>Bus:</strong>
            ${ticket.busType}
          </p>

          <p>
            <strong>Seats:</strong>
            ${ticket.seats?.join(", ")}
          </p>

          <p>
            <strong>Travel Date:</strong>
            ${ticket.date}
          </p>

          <p>
            <strong>Payment:</strong>
            ${ticket.paymentMethod || "N/A"}
          </p>


          ${
            ticket.offerTitle &&
            ticket.offerTitle !== "No Offer"

            ? `

              <p class="discount">

                <strong>
                  Offer:
                </strong>

                ${ticket.offerTitle}

                (${discountPercentage}% OFF)

              </p>

            `

            : ""
          }


          <div class="price">

            <p>

              Total Price:

              <strong style="float:right;">
                XAF ${Number(totalPrice)
                  .toLocaleString("en-GB")}
              </strong>

            </p>


            <p class="discount">

              Discount:

              <strong style="float:right;">
                - XAF ${Number(discount)
                  .toLocaleString("en-GB")}
              </strong>

            </p>


            <hr />


            <h2 class="total">

              Total Payment:

              <span style="float:right;">
                XAF ${Number(totalPayment)
                  .toLocaleString("en-GB")}
              </span>

            </h2>

          </div>


          <p style="text-align:center;">
            Thank you for travelling with BusGo
          </p>

        </div>


        <script>

          window.onload = function() {

            window.print();

          };

        </script>

      </body>

    </html>

  `);


  printWindow.document.close();

};

const cancelBooking = (ticketNumber) => {

  const confirmed =
    window.confirm(
      "Are you sure you want to cancel this booking?"
    );


  if (!confirmed) {
    return;
  }


  const savedBookings =
    JSON.parse(
      localStorage.getItem("bookings")
    ) || [];


  const updatedBookings =
    savedBookings.filter(
      (ticket) =>
        ticket.ticketNumber !== ticketNumber
    );


  localStorage.setItem(
    "bookings",
    JSON.stringify(updatedBookings)
  );


  setBookings((current) =>
    current.filter(
      (ticket) =>
        ticket.ticketNumber !== ticketNumber
    )
  );


  alert(
    "Booking cancelled successfully."
  );

};


  return (

    <>

      <Navbar />


      <main className="dashboard-page">

        <div className="dashboard-container">


          {/* =====================================
              WELCOME
          ===================================== */}

          <section className="dashboard-welcome">

            <div>

              <span className="dashboard-label">
                BUSGO CUSTOMER DASHBOARD
              </span>

              <h1>
                Welcome,{" "}
                <span>
                  {user?.name || "Traveler"}
                </span>
              </h1>

              <p>
                Manage your BusGo journeys, view your
                tickets and track your travel savings.
              </p>

            </div>


            <button
              className="book-trip-btn"
              onClick={() => navigate("/booking")}
            >
              Book a New Trip
              <span>→</span>
            </button>

          </section>


          {/* =====================================
              STATISTICS
          ===================================== */}

          <section className="dashboard-stats">


            <div className="stat-card">

              <div className="stat-icon">
                🎟️
              </div>

              <div>

                <span>
                  Total Trips
                </span>

                <strong>
                  {totalBookings}
                </strong>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                💰
              </div>

              <div>

                <span>
                  Total Spent
                </span>

                <strong>
                  XAF{" "}
                  {totalSpent.toLocaleString("en-GB")}
                </strong>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                🎉
              </div>

              <div>

                <span>
                  Total Savings
                </span>

                <strong className="savings">
                  XAF{" "}
                  {totalDiscount.toLocaleString("en-GB")}
                </strong>

              </div>

            </div>


          </section>


          {/* =====================================
              BOOKINGS HEADER
          ===================================== */}

          <div className="tickets-heading">

            <div>

              <span>
                TRAVEL HISTORY
              </span>

              <h2>
                My BusGo Tickets
              </h2>

            </div>


            {bookings.length > 0 && (

              <span className="booking-count">

                {bookings.length}{" "}
                {bookings.length === 1
                  ? "Booking"
                  : "Bookings"}

              </span>

            )}

          </div>


          {/* =====================================
              NO BOOKINGS
          ===================================== */}

          {bookings.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">
                🚌
              </div>

              <h2>
                No bookings yet
              </h2>

              <p>
                Your BusGo tickets will appear here
                after you complete a booking.
              </p>

              <button
                onClick={() => navigate("/booking")}
              >
                Start Your Journey
                <span>→</span>
              </button>

            </div>

          ) : (

            <div className="ticket-list">

              {bookings.map((ticket, index) => {


                // =================================
                // SUPPORT OLD BOOKINGS
                // =================================

                const totalPrice =
                  ticket.totalPrice ??
                  ticket.total ??
                  0;


                const discount =
                  ticket.discount ??
                  0;


                const discountPercentage =
                  ticket.discountPercentage ??
                  0;


                const totalPayment =
                  ticket.totalPayment ??
                  totalPrice;


                const hasOffer =
                  ticket.offerTitle &&
                  ticket.offerTitle !== "No Offer";


                return (

                  <article
                    className="ticket-card"
                    key={
                      ticket.ticketNumber ||
                      index
                    }
                  >


                    {/* TICKET TOP */}

                    <div className="ticket-card-header">

                      <div>

                        <span className="ticket-brand">
                          BUSGO
                        </span>

                        <p>
                          Bus Transport Ticket
                        </p>

                      </div>


                      <span className="ticket-status">

                        {ticket.paymentStatus ||
                          "Paid"} ✓

                      </span>

                    </div>


                    {/* TICKET NUMBER */}

                    <div className="ticket-number">

                      <span>
                        TICKET NUMBER
                      </span>

                      <strong>
                        {ticket.ticketNumber}
                      </strong>

                    </div>


                    {/* ROUTE */}

                    <div className="dashboard-route">

                      <div>

                        <small>
                          FROM
                        </small>

                        <strong>
                          {ticket.from}
                        </strong>

                      </div>


                      <div className="route-arrow">
                        →
                      </div>


                      <div>

                        <small>
                          TO
                        </small>

                        <strong>
                          {ticket.to}
                        </strong>

                      </div>

                    </div>


                    {/* DETAILS */}

                    <div className="ticket-details">


                      <div>

                        <span>
                          Passenger
                        </span>

                        <strong>
                          {ticket.name}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Bus Type
                        </span>

                        <strong>
                          {ticket.busType}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Seats
                        </span>

                        <strong>
                          {ticket.seats?.join(", ") ||
                            "Not selected"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Travel Date
                        </span>

                        <strong>
                          {ticket.date}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Payment
                        </span>

                        <strong>
                          {ticket.paymentMethod ||
                            "N/A"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Booked On
                        </span>

                        <strong>
                          {ticket.createdAt ||
                            "N/A"}
                        </strong>

                      </div>


                    </div>


                    {/* OFFER */}

                    {hasOffer && (

                      <div className="dashboard-offer">

                        <div className="offer-icon">
                          🎉
                        </div>

                        <div>

                          <span>
                            OFFER APPLIED
                          </span>

                          <strong>
                            {ticket.offerTitle}
                          </strong>

                        </div>

                        <b>
                          {discountPercentage}% OFF
                        </b>

                      </div>

                    )}


                    {/* PRICE */}

                    <div className="dashboard-price">

                      <div className="price-line">

                        <span>
                          Total Price
                        </span>

                        <strong>
                          XAF{" "}
                          {Number(totalPrice)
                            .toLocaleString("en-GB")}
                        </strong>

                      </div>


                      <div className="price-line discount-line">

                        <span>
                          Discount
                          {discountPercentage > 0 &&
                            ` (${discountPercentage}%)`}
                        </span>

                        <strong>
                          - XAF{" "}
                          {Number(discount)
                            .toLocaleString("en-GB")}
                        </strong>

                      </div>


                      <div className="price-divider"></div>


                      <div className="final-price">

                        <span>
                          Total Payment
                        </span>

                        <strong>
                          XAF{" "}
                          {Number(totalPayment)
                            .toLocaleString("en-GB")}
                        </strong>

                      </div>

                    </div>


                    {/* FOOTER */}

                   <div className="ticket-card-footer">

  <div className="ticket-footer-info">

    <span>
      🎫 BusGo Ticket
    </span>

    <span>
      {ticket.paymentDate || ""}
    </span>

  </div>


  <div className="ticket-actions">


    <button
      className="view-ticket-btn"
      onClick={() =>
        navigate("/confirmation", {
          state: ticket
        })
      }
    >
      View Ticket
    </button>


    <button
      className="download-ticket-btn"
      onClick={() =>
        downloadTicket(ticket)
      }
    >
      Download PDF
    </button>


    <button
      className="print-ticket-btn"
      onClick={() =>
        printTicket(ticket)
      }
    >
      Print
    </button>


    <button
      className="cancel-ticket-btn"
      onClick={() =>
        cancelBooking(
          ticket.ticketNumber
        )
      }
    >
      Cancel Booking
    </button>


  </div>

</div>


                  </article>

                );

              })}

            </div>

          )}

        </div>

      </main>


      <Footer />

    </>

  );

}


export default Dashboard;