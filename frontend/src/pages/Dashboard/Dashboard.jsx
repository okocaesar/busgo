import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { API_URL } from "../../api";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // NORMALISE SEATS
  // =========================================

  const parseSeats = (seats) => {
    if (Array.isArray(seats)) {
      return seats;
    }

    if (typeof seats === "string") {
      try {
        const parsedSeats = JSON.parse(seats);

        return Array.isArray(parsedSeats)
          ? parsedSeats
          : [seats];
      } catch {
        return [seats];
      }
    }

    return [];
  };

  // =========================================
  // NORMALISE BOOKING
  // =========================================

  const normaliseBooking = useCallback(
    (booking) => {
      return {
        ...booking,

        ticketNumber:
          booking.ticketNumber ||
          booking.ticket_number ||
          `BG-${booking.id}`,

        name:
          booking.name ||
          booking.passenger_name ||
          "",

        phone:
          booking.phone ||
          booking.passenger_phone ||
          "",

        from:
          booking.from ||
          booking.departure ||
          "",

        to:
          booking.to ||
          booking.destination ||
          "",

        busType:
          booking.busType ||
          booking.bus_type ||
          booking.bus_name ||
          "",

        busNumber:
          booking.busNumber ||
          booking.bus_number ||
          booking.busNo ||
          booking.bus_no ||
          "BG-01",

        time:
          booking.time ||
          booking.departure_time ||
          booking.travel_time ||
          "08:00 AM",

        totalPrice: Number(
          booking.totalPrice ??
          booking.total_price ??
          0
        ),

        discountPercentage: Number(
          booking.discountPercentage ??
          booking.discount_percentage ??
          booking.discount_percent ??
          0
        ),

        discount: Number(
          booking.discount ?? 0
        ),

        totalPayment: Number(
          booking.totalPayment ??
          booking.total_payment ??
          booking.total_price ??
          0
        ),

        offerTitle:
          booking.offerTitle ||
          booking.offer_title ||
          "No Offer",

        paymentMethod:
          booking.paymentMethod ||
          booking.payment_method ||
          "N/A",

        paymentStatus:
          booking.paymentStatus ||
          booking.payment_status ||
          "Successful",

        bookingStatus:
          booking.bookingStatus ||
          booking.booking_status ||
          "Confirmed",

        paymentDate:
          booking.paymentDate ||
          booking.payment_date ||
          booking.created_at ||
          "",

        date:
          booking.date ||
          booking.travel_date ||
          "",

        seats: parseSeats(booking.seats)
      };
    },
    []
  );

  // =========================================
  // GET TICKET STATUS
  // =========================================

  const getTicketStatus = (ticket) => {
    const bookingStatus =
      String(ticket.bookingStatus || "")
        .toLowerCase()
        .trim();

    const paymentStatus =
      String(ticket.paymentStatus || "")
        .toLowerCase()
        .trim();

    // Cancelled booking
    if (
      bookingStatus.includes("cancel") ||
      bookingStatus === "cancelled"
    ) {
      return "cancelled";
    }

    // Pending booking/payment
    if (
      bookingStatus.includes("pending") ||
      paymentStatus.includes("pending")
    ) {
      return "pending";
    }

    // Determine status using travel date
    if (ticket.date) {
      const travelDate = new Date(
        `${String(ticket.date).slice(0, 10)}T00:00:00`
      );

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (
        !Number.isNaN(travelDate.getTime())
      ) {
        if (travelDate < today) {
          return "completed";
        }

        return "active";
      }
    }

    // Default
    return "active";
  };

  // =========================================
  // LOAD BOOKINGS
  // =========================================

  useEffect(() => {
    const loadBookings = async () => {
      const loggedIn =
        localStorage.getItem("loggedIn");

      let currentUser;

      try {
        currentUser = JSON.parse(
          localStorage.getItem(
            "currentUser"
          )
        );
      } catch {
        currentUser = null;
      }

      if (!loggedIn || !currentUser?.id) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/api/bookings/user/${currentUser.id}`
        );

        const databaseBookings =
          response.data?.bookings || [];

        setBookings(
          databaseBookings.map(
            normaliseBooking
          )
        );
      } catch (requestError) {
        console.error(
          "Failed to load bookings:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
          "Unable to load your bookings. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [navigate, normaliseBooking]);

  // =========================================
  // STATISTICS
  // =========================================

  const totalBookings =
    bookings.length;

  const totalSpent =
    bookings.reduce(
      (sum, ticket) =>
        sum +
        Number(
          ticket.totalPayment || 0
        ),
      0
    );

  const totalDiscount =
    bookings.reduce(
      (sum, ticket) =>
        sum +
        Number(
          ticket.discount || 0
        ),
      0
    );

  const activeBookings =
    bookings.filter(
      (ticket) =>
        getTicketStatus(ticket) ===
        "active"
    ).length;

  // =========================================
  // FORMAT MONEY
  // =========================================

  const formatMoney = (amount) =>
    `XAF ${Number(
      amount || 0
    ).toLocaleString("en-GB")}`;

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    if (
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(date)
    ) {
      const [
        year,
        month,
        day
      ] = date
        .slice(0, 10)
        .split("-");

      return `${day}/${month}/${year}`;
    }

    return date;
  };

  // =========================================
  // FORMAT TIME
  // =========================================

  const formatTime = (time) => {
    if (!time) {
      return "08:00 AM";
    }

    return time;
  };

  // =========================================
  // ESCAPE HTML
  // =========================================

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(
        /'/g,
        "&#039;"
      );

  // =========================================
  // TICKET HTML
  // =========================================

  const getTicketHtml = (ticket) => {
    const status =
      getTicketStatus(ticket);

    return `
      <div style="
        width: 820px;
        padding: 30px;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        box-sizing: border-box;
      ">

        <div style="
          position: relative;
          overflow: hidden;
          background: #eaf5fa;
          border-radius: 0 0 35px 35px;
          border: 1px solid #d6e4ea;
          box-sizing: border-box;
        ">

          <!-- HEADER -->

          <div style="
            height: 125px;
            width: 82%;
            background: #428bb7;
            color: #ffffff;
            display: flex;
            align-items: center;
            padding: 0 45px;
            box-sizing: border-box;
            border-radius: 0 0 28px 0;
          ">

            <h1 style="
              margin: 0;
              font-size: 48px;
              font-weight: 800;
              letter-spacing: 1px;
            ">
              BUSGO TICKET
            </h1>

          </div>

          <!-- CONTENT -->

          <div style="
            display: grid;
            grid-template-columns: 160px 1fr 125px;
            gap: 25px;
            align-items: center;
            padding: 45px 40px 55px;
          ">

            <!-- BUS -->

            <div style="
              text-align: center;
            ">

              <div style="
                font-size: 88px;
                line-height: 1;
              ">
                🚌
              </div>

              <div style="
                margin-top: 12px;
                color: #428bb7;
                font-size: 12px;
                font-weight: 700;
              ">
                ${escapeHtml(ticket.busType)}
              </div>

            </div>

            <!-- DETAILS -->

            <div style="
              display: flex;
              flex-direction: column;
              gap: 14px;
            ">

              <div style="
                height: 48px;
                border: 2px solid #172126;
                border-radius: 12px;
                display: flex;
                align-items: center;
                padding: 0 15px;
                font-size: 20px;
                font-weight: 700;
                box-sizing: border-box;
              ">
                DATE:
                <span style="
                  margin-left: 12px;
                  font-weight: 500;
                ">
                  ${escapeHtml(
                    formatDate(ticket.date)
                  )}
                </span>
              </div>

              <div style="
                height: 48px;
                border: 2px solid #172126;
                border-radius: 12px;
                display: flex;
                align-items: center;
                padding: 0 15px;
                font-size: 20px;
                font-weight: 700;
                box-sizing: border-box;
              ">
                TIME:
                <span style="
                  margin-left: 12px;
                  font-weight: 500;
                ">
                  ${escapeHtml(
                    formatTime(ticket.time)
                  )}
                </span>
              </div>

              <div style="
                height: 48px;
                border: 2px solid #172126;
                border-radius: 12px;
                display: flex;
                align-items: center;
                padding: 0 15px;
                font-size: 20px;
                font-weight: 700;
                box-sizing: border-box;
              ">
                FROM:
                <span style="
                  margin-left: 12px;
                  font-weight: 500;
                ">
                  ${escapeHtml(ticket.from)}
                </span>
              </div>

              <div style="
                height: 48px;
                border: 2px solid #172126;
                border-radius: 12px;
                display: flex;
                align-items: center;
                padding: 0 15px;
                font-size: 20px;
                font-weight: 700;
                box-sizing: border-box;
              ">
                TO:
                <span style="
                  margin-left: 12px;
                  font-weight: 500;
                ">
                  ${escapeHtml(ticket.to)}
                </span>
              </div>

            </div>

            <!-- BUS / SEAT -->

            <div style="
              display: flex;
              flex-direction: column;
              gap: 18px;
            ">

              <div style="
                height: 100px;
                border: 2px solid #172126;
                border-radius: 18px;
                padding: 12px;
                box-sizing: border-box;
                text-align: center;
              ">

                <div style="
                  font-size: 18px;
                  font-weight: 800;
                ">
                  Bus No.
                </div>

                <div style="
                  margin-top: 10px;
                  font-size: 15px;
                ">
                  ${escapeHtml(
                    ticket.busNumber
                  )}
                </div>

              </div>

              <div style="
                height: 100px;
                border: 2px solid #172126;
                border-radius: 18px;
                padding: 12px;
                box-sizing: border-box;
                text-align: center;
              ">

                <div style="
                  font-size: 18px;
                  font-weight: 800;
                ">
                  Seat No.
                </div>

                <div style="
                  margin-top: 10px;
                  font-size: 15px;
                ">
                  ${escapeHtml(
                    ticket.seats.join(", ") ||
                    "N/A"
                  )}
                </div>

              </div>

            </div>

          </div>

          <!-- FOOTER -->

          <div style="
            border-top: 1px dashed #aebfc7;
            padding: 18px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255,255,255,.35);
          ">

            <div>

              <div style="
                font-size: 11px;
                color: #718089;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">
                Ticket Number
              </div>

              <strong style="
                font-size: 15px;
              ">
                ${escapeHtml(
                  ticket.ticketNumber
                )}
              </strong>

            </div>

            <div style="
              text-align: right;
            ">

              <div style="
                font-size: 11px;
                color: #718089;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">
                Status
              </div>

              <strong style="
                color: ${
                  status === "completed"
                    ? "#247a48"
                    : status === "pending"
                    ? "#d58b00"
                    : status === "cancelled"
                    ? "#c0392b"
                    : "#428bb7"
                };
                text-transform: uppercase;
              ">
                ${escapeHtml(status)}
              </strong>

            </div>

          </div>

        </div>

      </div>
    `;
  };

  // =========================================
  // DOWNLOAD TICKET
  // =========================================

  const downloadTicket = async (
    ticket
  ) => {
    const ticketElement =
      document.createElement("div");

    ticketElement.style.position =
      "fixed";

    ticketElement.style.left =
      "-99999px";

    ticketElement.style.top =
      "0";

    ticketElement.style.width =
      "880px";

    ticketElement.innerHTML =
      getTicketHtml(ticket);

    document.body.appendChild(
      ticketElement
    );

    try {
      const canvas =
        await html2canvas(
          ticketElement,
          {
            scale: 2,
            backgroundColor: "#ffffff"
          }
        );

      const imageData =
        canvas.toDataURL(
          "image/png"
        );

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      const width = 190;

      const height =
        (canvas.height * width) /
        canvas.width;

      pdf.addImage(
        imageData,
        "PNG",
        10,
        10,
        width,
        height
      );

      pdf.save(
        `BusGo-${ticket.ticketNumber}.pdf`
      );
    } catch (pdfError) {
      console.error(
        "PDF generation error:",
        pdfError
      );

      alert(
        "Unable to create the ticket PDF."
      );
    } finally {
      document.body.removeChild(
        ticketElement
      );
    }
  };

  // =========================================
  // PRINT TICKET
  // =========================================

  const printTicket = (ticket) => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=900"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print your ticket."
      );

      return;
    }

    printWindow.document.write(`
      <html>

        <head>

          <title>
            BusGo Ticket -
            ${escapeHtml(
              ticket.ticketNumber
            )}
          </title>

          <style>

            body {
              margin: 0;
              padding: 30px;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
            }

            @media print {
              body {
                padding: 0;
              }
            }

          </style>

        </head>

        <body>

          ${getTicketHtml(ticket)}

        </body>

      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // =========================================
  // CANCEL TICKET
  // =========================================

  const cancelTicket = async (
    ticket
  ) => {
    const confirmed =
      window.confirm(
        `Cancel ticket ${ticket.ticketNumber}?`
      );

    if (!confirmed) {
      return;
    }

    if (!user?.id) {
      alert(
        "Your login session has expired. Please login again."
      );

      navigate("/login");

      return;
    }

    try {
      await axios.patch(
        `${API_URL}/api/bookings/${ticket.id}/cancel/user/${user.id}`
      );

      setBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id === ticket.id
                ? {
                    ...booking,
                    bookingStatus:
                      "Cancelled"
                  }
                : booking
          )
      );

      setSelectedTicket(null);

      alert(
        "Booking cancelled successfully."
      );
    } catch (cancelError) {
      console.error(
        "Cancel booking error:",
        cancelError
      );

      alert(
        cancelError.response?.data
          ?.message ||
        "Unable to cancel this booking."
      );
    }
  };

  // =========================================
  // STATUS LABEL
  // =========================================

  const statusLabel = (ticket) => {
    const status =
      getTicketStatus(ticket);

    if (status === "pending") {
      return "Pending";
    }

    if (status === "completed") {
      return "Completed";
    }

    if (status === "cancelled") {
      return "Cancelled";
    }

    return "Active";
  };

  // =========================================
  // PAGE
  // =========================================

  return (
    <>
      <Navbar />

      <section className="dashboard-page">

        <div className="dashboard-container">

          {/* =================================
              DASHBOARD HEADER
          ================================= */}

          <div className="dashboard-header">

            <div>

              <span className="dashboard-eyebrow">
                MY BUSGO ACCOUNT
              </span>

              <h1>
                Welcome back,{" "}
                <span>
                  {user?.name ||
                    "Traveller"}
                </span>
              </h1>

              <p>
                View and manage all your
                BusGo travel bookings.
              </p>

            </div>

            <button
              className="new-booking-btn"
              onClick={() =>
                navigate("/booking")
              }
            >
              Book a Trip
            </button>

          </div>

          {/* =================================
              STATISTICS
          ================================= */}

          <div className="dashboard-stats">

            <div className="stat-card">

              <div className="stat-icon">
                🎫
              </div>

              <div>
                <span>
                  Total Bookings
                </span>

                <strong>
                  {totalBookings}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                💳
              </div>

              <div>
                <span>
                  Total Spent
                </span>

                <strong>
                  {formatMoney(
                    totalSpent
                  )}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                🚌
              </div>

              <div>
                <span>
                  Active Trips
                </span>

                <strong>
                  {activeBookings}
                </strong>
              </div>

            </div>

          </div>

          {/* =================================
              BOOKINGS SECTION
          ================================= */}

          <div className="bookings-section">

            <div className="bookings-heading">

              <div>

                <span>
                  TRAVEL HISTORY
                </span>

                <h2>
                  My Tickets
                </h2>

              </div>

              <div className="booking-count">
                {totalBookings}{" "}
                {totalBookings === 1
                  ? "Ticket"
                  : "Tickets"}
              </div>

            </div>

            {loading && (
              <div className="dashboard-message">
                <div className="loading-spinner"></div>

                <p>
                  Loading your tickets...
                </p>
              </div>
            )}

            {!loading &&
              error && (
                <div className="dashboard-error">
                  {error}
                </div>
              )}

            {!loading &&
              !error &&
              bookings.length === 0 && (
                <div className="empty-dashboard">

                  <div className="empty-icon">
                    🚌
                  </div>

                  <h3>
                    No bookings yet
                  </h3>

                  <p>
                    Your confirmed BusGo
                    tickets will appear
                    here after you make
                    a booking.
                  </p>

                  <button
                    onClick={() =>
                      navigate(
                        "/booking"
                      )
                    }
                  >
                    Make a Booking
                  </button>

                </div>
              )}

            {/* =================================
                TICKET LIST
            ================================= */}

            {!loading &&
              !error &&
              bookings.length > 0 && (

                <div className="bookings-list">

                  {bookings.map(
                    (ticket) => {

                      const status =
                        getTicketStatus(
                          ticket
                        );

                      return (
                        <div
                          className="booking-row"
                          key={
                            ticket.id ||
                            ticket.ticketNumber
                          }
                        >

                          {/* LEFT */}

                          <div className="booking-main">

                            <div className="booking-ticket-number">

                              <span>
                                TICKET NUMBER
                              </span>

                              <strong>
                                {
                                  ticket.ticketNumber
                                }
                              </strong>

                            </div>

                            <div className="booking-route">

                              <div>

                                <small>
                                  FROM
                                </small>

                                <strong>
                                  {ticket.from}
                                </strong>

                              </div>

                              <span className="route-arrow">
                                →
                              </span>

                              <div>

                                <small>
                                  TO
                                </small>

                                <strong>
                                  {ticket.to}
                                </strong>

                              </div>

                            </div>

                          </div>

                          {/* MIDDLE */}

                          <div className="booking-info">

                            <div>

                              <span>
                                DATE
                              </span>

                              <strong>
                                {formatDate(
                                  ticket.date
                                )}
                              </strong>

                            </div>

                            <div>

                              <span>
                                SEATS
                              </span>

                              <strong>
                                {ticket.seats.join(
                                  ", "
                                ) || "N/A"}
                              </strong>

                            </div>

                            <div>

                              <span>
                                BUS
                              </span>

                              <strong>
                                {
                                  ticket.busType
                                }
                              </strong>

                            </div>

                            <div>

                              <span>
                                PAID
                              </span>

                              <strong className="paid">
                                {formatMoney(
                                  ticket.totalPayment
                                )}
                              </strong>

                            </div>

                          </div>

                          {/* ACTIONS */}

                          <div className="booking-actions">

                            <button
                              className="view-ticket-btn"
                              onClick={() =>
                                setSelectedTicket(
                                  ticket
                                )
                              }
                            >
                              View Ticket
                            </button>

                            <button
                              className="download-ticket-btn"
                              onClick={() =>
                                downloadTicket(
                                  ticket
                                )
                              }
                            >
                              Download
                            </button>

                            <button
                              className="print-ticket-btn"
                              onClick={() =>
                                printTicket(
                                  ticket
                                )
                              }
                            >
                              Print
                            </button>

                            {status !==
                              "completed" &&
                              status !==
                                "cancelled" && (
                                <button
                                  className="cancel-ticket-btn"
                                  onClick={() =>
                                    cancelTicket(
                                      ticket
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              )}

                          </div>

                          {/* STATUS AT END */}

                          <div
                            className={`ticket-status-end ${status}`}
                          >

                            <span>
                              STATUS
                            </span>

                            <strong>
                              {statusLabel(
                                ticket
                              )}
                            </strong>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

          </div>

        </div>

      </section>

      {/* =====================================
          TICKET MODAL
      ===================================== */}

      {selectedTicket && (

        <div
          className="ticket-modal-overlay"
          onClick={() =>
            setSelectedTicket(null)
          }
        >

          <div
            className="ticket-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="close-ticket-modal"
              onClick={() =>
                setSelectedTicket(null)
              }
            >
              ×
            </button>

            {/* TICKET DESIGN */}

            <div className="bus-ticket">

              {/* HEADER */}

              <div className="bus-ticket-header">

                <h2>
                  BUSGO TICKET
                </h2>

              </div>

              {/* BODY */}

              <div className="bus-ticket-body">

                {/* BUS ICON */}

                <div className="ticket-bus-area">

                  <div className="bus-ticket-icon">
                    🚌
                  </div>

                  <span>
                    {selectedTicket.busType}
                  </span>

                </div>

                {/* DETAILS */}

                <div className="ticket-fields">

                  <div className="ticket-field">

                    <strong>
                      DATE
                    </strong>

                    <span>
                      {formatDate(
                        selectedTicket.date
                      )}
                    </span>

                  </div>

                  <div className="ticket-field">

                    <strong>
                      TIME
                    </strong>

                    <span>
                      {formatTime(
                        selectedTicket.time
                      )}
                    </span>

                  </div>

                  <div className="ticket-field">

                    <strong>
                      FROM
                    </strong>

                    <span>
                      {selectedTicket.from}
                    </span>

                  </div>

                  <div className="ticket-field">

                    <strong>
                      TO
                    </strong>

                    <span>
                      {selectedTicket.to}
                    </span>

                  </div>

                </div>

                {/* BUS / SEAT */}

                <div className="ticket-side-info">

                  <div className="ticket-side-box">

                    <strong>
                      Bus No.
                    </strong>

                    <span>
                      {
                        selectedTicket.busNumber
                      }
                    </span>

                  </div>

                  <div className="ticket-side-box">

                    <strong>
                      Seat No.
                    </strong>

                    <span>
                      {
                        selectedTicket.seats.join(
                          ", "
                        ) || "N/A"
                      }
                    </span>

                  </div>

                </div>

              </div>

              {/* TICKET FOOTER */}

              <div className="bus-ticket-footer">

                <div>

                  <span>
                    Ticket Number
                  </span>

                  <strong>
                    {
                      selectedTicket.ticketNumber
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Passenger
                  </span>

                  <strong>
                    {selectedTicket.name}
                  </strong>

                </div>

                <div>

                  <span>
                    Status
                  </span>

                  <strong
                    className={`modal-status ${getTicketStatus(
                      selectedTicket
                    )}`}
                  >
                    {statusLabel(
                      selectedTicket
                    )}
                  </strong>

                </div>

              </div>

            </div>

            {/* PRICE */}

            <div className="modal-price-section">

              <div>

                <span>
                  Total Price
                </span>

                <strong>
                  {formatMoney(
                    selectedTicket.totalPrice
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Discount
                </span>

                <strong className="discount">
                  -{" "}
                  {formatMoney(
                    selectedTicket.discount
                  )}
                </strong>

              </div>

              <div className="modal-total">

                <span>
                  Total Payment
                </span>

                <strong>
                  {formatMoney(
                    selectedTicket.totalPayment
                  )}
                </strong>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="modal-ticket-actions">

              <button
                className="modal-download-btn"
                onClick={() =>
                  downloadTicket(
                    selectedTicket
                  )
                }
              >
                Download PDF
              </button>

              <button
                className="modal-print-btn"
                onClick={() =>
                  printTicket(
                    selectedTicket
                  )
                }
              >
                Print Ticket
              </button>

              <button
                className="modal-close-btn"
                onClick={() =>
                  setSelectedTicket(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      <Footer />
    </>
  );
}

export default Dashboard;