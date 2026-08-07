import React, {
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

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [error, setError] = useState("");

  const token = localStorage.getItem("authToken");

  const api = axios.create({
    baseURL: `${API_URL}/api/admin`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const loadAdminData = async () => {
    try {
      const [
        statsResponse,
        usersResponse,
        bookingsResponse
      ] = await Promise.all([
        api.get("/stats"),
        api.get("/users"),
        api.get("/bookings")
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data.users || []);
      setBookings(bookingsResponse.data.bookings || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Unable to load admin information."
      );

      if (
        requestError.response?.status === 401 ||
        requestError.response?.status === 403
      ) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );

    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
      return;
    }

    loadAdminData();
  }, [navigate]);

  const updateBookingStatus = async (
    bookingId,
    bookingStatus
  ) => {
    try {
      await api.patch(
        `/bookings/${bookingId}/status`,
        { bookingStatus }
      );

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                booking_status: bookingStatus
              }
            : booking
        )
      );

      loadAdminData();
    } catch (requestError) {
      alert(
        requestError.response?.data?.message ||
        "Unable to update this booking."
      );
    }
  };

  const formatMoney = (amount) =>
    `XAF ${Number(amount || 0).toLocaleString("en-GB")}`;

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

  return (
    <>
      <Navbar />

      <main className="admin-page">
        <div className="admin-header">
          <div>
            <p className="admin-label">BUSGO ADMIN</p>
            <h1>Admin Dashboard</h1>
            <span>
              Manage bookings and monitor your platform.
            </span>
          </div>

          <button onClick={loadAdminData}>
            Refresh Data
          </button>
        </div>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Users</span>
            <strong>{stats?.totalUsers || 0}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Total Bookings</span>
            <strong>{stats?.totalBookings || 0}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Confirmed</span>
            <strong>{stats?.confirmedBookings || 0}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Revenue</span>
            <strong>
              {formatMoney(stats?.totalRevenue)}
            </strong>
          </div>
        </section>

        <div className="admin-tabs">
          <button
            className={
              activeTab === "bookings" ? "active" : ""
            }
            onClick={() => setActiveTab("bookings")}
          >
            Bookings
          </button>

          <button
            className={
              activeTab === "users" ? "active" : ""
            }
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>

        {activeTab === "bookings" && (
          <section className="admin-table-card">
            <h2>All Bookings</h2>

            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Passenger</th>
                    <th>Route</th>
                    <th>Bus</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.ticket_number}</td>

                      <td>
                        {booking.passenger_name}
                        <small>
                          {booking.user_email}
                        </small>
                      </td>

                      <td>
                        {booking.departure} →{" "}
                        {booking.destination}
                      </td>

                      <td>{booking.bus_name}</td>

                      <td>
                        {formatMoney(
                          booking.total_payment
                        )}
                      </td>

                      <td>
                        <span
                          className={`status ${booking.booking_status?.toLowerCase()}`}
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
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "users" && (
          <section className="admin-table-card">
            <h2>Registered Users</h2>

            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.role}</td>
                      <td>
                        {String(user.created_at).slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

export default AdminDashboard;