import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { API_URL } from "../../api";

import "./AdminDashboard.css";


function AdminDashboard() {

  const navigate = useNavigate();


  // =========================================
  // ADMIN DATA
  // =========================================

  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);

  const [bookings, setBookings] = useState([]);

  const [activeTab, setActiveTab] =
    useState("bookings");

  const [error, setError] = useState("");


  // =========================================
  // NOTIFICATION FORM
  // =========================================

  const [notificationData, setNotificationData] =
    useState({
      userId: "all",
      title: "",
      message: "",
      type: "info"
    });


  const [sendingNotification, setSendingNotification] =
    useState(false);


  const [notificationSuccess, setNotificationSuccess] =
    useState("");


  const [notificationError, setNotificationError] =
    useState("");


  // =========================================
  // LOAD ADMIN DATA
  // =========================================

  const loadAdminData = useCallback(async () => {

    const token =
      localStorage.getItem("authToken");


    if (!token) {
      navigate("/login");
      return;
    }


    const api = axios.create({

      baseURL:
        `${API_URL}/api/admin`,

      headers: {
        Authorization:
          `Bearer ${token}`
      }

    });


    try {

      setError("");


      const [
        statsResponse,
        usersResponse,
        bookingsResponse
      ] = await Promise.all([

        api.get("/stats"),

        api.get("/users"),

        api.get("/bookings")

      ]);


      setStats(
        statsResponse.data
      );


      setUsers(
        usersResponse.data.users || []
      );


      setBookings(
        bookingsResponse.data.bookings || []
      );


    } catch (requestError) {

      console.error(
        "FAILED TO LOAD ADMIN DATA:",
        requestError
      );


      setError(
        requestError.response?.data?.message ||
        "Unable to load admin information."
      );


      if (
        requestError.response?.status === 401 ||
        requestError.response?.status === 403
      ) {

        localStorage.removeItem(
          "authToken"
        );

        localStorage.removeItem(
          "loggedIn"
        );

        localStorage.removeItem(
          "currentUser"
        );

        navigate("/login");

      }

    }

  }, [navigate]);


  // =========================================
  // CHECK ADMIN USER
  // =========================================

  useEffect(() => {

    const currentUser =
      JSON.parse(
        localStorage.getItem(
          "currentUser"
        ) || "null"
      );


    if (
      !currentUser ||
      currentUser.role !== "admin"
    ) {

      navigate("/");

      return;

    }


    loadAdminData();

  }, [
    navigate,
    loadAdminData
  ]);


  // =========================================
  // UPDATE BOOKING STATUS
  // =========================================

  const updateBookingStatus = async (
    bookingId,
    bookingStatus
  ) => {

    const token =
      localStorage.getItem("authToken");


    if (!token) {

      navigate("/login");

      return;

    }


    const api = axios.create({

      baseURL:
        `${API_URL}/api/admin`,

      headers: {
        Authorization:
          `Bearer ${token}`
      }

    });


    try {

      await api.patch(

        `/bookings/${bookingId}/status`,

        {
          bookingStatus
        }

      );


      setBookings(
        (currentBookings) =>

          currentBookings.map(
            (booking) =>

              booking.id === bookingId

                ? {
                    ...booking,
                    booking_status:
                      bookingStatus
                  }

                : booking
          )

      );


      await loadAdminData();


    } catch (requestError) {

      console.error(
        "UNABLE TO UPDATE BOOKING:",
        requestError
      );


      alert(
        requestError.response?.data?.message ||
        "Unable to update this booking."
      );

    }

  };


  // =========================================
  // HANDLE NOTIFICATION INPUT
  // =========================================

  const handleNotificationChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setNotificationData(
      (currentData) => ({

        ...currentData,

        [name]: value

      })
    );


    setNotificationSuccess("");

    setNotificationError("");

  };


  // =========================================
  // SEND NOTIFICATION
  // =========================================

  const sendNotification = async (e) => {

    e.preventDefault();


    setNotificationSuccess("");

    setNotificationError("");


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (
      !notificationData.title.trim()
    ) {

      setNotificationError(
        "Please enter a notification title."
      );

      return;

    }


    if (
      !notificationData.message.trim()
    ) {

      setNotificationError(
        "Please enter a notification message."
      );

      return;

    }


    const token =
      localStorage.getItem("authToken");


    if (!token) {

      navigate("/login");

      return;

    }


    try {

      setSendingNotification(true);


      const api = axios.create({

        baseURL:
          `${API_URL}/api/admin`,

        headers: {

          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json"

        }

      });


      console.log(
        "SENDING ADMIN NOTIFICATION:",
        notificationData
      );


      const response =
        await api.post(
          "/notifications",
          {
            userId:
              notificationData.userId,

            title:
              notificationData.title.trim(),

            message:
              notificationData.message.trim(),

            type:
              notificationData.type
          }
        );


      console.log(
        "NOTIFICATION RESPONSE:",
        response.data
      );


      setNotificationSuccess(

        response.data.message ||

        "Notification sent successfully."

      );


      // ---------------------------------------
      // RESET FORM
      // ---------------------------------------

      setNotificationData({

        userId: "all",

        title: "",

        message: "",

        type: "info"

      });


    } catch (requestError) {

      console.error(
        "SEND NOTIFICATION ERROR:",
        requestError
      );


      if (
        requestError.response?.status === 401 ||
        requestError.response?.status === 403
      ) {

        setNotificationError(

          requestError.response?.data?.message ||

          "You are not authorized to send notifications."

        );

        return;

      }


      setNotificationError(

        requestError.response?.data?.message ||

        "Unable to send notification."

      );


    } finally {

      setSendingNotification(false);

    }

  };


  // =========================================
  // FORMAT MONEY
  // =========================================

  const formatMoney = (amount) =>

    `XAF ${Number(
      amount || 0
    ).toLocaleString("en-GB")}`;


  // =========================================
  // ERROR SCREEN
  // =========================================

  if (error) {

    return (

      <>

        <Navbar />


        <main className="admin-page">

          <p className="admin-error">

            {error}

          </p>

        </main>


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


      <main className="admin-page">


        {/* =====================================
            HEADER
        ===================================== */}

        <div className="admin-header">

          <div>

            <p className="admin-label">
              BUSGO ADMIN
            </p>


            <h1>
              Admin Dashboard
            </h1>


            <span>
              Manage bookings and monitor your platform.
            </span>

          </div>


          <button
            onClick={loadAdminData}
          >
            Refresh Data
          </button>

        </div>


        {/* =====================================
            STATS
        ===================================== */}

        <section className="admin-stats">


          <div className="admin-stat-card">

            <span>
              Users
            </span>


            <strong>
              {stats?.totalUsers || 0}
            </strong>

          </div>


          <div className="admin-stat-card">

            <span>
              Total Bookings
            </span>


            <strong>
              {stats?.totalBookings || 0}
            </strong>

          </div>


          <div className="admin-stat-card">

            <span>
              Confirmed
            </span>


            <strong>
              {stats?.confirmedBookings || 0}
            </strong>

          </div>


          <div className="admin-stat-card">

            <span>
              Revenue
            </span>


            <strong>
              {formatMoney(
                stats?.totalRevenue
              )}
            </strong>

          </div>


        </section>


        {/* =====================================
            TABS
        ===================================== */}

        <div className="admin-tabs">


          <button
            className={
              activeTab === "bookings"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("bookings")
            }
          >
            Bookings
          </button>


          <button
            className={
              activeTab === "users"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("users")
            }
          >
            Users
          </button>


          <button
            className={
              activeTab === "notifications"
                ? "active"
                : ""
            }
            onClick={() => {

              setActiveTab(
                "notifications"
              );

              setNotificationSuccess("");

              setNotificationError("");

            }}
          >
            Notifications
          </button>


        </div>


        {/* =====================================
            BOOKINGS
        ===================================== */}

        {activeTab === "bookings" && (

          <section className="admin-table-card">

            <h2>
              All Bookings
            </h2>


            <div className="admin-table-scroll">

              <table>

                <thead>

                  <tr>

                    <th>
                      Ticket
                    </th>

                    <th>
                      Passenger
                    </th>

                    <th>
                      Route
                    </th>

                    <th>
                      Bus
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>


                  {bookings.length === 0 ? (

                    <tr>

                      <td colSpan="7">

                        No bookings found.

                      </td>

                    </tr>

                  ) : (

                    bookings.map(
                      (booking) => (

                        <tr
                          key={booking.id}
                        >


                          <td>
                            {booking.ticket_number}
                          </td>


                          <td>

                            {booking.passenger_name}

                            <small>
                              {booking.user_email}
                            </small>

                          </td>


                          <td>

                            {booking.departure}

                            {" → "}

                            {booking.destination}

                          </td>


                          <td>
                            {booking.bus_name}
                          </td>


                          <td>

                            {formatMoney(
                              booking.total_payment
                            )}

                          </td>


                          <td>

                            <span
                              className={`status ${
                                booking.booking_status
                                  ?.toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  ) || ""
                              }`}
                            >

                              {booking.booking_status}

                            </span>

                          </td>


                          <td>


                            {booking.booking_status ===
                            "Cancelled" ? (

                              <button
                                className="confirm-status-btn"
                                onClick={() =>
                                  updateBookingStatus(
                                    booking.id,
                                    "Confirmed"
                                  )
                                }
                              >
                                Restore
                              </button>

                            ) : (

                              <button
                                className="cancel-status-btn"
                                onClick={() =>
                                  updateBookingStatus(
                                    booking.id,
                                    "Cancelled"
                                  )
                                }
                              >
                                Cancel
                              </button>

                            )}


                          </td>


                        </tr>

                      )
                    )

                  )}


                </tbody>

              </table>

            </div>

          </section>

        )}


        {/* =====================================
            USERS
        ===================================== */}

        {activeTab === "users" && (

          <section className="admin-table-card">

            <h2>
              Registered Users
            </h2>


            <div className="admin-table-scroll">

              <table>

                <thead>

                  <tr>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Joined
                    </th>

                  </tr>

                </thead>


                <tbody>


                  {users.length === 0 ? (

                    <tr>

                      <td colSpan="5">

                        No users found.

                      </td>

                    </tr>

                  ) : (

                    users.map(
                      (user) => (

                        <tr
                          key={user.id}
                        >

                          <td>
                            {user.name}
                          </td>

                          <td>
                            {user.email}
                          </td>

                          <td>
                            {user.phone}
                          </td>

                          <td>
                            {user.role}
                          </td>

                          <td>

                            {user.created_at

                              ? String(
                                  user.created_at
                                ).slice(
                                  0,
                                  10
                                )

                              : "N/A"}

                          </td>

                        </tr>

                      )
                    )

                  )}


                </tbody>

              </table>

            </div>

          </section>

        )}


        {/* =====================================
            NOTIFICATIONS
        ===================================== */}

        {activeTab === "notifications" && (

          <section className="admin-table-card">

            <h2>
              Send Notification
            </h2>


            <p className="admin-notification-description">

              Send an announcement or important
              message directly to BusGo users.

            </p>


            {/* SUCCESS */}

            {notificationSuccess && (

              <div className="admin-notification-success">

                ✅ {notificationSuccess}

              </div>

            )}


            {/* ERROR */}

            {notificationError && (

              <div className="admin-notification-error">

                ⚠️ {notificationError}

              </div>

            )}


            <form
              className="admin-notification-form"
              onSubmit={sendNotification}
            >


              {/* RECIPIENT */}

              <div className="admin-form-group">

                <label>
                  Send To
                </label>


                <select
                  name="userId"
                  value={
                    notificationData.userId
                  }
                  onChange={
                    handleNotificationChange
                  }
                >

                  <option value="all">

                    📢 All Users

                  </option>


                  {users
                    .filter(
                      (user) =>
                        user.role !== "admin"
                    )
                    .map(
                      (user) => (

                        <option
                          key={user.id}
                          value={user.id}
                        >

                          {user.name}
                          {" — "}
                          {user.email}

                        </option>

                      )
                    )}

                </select>

              </div>


              {/* TYPE */}

              <div className="admin-form-group">

                <label>
                  Notification Type
                </label>


                <select
                  name="type"
                  value={
                    notificationData.type
                  }
                  onChange={
                    handleNotificationChange
                  }
                >

                  <option value="info">
                    🔔 General Information
                  </option>

                  <option value="success">
                    ✅ Success
                  </option>

                  <option value="warning">
                    ⚠️ Warning
                  </option>

                  <option value="booking">
                    🎫 Booking
                  </option>

                </select>

              </div>


              {/* TITLE */}

              <div className="admin-form-group">

                <label>
                  Notification Title
                </label>


                <input
                  type="text"
                  name="title"
                  value={
                    notificationData.title
                  }
                  onChange={
                    handleNotificationChange
                  }
                  placeholder="Enter notification title"
                  maxLength="150"
                />

              </div>


              {/* MESSAGE */}

              <div className="admin-form-group">

                <label>
                  Message
                </label>


                <textarea
                  name="message"
                  value={
                    notificationData.message
                  }
                  onChange={
                    handleNotificationChange
                  }
                  placeholder="Write your announcement here..."
                  rows="6"
                  maxLength="1000"
                />

              </div>


              {/* SEND BUTTON */}

              <button
                type="submit"
                className="send-notification-btn"
                disabled={
                  sendingNotification
                }
              >

                {sendingNotification

                  ? "Sending..."

                  : "📢 Send Notification"}

              </button>


            </form>

          </section>

        )}


      </main>


      <Footer />

    </>

  );

}


export default AdminDashboard;