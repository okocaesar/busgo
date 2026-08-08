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

import "./Notifications.css";


function Notifications() {

  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =========================================
  // GET AUTH TOKEN
  // =========================================

  const getToken = () => {
    return localStorage.getItem("authToken");
  };


  // =========================================
  // LOAD NOTIFICATIONS
  // =========================================

  const loadNotifications = useCallback(async () => {

    const token = getToken();

    // =========================================
    // USER NOT LOGGED IN
    // =========================================

    if (!token) {

      setLoading(false);

      navigate("/login");

      return;
    }


    try {

      setLoading(true);

      setError("");


      const response = await axios.get(
        `${API_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      console.log(
        "NOTIFICATIONS RESPONSE:",
        response.data
      );


      setNotifications(
        response.data.notifications || []
      );


    } catch (requestError) {

      console.error(
        "LOAD NOTIFICATIONS ERROR:",
        requestError
      );


      // =========================================
      // AUTHENTICATION ERROR
      // =========================================

      if (
        requestError.response?.status === 401
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

        return;
      }


      setError(
        requestError.response?.data?.message ||
        "Unable to load notifications."
      );


    } finally {

      setLoading(false);

    }

  }, [navigate]);


  // =========================================
  // LOAD WHEN PAGE OPENS
  // =========================================

  useEffect(() => {

    loadNotifications();

  }, [loadNotifications]);


  // =========================================
  // MARK ONE AS READ
  // =========================================

  const markAsRead = async (
    notificationId
  ) => {

    const token = getToken();


    if (!token) {

      navigate("/login");

      return;
    }


    try {

      await axios.patch(

        `${API_URL}/api/notifications/${notificationId}/read`,

        {},

        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }

      );


      setNotifications(
        (currentNotifications) =>

          currentNotifications.map(
            (notification) =>

              notification.id === notificationId
                ? {
                    ...notification,
                    is_read: 1
                  }
                : notification
          )

      );


    } catch (requestError) {

      console.error(
        "MARK NOTIFICATION ERROR:",
        requestError
      );


      if (
        requestError.response?.status === 401
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

        return;
      }


      alert(
        requestError.response?.data?.message ||
        "Unable to mark notification as read."
      );

    }

  };


  // =========================================
  // MARK ALL AS READ
  // =========================================

  const markAllAsRead = async () => {

    const token = getToken();


    if (!token) {

      navigate("/login");

      return;
    }


    try {

      await axios.patch(

        `${API_URL}/api/notifications/read-all`,

        {},

        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }

      );


      setNotifications(
        (currentNotifications) =>

          currentNotifications.map(
            (notification) => ({
              ...notification,
              is_read: 1
            })
          )

      );


    } catch (requestError) {

      console.error(
        "MARK ALL NOTIFICATIONS ERROR:",
        requestError
      );


      if (
        requestError.response?.status === 401
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

        return;
      }


      alert(
        requestError.response?.data?.message ||
        "Unable to mark notifications as read."
      );

    }

  };


  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {

    if (!date) {
      return "";
    }


    return new Date(date).toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  };


  // =========================================
  // UNREAD COUNT
  // =========================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        Number(notification.is_read) === 0
    ).length;


  // =========================================
  // PAGE
  // =========================================

  return (
    <>
      <Navbar />


      <main className="notifications-page">

        {/* =====================================
            HEADER
        ====================================== */}

        <section className="notifications-header">

          <div>

            <p className="notifications-label">
              BUSGO
            </p>


            <h1>
              Notifications
            </h1>


            <p>
              Stay updated with your BusGo
              account, bookings and important
              announcements.
            </p>

          </div>


          <div className="notification-actions">

            <button
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>


            {unreadCount > 0 && (

              <button
                onClick={markAllAsRead}
                className="mark-all-btn"
              >
                Mark All as Read
              </button>

            )}

          </div>

        </section>


        {/* =====================================
            CONTENT
        ====================================== */}

        <section className="notifications-container">


          {/* LOADING */}

          {loading && (

            <div className="notifications-empty">

              <div className="notification-spinner">
                ⏳
              </div>


              <p>
                Loading notifications...
              </p>

            </div>

          )}


          {/* ERROR */}

          {!loading && error && (

            <div className="notifications-error">

              <p>
                {error}
              </p>


              <button
                onClick={loadNotifications}
              >
                Try Again
              </button>

            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            notifications.length === 0 && (

              <div className="notifications-empty">

                <div className="empty-bell">
                  🔔
                </div>


                <h2>
                  No notifications
                </h2>


                <p>
                  You're all caught up!
                </p>

              </div>

            )}


          {/* NOTIFICATIONS */}

          {!loading &&
            !error &&
            notifications.length > 0 && (

              <div className="notification-list">

                {notifications.map(
                  (notification) => (

                    <article
                      key={notification.id}
                      className={`notification-card ${
                        Number(
                          notification.is_read
                        ) === 0
                          ? "unread"
                          : ""
                      }`}
                    >

                      {/* ICON */}

                      <div className="notification-icon-box">

                        {notification.type ===
                        "booking"
                          ? "🎫"
                          : notification.type ===
                            "warning"
                          ? "⚠️"
                          : notification.type ===
                            "success"
                          ? "✅"
                          : "🔔"}

                      </div>


                      {/* CONTENT */}

                      <div className="notification-content">

                        <div className="notification-title-row">

                          <h3>
                            {notification.title}
                          </h3>


                          {Number(
                            notification.is_read
                          ) === 0 && (

                            <span className="unread-label">
                              NEW
                            </span>

                          )}

                        </div>


                        <p>
                          {notification.message}
                        </p>


                        <span className="notification-date">
                          {formatDate(
                            notification.created_at
                          )}
                        </span>

                      </div>


                      {/* MARK AS READ */}

                      {Number(
                        notification.is_read
                      ) === 0 && (

                        <button
                          className="read-button"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                        >
                          Mark as read
                        </button>

                      )}

                    </article>

                  )
                )}

              </div>

            )}

        </section>

      </main>


      <Footer />

    </>
  );
}


export default Notifications;