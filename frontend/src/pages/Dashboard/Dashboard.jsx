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
          "Paid",

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

  const getTicketHtml = (ticket) => `
    <div style="
      width: 600px;
      padding: 30px;
      background: #ffffff;
      color: #222;
      font-family: Arial, sans-serif;
    ">

      <div style="
        border: 1px solid #ddd;
        border-radius: 15px;
        padding: 30px;
      ">

        <div style="
          text-align: center;
          border-bottom: 1px solid #ddd;
          padding-bottom: 20px;
          margin-bottom: 20px;
        ">

          <h1 style="
            color: #0b7d45;
            margin: 0;
          ">
            BUSGO
          </h1>

          <p style="
            margin: 5px 0 0;
            color: #777;
          ">
            BUS TRANSPORT RESERVATION
          </p>

        </div>

        <p>
          <strong>Ticket:</strong>
          ${escapeHtml(
            ticket.ticketNumber
          )}
        </p>

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f5f9f6;
          margin: 20px 0;
        ">

          <div>
            <small>FROM</small>

            <h2 style="
              margin: 5px 0;
            ">
              ${escapeHtml(
                ticket.from
              )}
            </h2>
          </div>

          <strong style="
            font-size: 25px;
          ">
            →
          </strong>

          <div>
            <small>TO</small>

            <h2 style="
              margin: 5px 0;
            ">
              ${escapeHtml(
                ticket.to
              )}
            </h2>
          </div>

        </div>

        <p>
          <strong>Passenger:</strong>
          ${escapeHtml(
            ticket.name
          )}
        </p>

        <p>
          <strong>Phone:</strong>
          ${escapeHtml(
            ticket.phone
          )}
        </p>

        <p>
          <strong>Bus Type:</strong>
          ${escapeHtml(
            ticket.busType
          )}
        </p>

        <p>
          <strong>Seats:</strong>
          ${escapeHtml(
            ticket.seats.join(", ")
          )}
        </p>

        <p>
          <strong>Travel Date:</strong>
          ${escapeHtml(
            formatDate(ticket.date)
          )}
        </p>

        <p>
          <strong>Payment:</strong>
          ${escapeHtml(
            ticket.paymentMethod
          )}
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHtml(
            ticket.paymentStatus
          )}
        </p>

        ${
          ticket.offerTitle !==
          "No Offer"
            ? `
              <div style="
                margin: 20px 0;
                padding: 15px;
                background: #eef8f2;
                border-radius: 10px;
                color: #0b7d45;
              ">

                <strong>
                  ${escapeHtml(
                    ticket.offerTitle
                  )}
                </strong>

                <br />

                ${
                  ticket.discountPercentage
                }% OFF

              </div>
            `
            : ""
        }

        <div style="
          margin-top: 25px;
          padding: 20px;
          background: #f8faf9;
          border-radius: 10px;
        ">

          <p>
            Total Price:

            <strong style="
              float: right;
            ">
              ${formatMoney(
                ticket.totalPrice
              )}
            </strong>
          </p>

          <p style="
            color: #0b7d45;
          ">

            Discount:

            <strong style="
              float: right;
            ">
              - ${formatMoney(
                ticket.discount
              )}
            </strong>

          </p>

          <hr />

          <h2 style="
            color: #0b7d45;
            margin-bottom: 0;
          ">

            Total Payment:

            <span style="
              float: right;
            ">
              ${formatMoney(
                ticket.totalPayment
              )}
            </span>

          </h2>

        </div>

        <p style="
          text-align: center;
          margin-top: 30px;
          color: #777;
        ">
          Thank you for travelling with BusGo
        </p>

      </div>

    </div>
  `;

  // =========================================
  // DOWNLOAD TICKET PDF
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

    ticketElement.innerHTML =
      getTicketHtml(ticket);

    document.body.appendChild(
      ticketElement
    );

    try {
      const canvas =
        await html2canvas(
          ticketElement
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
        "width=800,height=900"
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
    }, 300);
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

    try {
      await axios.patch(
        `${API_URL}/api/bookings/${ticket.id}/status`,
        {
          bookingStatus:
            "Cancelled"
        }
      );

      setBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              ticket.id
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
  // PAGE
  // =========================================

  return (
    <>
      <Navbar />

      <section className="dashboard-page">

        <div className="dashboard-container">

          {/* HEADER */}

          <div className="dashboard-header">

            <div>

              <h1>
                Welcome back,{" "}
                {user?.name ||
                  "Traveller"}
              </h1>

              <p>
                View and manage your
                BusGo bookings.
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

          {/* STATS */}

          <div className="dashboard-stats">

            <div className="stat-card">

              <span>
                🎫
              </span>

              <div>

                <p>
                  Total Bookings
                </p>

                <h2>
                  {totalBookings}
                </h2>

              </div>

            </div>

            <div className="stat-card">

              <span>
                💳
              </span>

              <div>

                <p>
                  Total Spent
                </p>

                <h2>
                  {formatMoney(
                    totalSpent
                  )}
                </h2>

              </div>

            </div>

            <div className="stat-card">

              <span>
                🎉
              </span>

              <div>

                <p>
                  Total Savings
                </p>

                <h2>
                  {formatMoney(
                    totalDiscount
                  )}
                </h2>

              </div>

            </div>

          </div>

          {/* BOOKINGS */}

          <div className="bookings-section">

            <h2>
              My Bookings
            </h2>

            {loading && (
              <p className="dashboard-message">
                Loading your bookings...
              </p>
            )}

            {!loading &&
              error && (
                <p className="dashboard-error">
                  {error}
                </p>
              )}

            {!loading &&
              !error &&
              bookings.length === 0 && (

                <div className="empty-dashboard">

                  <h3>
                    No bookings yet
                  </h3>

                  <p>
                    Your confirmed
                    BusGo tickets will
                    appear here.
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

            {!loading &&
              !error &&
              bookings.length > 0 && (

                <div className="bookings-list">

                  {bookings.map(
                    (ticket) => (

                      <div
                        className="booking-card"
                        key={
                          ticket.id ||
                          ticket.ticketNumber
                        }
                      >

                        {/* CARD HEADER */}

                        <div className="booking-card-header">

                          <div>

                            <small>
                              Ticket Number
                            </small>

                            <h3>
                              {
                                ticket.ticketNumber
                              }
                            </h3>

                          </div>

                          <span
                            className={
                              ticket.paymentStatus?.toLowerCase() ===
                              "paid"
                                ? "booking-status paid"
                                : "booking-status"
                            }
                          >
                            {
                              ticket.paymentStatus
                            }
                          </span>

                        </div>

                        {/* ROUTE */}

                        <div className="booking-route">

                          <div>

                            <small>
                              FROM
                            </small>

                            <h3>
                              {ticket.from}
                            </h3>

                          </div>

                          <span>
                            →
                          </span>

                          <div>

                            <small>
                              TO
                            </small>

                            <h3>
                              {ticket.to}
                            </h3>

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="booking-details">

                          <p>
                            <strong>
                              Bus:
                            </strong>{" "}
                            {
                              ticket.busType
                            }
                          </p>

                          <p>
                            <strong>
                              Seats:
                            </strong>{" "}
                            {
                              ticket.seats.join(
                                ", "
                              ) ||
                              "N/A"
                            }
                          </p>

                          <p>
                            <strong>
                              Date:
                            </strong>{" "}
                            {
                              formatDate(
                                ticket.date
                              )
                            }
                          </p>

                          <p>
                            <strong>
                              Paid:
                            </strong>{" "}
                            {
                              formatMoney(
                                ticket.totalPayment
                              )
                            }
                          </p>

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
                            Download PDF
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

                        </div>

                      </div>

                    )
                  )}

                </div>
              )}

          </div>

        </div>

      </section>

      {/* TICKET MODAL */}

      {selectedTicket && (

        <div className="ticket-modal-overlay">

          <div className="ticket-modal">

            <button
              className="close-ticket-modal"
              onClick={() =>
                setSelectedTicket(
                  null
                )
              }
            >
              ×
            </button>

            <h2>
              BusGo Ticket
            </h2>

            <p>
              <strong>
                Ticket:
              </strong>{" "}
              {
                selectedTicket.ticketNumber
              }
            </p>

            <div className="modal-route">

              <div>

                <small>
                  FROM
                </small>

                <h3>
                  {
                    selectedTicket.from
                  }
                </h3>

              </div>

              <span>
                →
              </span>

              <div>

                <small>
                  TO
                </small>

                <h3>
                  {
                    selectedTicket.to
                  }
                </h3>

              </div>

            </div>

            <p>
              <strong>
                Passenger:
              </strong>{" "}
              {
                selectedTicket.name
              }
            </p>

            <p>
              <strong>
                Phone:
              </strong>{" "}
              {
                selectedTicket.phone
              }
            </p>

            <p>
              <strong>
                Bus Type:
              </strong>{" "}
              {
                selectedTicket.busType
              }
            </p>

            <p>
              <strong>
                Seats:
              </strong>{" "}
              {
                selectedTicket.seats.join(
                  ", "
                )
              }
            </p>

            <p>
              <strong>
                Travel Date:
              </strong>{" "}
              {
                formatDate(
                  selectedTicket.date
                )
              }
            </p>

            <p>
              <strong>
                Payment:
              </strong>{" "}
              {
                selectedTicket.paymentMethod
              }
            </p>

            <p>
              <strong>
                Total Payment:
              </strong>{" "}
              {
                formatMoney(
                  selectedTicket.totalPayment
                )
              }
            </p>

            <div className="modal-ticket-actions">

              <button
                onClick={() =>
                  downloadTicket(
                    selectedTicket
                  )
                }
              >
                Download PDF
              </button>

              <button
                onClick={() =>
                  printTicket(
                    selectedTicket
                  )
                }
              >
                Print Ticket
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