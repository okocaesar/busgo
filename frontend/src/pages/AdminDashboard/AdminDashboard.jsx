import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiGrid,
  FiMap,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiBell,
  FiRefreshCw,
  FiX,
  FiMenu,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiUserPlus,
  FiGlobe,
  FiSun,
  FiMoon,
  FiMonitor,
  FiInfo,
  FiExternalLink,
  FiSearch,
  FiEye,
  FiClock,
  FiMessageSquare,
  FiUser,
  FiAlertCircle
} from "react-icons/fi";

import { API_URL } from "../../api";
import logo from "../../assets/logo.png";
import packageJson from "../../../package.json";

import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  // =========================================
  // SIDEBAR
  // =========================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================================
  // ADMIN THEME
  // =========================================

  const [theme, setTheme] = useState(
    localStorage.getItem("busgo-admin-theme") || "light"
  );

  // =========================================
  // LANGUAGE
  // =========================================

  const [language, setLanguage] = useState(
    localStorage.getItem("busgo-admin-language") || "English"
  );

  // =========================================
  // ADMIN DATA
  // =========================================

  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);

  const [bookings, setBookings] = useState([]);

  const [payments, setPayments] = useState([]);

  const [routes, setRoutes] = useState([]);

  // =========================================
  // REPORTS
  // =========================================

  const [reports, setReports] = useState([]);

  const [reportsLoading, setReportsLoading] = useState(false);

  const [reportsError, setReportsError] = useState("");

  const [reportFilter, setReportFilter] = useState("all");

  const [reportSearch, setReportSearch] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);

  const [updatingReportId, setUpdatingReportId] = useState(null);

  // =========================================
  // ACTIVE TAB
  // =========================================

  const [activeTab, setActiveTab] = useState("dashboard");

  const [error, setError] = useState("");

  // =========================================
  // ADMIN CREATE BOOKING
  // =========================================

  const [adminBooking, setAdminBooking] = useState({
    userId: "",
    name: "",
    email: "",
    phone: "",
    from: "",
    to: "",
    busType: "",
    seats: 1,
    date: ""
  });

  const [creatingBooking, setCreatingBooking] = useState(false);

  const [bookingSuccess, setBookingSuccess] = useState("");

  const [bookingError, setBookingError] = useState("");

  // =========================================
  // NOTIFICATION FORM
  // =========================================

  const [notificationData, setNotificationData] = useState({
    userId: "all",
    title: "",
    message: "",
    type: "info"
  });

  const [sendingNotification, setSendingNotification] = useState(false);

  const [notificationSuccess, setNotificationSuccess] = useState("");

  const [notificationError, setNotificationError] = useState("");

  // =========================================
  // CREATE ADMIN API
  // =========================================

  const getAdminApi = useCallback(() => {
    const token = localStorage.getItem("authToken");

    return axios.create({
      baseURL: `${API_URL}/api/admin`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }, []);

  // =========================================
  // LOAD REPORTS
  // =========================================

  const loadReports = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setReportsLoading(true);
      setReportsError("");

      const api = getAdminApi();

      const response = await api.get("/reports");

      const receivedReports =
        response.data?.reports ||
        response.data?.data ||
        [];

      setReports(
        Array.isArray(receivedReports)
          ? receivedReports
          : []
      );
    } catch (requestError) {
      console.error(
        "FAILED TO LOAD REPORTS:",
        requestError
      );

      if (
        requestError.response?.status === 401 ||
        requestError.response?.status === 403
      ) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("currentUser");

        navigate("/login");

        return;
      }

      setReportsError(
        requestError.response?.data?.message ||
          "Unable to load reports."
      );
    } finally {
      setReportsLoading(false);
    }
  }, [getAdminApi, navigate]);

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
        bookingsResponse,
        paymentsResponse,
        routesResponse
      ] = await Promise.all([
        api.get("/stats"),
        api.get("/users"),
        api.get("/bookings"),
        api.get("/payments"),
        api.get("/routes")
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

      setPayments(
        paymentsResponse.data.payments || []
      );

      setRoutes(
        routesResponse.data.routes || []
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
  // LOAD REPORTS WHEN REPORT PAGE OPENS
  // =========================================

  useEffect(() => {
    if (activeTab === "reports") {
      loadReports();
    }
  }, [
    activeTab,
    loadReports
  ]);

  // =========================================
  // UPDATE REPORT STATUS
  // =========================================

  const updateReportStatus = async (
    reportId,
    status
  ) => {
    const token =
      localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!reportId) {
      return;
    }

    try {
      setUpdatingReportId(reportId);

      const api = getAdminApi();

      const response =
        await api.patch(
          `/reports/${reportId}/status`,
          {
            status
          }
        );

      const updatedReport =
        response.data?.report;

      setReports(
        currentReports =>
          currentReports.map(
            report =>
              String(report.id) ===
              String(reportId)
                ? {
                    ...report,
                    ...(updatedReport ||
                      {}),
                    status:
                      updatedReport?.status ||
                      status
                  }
                : report
          )
      );

      setSelectedReport(
        currentReport => {
          if (
            !currentReport ||
            String(currentReport.id) !==
              String(reportId)
          ) {
            return currentReport;
          }

          return {
            ...currentReport,
            ...(updatedReport ||
              {}),
            status:
              updatedReport?.status ||
              status
          };
        }
      );
    } catch (requestError) {
      console.error(
        "UPDATE REPORT STATUS ERROR:",
        requestError
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

        return;
      }

      alert(
        requestError.response?.data?.message ||
          "Unable to update report status."
      );
    } finally {
      setUpdatingReportId(null);
    }
  };

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
        currentBookings =>
          currentBookings.map(
            booking =>
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
  // ACCEPT PAYMENT REVERSAL
  // =========================================

  const acceptPaymentReversal = async (
    paymentId
  ) => {
    const token =
      localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to accept this payment reversal?"
      )
    ) {
      return;
    }

    try {
      const api = axios.create({
        baseURL:
          `${API_URL}/api/admin`,
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      });

      await api.patch(
        `/payments/${paymentId}/accept-reversal`
      );

      await loadAdminData();

      alert(
        "Payment reversal accepted successfully."
      );
    } catch (requestError) {
      console.error(
        "ACCEPT REVERSAL ERROR:",
        requestError
      );

      alert(
        requestError.response?.data?.message ||
          "Unable to accept payment reversal."
      );
    }
  };

  // =========================================
  // DENY PAYMENT REVERSAL
  // =========================================

  const denyPaymentReversal = async (
    paymentId
  ) => {
    const token =
      localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to deny this payment reversal?"
      )
    ) {
      return;
    }

    try {
      const api = axios.create({
        baseURL:
          `${API_URL}/api/admin`,
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      });

      await api.patch(
        `/payments/${paymentId}/deny-reversal`
      );

      await loadAdminData();

      alert(
        "Payment reversal request denied."
      );
    } catch (requestError) {
      console.error(
        "DENY REVERSAL ERROR:",
        requestError
      );

      alert(
        requestError.response?.data?.message ||
          "Unable to deny payment reversal."
      );
    }
  };

  // =========================================
  // HANDLE NOTIFICATION INPUT
  // =========================================

  const handleNotificationChange = (
    e
  ) => {
    const {
      name,
      value
    } = e.target;

    setNotificationData(
      currentData => ({
        ...currentData,
        [name]: value
      })
    );

    setNotificationSuccess("");

    setNotificationError("");
  };

  // =========================================
  // HANDLE ADMIN BOOKING INPUT
  // =========================================

  const handleAdminBookingChange = (
    e
  ) => {
    const {
      name,
      value
    } = e.target;

    setAdminBooking(
      currentBooking => ({
        ...currentBooking,
        [name]: value
      })
    );

    setBookingSuccess("");

    setBookingError("");
  };

  // =========================================
  // SEND NOTIFICATION
  // =========================================

  const sendNotification = async (
    e
  ) => {
    e.preventDefault();

    setNotificationSuccess("");

    setNotificationError("");

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

      setNotificationSuccess(
        response.data.message ||
          "Notification sent successfully."
      );

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

      setNotificationError(
        requestError.response?.data?.message ||
          "Unable to send notification."
      );
    } finally {
      setSendingNotification(false);
    }
  };

  // =========================================
  // CREATE BOOKING FROM ADMIN DASHBOARD
  // =========================================

  const createAdminBooking = async (
    e
  ) => {
    e.preventDefault();

    setBookingSuccess("");

    setBookingError("");

    if (!adminBooking.userId) {
      setBookingError(
        "Please select a customer."
      );

      return;
    }

    if (
      !adminBooking.from ||
      !adminBooking.to
    ) {
      setBookingError(
        "Please select departure and destination."
      );

      return;
    }

    if (
      adminBooking.from ===
      adminBooking.to
    ) {
      setBookingError(
        "Departure and destination cannot be the same."
      );

      return;
    }

    if (!adminBooking.busType) {
      setBookingError(
        "Please select a bus type."
      );

      return;
    }

    if (!adminBooking.date) {
      setBookingError(
        "Please select a travel date."
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
      setCreatingBooking(true);

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

      const response =
        await api.post(
          "/bookings",
          {
            userId:
              adminBooking.userId,

            name:
              adminBooking.name,

            email:
              adminBooking.email,

            phone:
              adminBooking.phone,

            from:
              adminBooking.from,

            to:
              adminBooking.to,

            busType:
              adminBooking.busType,

            seats:
              Number(
                adminBooking.seats
              ),

            date:
              adminBooking.date
          }
        );

      setBookingSuccess(
        response.data.message ||
          "Booking created successfully."
      );

      setAdminBooking({
        userId: "",
        name: "",
        email: "",
        phone: "",
        from: "",
        to: "",
        busType: "",
        seats: 1,
        date: ""
      });

      await loadAdminData();
    } catch (requestError) {
      console.error(
        "CREATE ADMIN BOOKING ERROR:",
        requestError
      );

      setBookingError(
        requestError.response?.data?.message ||
          "Unable to create booking."
      );
    } finally {
      setCreatingBooking(false);
    }
  };

  // =========================================
  // FORMAT MONEY
  // =========================================

  const formatMoney = amount =>
    `XAF ${Number(
      amount || 0
    ).toLocaleString("en-GB")}`;

  // =========================================
  // FORMAT REPORT DATE
  // =========================================

  const formatReportDate = date => {
    if (!date) {
      return "N/A";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return String(date);
    }

    return parsedDate.toLocaleString(
      "en-GB"
    );
  };

  // =========================================
  // NORMALIZE REPORT STATUS
  // =========================================

  const normalizeReportStatus =
    status => {
      if (!status) {
        return "Pending";
      }

      const value =
        String(status)
          .trim()
          .toLowerCase();

      if (
        value === "resolved" ||
        value === "closed" ||
        value === "completed"
      ) {
        return "Resolved";
      }

      if (
        value === "rejected" ||
        value === "declined"
      ) {
        return "Rejected";
      }

      if (
        value === "in progress" ||
        value === "in-progress" ||
        value === "processing"
      ) {
        return "In Progress";
      }

      return "Pending";
    };

  // =========================================
  // REPORT COUNTS
  // =========================================

  const pendingReports =
    reports.filter(
      report =>
        normalizeReportStatus(
          report.status
        ) === "Pending"
    ).length;

  const inProgressReports =
    reports.filter(
      report =>
        normalizeReportStatus(
          report.status
        ) === "In Progress"
    ).length;

  const resolvedReports =
    reports.filter(
      report =>
        normalizeReportStatus(
          report.status
        ) === "Resolved"
    ).length;

  const rejectedReports =
    reports.filter(
      report =>
        normalizeReportStatus(
          report.status
        ) === "Rejected"
    ).length;

  // =========================================
  // FILTER REPORTS
  // =========================================

  const filteredReports =
    reports.filter(report => {
      const status =
        normalizeReportStatus(
          report.status
        );

      const matchesFilter =
        reportFilter === "all" ||
        status.toLowerCase() ===
          reportFilter.toLowerCase();

      const searchValue =
        reportSearch
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return matchesFilter;
      }

      const searchableText = [
        report.id,
        report.subject,
        report.message,
        report.user_name,
        report.user_email,
        report.name,
        report.email,
        report.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        searchableText.includes(
          searchValue
        )
      );
    });

  // =========================================
  // CHANGE ADMIN THEME
  // =========================================

  const changeTheme = newTheme => {
    setTheme(newTheme);

    localStorage.setItem(
      "busgo-admin-theme",
      newTheme
    );
  };

  // =========================================
  // CHANGE LANGUAGE
  // =========================================

  const changeLanguage =
    newLanguage => {
      setLanguage(newLanguage);

      localStorage.setItem(
        "busgo-admin-language",
        newLanguage
      );
    };

  // =========================================
  // VIEW BUSGO AS CLIENT
  // =========================================

  const viewSiteAsClient = () => {
    setSidebarOpen(false);

    navigate("/");
  };

  // =========================================
  // LOGOUT FROM SETTINGS
  // =========================================

  const logoutFromSettings = () => {
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
  };

  // =========================================
  // SIDEBAR NAVIGATION
  // =========================================

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FiGrid />
    },

    {
      id: "create-booking",
      label: "Create Booking",
      icon: <FiCalendar />
    },

    {
      id: "routes",
      label: "Routes",
      icon: <FiMap />,
      future: true
    },

    {
      id: "bookings",
      label: "Bookings",
      icon: <FiCalendar />
    },

    {
      id: "users",
      label: "Users",
      icon: <FiUsers />
    },

    {
      id: "payments",
      label: "Payments",
      icon: <FiCreditCard />
    },

    {
      id: "notifications",
      label: "Notifications",
      icon: <FiBell />
    },

    {
      id: "reports",
      label: "Reports",
      icon: <FiBarChart2 />
    },

    {
      id: "settings",
      label: "Settings",
      icon: <FiSettings />
    }
  ];

  // =========================================
  // HANDLE SIDEBAR NAVIGATION
  // =========================================

  const handleNavigation =
    item => {
      if (item.future) {
        return;
      }

      setActiveTab(item.id);

      setNotificationSuccess("");

      setNotificationError("");

      setBookingSuccess("");

      setBookingError("");

      setSidebarOpen(false);
    };

  // =========================================
  // ERROR SCREEN
  // =========================================

  if (error) {
    return (
      <main className="admin-shell">
        <aside className="admin-sidebar">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <img
                src={logo}
                alt="BusGo"
                className="sidebar-logo"
              />
            </div>
          </div>
        </aside>

        <div className="admin-main">
          <div className="admin-error-card">
            <FiXCircle />

            <p>
              {error}
            </p>

            <button
              onClick={loadAdminData}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div
      className={`admin-shell admin-theme-${theme}`}
    >

      {/* =====================================
          MOBILE OVERLAY
      ===================================== */}

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside
        className={`admin-sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        {/* SIDEBAR TOP */}

        <div className="sidebar-top">

          <div className="sidebar-brand">

            <img
              src={logo}
              alt="BusGo"
              className="sidebar-logo"
            />

          </div>

          {/* MOBILE CLOSE BUTTON */}

          <button
            type="button"
            className="sidebar-close"
            onClick={() =>
              setSidebarOpen(false)
            }
            aria-label="Close sidebar"
          >

            <FiX />

          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-navigation">

          {navigationItems.map(
            item => (
              <button
                type="button"
                key={item.id}
                className={`sidebar-link ${
                  activeTab === item.id
                    ? "active"
                    : ""
                } ${
                  item.future
                    ? "future-link"
                    : ""
                }`}
                onClick={() =>
                  handleNavigation(item)
                }
              >

                <span className="sidebar-icon">

                  {item.icon}

                </span>

                <span>

                  {item.label}

                </span>

              </button>
            )
          )}

        </nav>

      </aside>

      {/* =====================================
          MAIN AREA
      ===================================== */}

      <div className="admin-main">

        {/* MOBILE HAMBURGER */}

        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={() =>
            setSidebarOpen(true)
          }
          aria-label="Open admin menu"
          aria-expanded={sidebarOpen}
        >

          <FiMenu />

          <span>
            Menu
          </span>

        </button>

        {/* CONTENT */}

        <main className="admin-content">

          {/* ===================================
              DASHBOARD
          =================================== */}

          {activeTab === "dashboard" && (
            <>

              <div className="dashboard-heading">

                <div>

                  <h1>
                    Overview
                  </h1>

                  <p>
                    Welcome back. Here's what's
                    happening with BusGo.
                  </p>

                </div>

                <button
                  type="button"
                  className="refresh-btn"
                  onClick={
                    loadAdminData
                  }
                >

                  <FiRefreshCw />

                  Refresh

                </button>

              </div>

              {/* STAT CARDS */}

              <section className="admin-stats">

                <div className="admin-stat-card">

                  <div className="stat-card-top">

                    <span>
                      Total Bookings
                    </span>

                    <div className="stat-icon blue">
                      <FiCalendar />
                    </div>

                  </div>

                  <strong>
                    {stats?.totalBookings ||
                      0}
                  </strong>

                  <small>
                    Total bookings on platform
                  </small>

                </div>

                <div className="admin-stat-card">

                  <div className="stat-card-top">

                    <span>
                      Total Users
                    </span>

                    <div className="stat-icon green">
                      <FiUsers />
                    </div>

                  </div>

                  <strong>
                    {stats?.totalUsers ||
                      0}
                  </strong>

                  <small>
                    Registered BusGo users
                  </small>

                </div>

                <div className="admin-stat-card">

                  <div className="stat-card-top">

                    <span>
                      Total Revenue
                    </span>

                    <div className="stat-icon purple">
                      <FiDollarSign />
                    </div>

                  </div>

                  <strong className="revenue-value">

                    {formatMoney(
                      stats?.totalRevenue
                    )}

                  </strong>

                  <small>
                    Confirmed booking revenue
                  </small>

                </div>

                <div className="admin-stat-card">

                  <div className="stat-card-top">

                    <span>
                      Confirmed Bookings
                    </span>

                    <div className="stat-icon orange">
                      <FiCheckCircle />
                    </div>

                  </div>

                  <strong>
                    {stats?.confirmedBookings ||
                      0}
                  </strong>

                  <small>
                    Successfully confirmed
                  </small>

                </div>

              </section>

              {/* QUICK OVERVIEW */}

              <section className="dashboard-overview-grid">

                {/* RECENT BOOKINGS */}

                <div className="dashboard-card">

                  <div className="dashboard-card-header">

                    <div>

                      <h2>
                        Recent Bookings
                      </h2>

                      <p>
                        Latest bookings on BusGo
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "bookings"
                        )
                      }
                    >
                      View All
                    </button>

                  </div>

                  <div className="recent-bookings">

                    {bookings.length ===
                    0 ? (
                      <div className="dashboard-empty">
                        No bookings found.
                      </div>
                    ) : (
                      bookings
                        .slice(0, 5)
                        .map(
                          booking => (
                            <div
                              className="recent-booking"
                              key={
                                booking.id
                              }
                            >

                              <div className="booking-avatar">
                                <FiCalendar />
                              </div>

                              <div className="booking-summary">

                                <strong>
                                  {
                                    booking.passenger_name
                                  }
                                </strong>

                                <span>

                                  {
                                    booking.departure
                                  }

                                  {" → "}

                                  {
                                    booking.destination
                                  }

                                </span>

                              </div>

                              <div className="booking-right">

                                <strong>

                                  {formatMoney(
                                    booking.total_payment
                                  )}

                                </strong>

                                <span
                                  className={`status ${
                                    booking.booking_status
                                      ?.toLowerCase()
                                      .replace(
                                        /\s+/g,
                                        "-"
                                      ) ||
                                    ""
                                  }`}
                                >

                                  {
                                    booking.booking_status
                                  }

                                </span>

                              </div>

                            </div>
                          )
                        )
                    )}

                  </div>

                </div>

                {/* PLATFORM SUMMARY */}

                <div className="dashboard-card">

                  <div className="dashboard-card-header">

                    <div>

                      <h2>
                        Platform Summary
                      </h2>

                      <p>
                        Current BusGo statistics
                      </p>

                    </div>

                  </div>

                  <div className="summary-list">

                    <div className="summary-item">

                      <div className="summary-icon">
                        <FiUsers />
                      </div>

                      <div>

                        <span>
                          Registered Users
                        </span>

                        <strong>
                          {stats?.totalUsers ||
                            0}
                        </strong>

                      </div>

                    </div>

                    <div className="summary-item">

                      <div className="summary-icon">
                        <FiCalendar />
                      </div>

                      <div>

                        <span>
                          Total Bookings
                        </span>

                        <strong>
                          {stats?.totalBookings ||
                            0}
                        </strong>

                      </div>

                    </div>

                    <div className="summary-item">

                      <div className="summary-icon">
                        <FiCheckCircle />
                      </div>

                      <div>

                        <span>
                          Confirmed
                        </span>

                        <strong>
                          {stats?.confirmedBookings ||
                            0}
                        </strong>

                      </div>

                    </div>

                    <div className="summary-item">

                      <div className="summary-icon">
                        <FiXCircle />
                      </div>

                      <div>

                        <span>
                          Cancelled
                        </span>

                        <strong>
                          {stats?.cancelledBookings ||
                            0}
                        </strong>

                      </div>

                    </div>

                  </div>

                </div>

              </section>

            </>
          )}

          {/* ===================================
              CREATE BOOKING
          =================================== */}

          {activeTab ===
            "create-booking" && (

            <section className="admin-table-card create-booking-panel">

              <div className="section-heading">

                <div>

                  <h1>
                    Create Booking
                  </h1>

                  <p>
                    Create a BusGo booking on behalf of a customer.
                  </p>

                </div>

                <div className="notification-heading-icon">
                  <FiCalendar />
                </div>

              </div>

              {bookingSuccess && (
                <div className="admin-notification-success">

                  <FiCheckCircle />

                  <span>
                    {bookingSuccess}
                  </span>

                </div>
              )}

              {bookingError && (
                <div className="admin-notification-error">

                  <FiXCircle />

                  <span>
                    {bookingError}
                  </span>

                </div>
              )}

              <form
                className="admin-notification-form"
                onSubmit={
                  createAdminBooking
                }
              >

                {/* CUSTOMER */}

                <div className="admin-form-group">

                  <label>
                    Customer
                  </label>

                  <select
                    name="userId"
                    value={
                      adminBooking.userId
                    }
                    onChange={e => {

                      const selectedUser =
                        users.find(
                          user =>
                            String(
                              user.id
                            ) ===
                            String(
                              e.target
                                .value
                            )
                        );

                      setAdminBooking({
                        ...adminBooking,
                        userId:
                          e.target
                            .value,
                        name:
                          selectedUser?.name ||
                          "",
                        email:
                          selectedUser?.email ||
                          "",
                        phone:
                          selectedUser?.phone ||
                          ""
                      });

                      setBookingSuccess(
                        ""
                      );

                      setBookingError(
                        ""
                      );

                    }}
                  >

                    <option value="">
                      Select customer
                    </option>

                    {users
                      .filter(
                        user =>
                          user.role !==
                          "admin"
                      )
                      .map(user => (
                        <option
                          key={user.id}
                          value={
                            user.id
                          }
                        >

                          {user.name}
                          {" — "}
                          {user.email}

                        </option>
                      ))}

                  </select>

                </div>

                {/* CUSTOMER INFORMATION */}

                <div className="form-grid">

                  <div className="admin-form-group">

                    <label>
                      Customer Name
                    </label>

                    <input
                      type="text"
                      value={
                        adminBooking.name
                      }
                      readOnly
                    />

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Phone
                    </label>

                    <input
                      type="text"
                      value={
                        adminBooking.phone
                      }
                      readOnly
                    />

                  </div>

                </div>

                {/* ROUTE */}

                <div className="form-grid">

                  <div className="admin-form-group">

                    <label>
                      Departure
                    </label>

                    <select
                      name="from"
                      value={
                        adminBooking.from
                      }
                      onChange={
                        handleAdminBookingChange
                      }
                    >

                      <option value="">
                        Select departure
                      </option>

                      {[
                        ...new Set(
                          routes.map(
                            route =>
                              route.departure
                          )
                        )
                      ].map(city => (

                        <option
                          key={city}
                          value={city}
                        >
                          {city}
                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Destination
                    </label>

                    <select
                      name="to"
                      value={
                        adminBooking.to
                      }
                      onChange={
                        handleAdminBookingChange
                      }
                    >

                      <option value="">
                        Select destination
                      </option>

                      {[
                        ...new Set(
                          routes.map(
                            route =>
                              route.destination
                          )
                        )
                      ].map(city => (

                        <option
                          key={city}
                          value={city}
                        >
                          {city}
                        </option>

                      ))}

                    </select>

                  </div>

                </div>

                {/* BUS + SEATS + DATE */}

                <div className="form-grid">

                  <div className="admin-form-group">

                    <label>
                      Bus Type
                    </label>

                    <select
                      name="busType"
                      value={
                        adminBooking.busType
                      }
                      onChange={
                        handleAdminBookingChange
                      }
                    >

                      <option value="">
                        Select bus type
                      </option>

                      <option value="Shuttle">
                        Shuttle
                      </option>

                      <option value="Standard">
                        Standard
                      </option>

                      <option value="VIP Coach">
                        VIP Coach
                      </option>

                    </select>

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Seats
                    </label>

                    <input
                      type="number"
                      name="seats"
                      min="1"
                      max="10"
                      value={
                        adminBooking.seats
                      }
                      onChange={
                        handleAdminBookingChange
                      }
                    />

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Travel Date
                    </label>

                    <input
                      type="date"
                      name="date"
                      value={
                        adminBooking.date
                      }
                      onChange={
                        handleAdminBookingChange
                      }
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  className="send-notification-btn"
                  disabled={
                    creatingBooking
                  }
                >

                  <FiCalendar />

                  {creatingBooking
                    ? "Creating Booking..."
                    : "Create Booking"}

                </button>

              </form>

            </section>
          )}

          {/* ===================================
              BOOKINGS
          =================================== */}

          {activeTab ===
            "bookings" && (

            <section className="admin-table-card">

              <div className="section-heading">

                <div>

                  <h1>
                    Bookings
                  </h1>

                  <p>
                    Manage all BusGo bookings.
                  </p>

                </div>

                <button
                  type="button"
                  className="refresh-btn"
                  onClick={
                    loadAdminData
                  }
                >

                  <FiRefreshCw />

                  Refresh

                </button>

              </div>

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

                    {bookings.length ===
                    0 ? (
                      <tr>
                        <td colSpan="7">
                          No bookings found.
                        </td>
                      </tr>
                    ) : (
                      bookings.map(
                        booking => (
                          <tr
                            key={
                              booking.id
                            }
                          >

                            <td>
                              <strong>
                                {
                                  booking.ticket_number
                                }
                              </strong>
                            </td>

                            <td>

                              <strong>
                                {
                                  booking.passenger_name
                                }
                              </strong>

                              <small>
                                {
                                  booking.user_email
                                }
                              </small>

                            </td>

                            <td>

                              {
                                booking.departure
                              }

                              <span className="route-arrow">
                                →
                              </span>

                              {
                                booking.destination
                              }

                            </td>

                            <td>
                              {
                                booking.bus_name
                              }
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
                                    ) ||
                                  ""
                                }`}
                              >

                                {
                                  booking.booking_status
                                }

                              </span>

                            </td>

                            <td>

                              {
                                booking.booking_status ===
                                "Cancelled" ? (

                                  <button
                                    type="button"
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
                                    type="button"
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

                                )
                              }

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

          {/* ===================================
              USERS
          =================================== */}

          {activeTab ===
            "users" && (

            <section className="admin-table-card">

              <div className="section-heading">

                <div>

                  <h1>
                    Users
                  </h1>

                  <p>
                    Manage registered BusGo users.
                  </p>

                </div>

                <div className="section-count">

                  <FiUserPlus />

                  {users.length} Users

                </div>

              </div>

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

                    {users.length ===
                    0 ? (

                      <tr>

                        <td colSpan="5">
                          No users found.
                        </td>

                      </tr>

                    ) : (

                      users.map(
                        user => (

                          <tr
                            key={
                              user.id
                            }
                          >

                            <td>

                              <div className="user-cell">

                                <div className="user-avatar">

                                  {user.name
                                    ?.charAt(
                                      0
                                    )
                                    ?.toUpperCase()}

                                </div>

                                <strong>
                                  {
                                    user.name
                                  }
                                </strong>

                              </div>

                            </td>

                            <td>
                              {
                                user.email
                              }
                            </td>

                            <td>
                              {
                                user.phone
                              }
                            </td>

                            <td>

                              <span
                                className={`role-badge ${
                                  user.role ===
                                  "admin"
                                    ? "admin-role"
                                    : ""
                                }`}
                              >

                                {
                                  user.role
                                }

                              </span>

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

          {/* ===================================
              NOTIFICATIONS
          =================================== */}

          {activeTab ===
            "notifications" && (

            <section className="admin-table-card notification-panel">

              <div className="section-heading">

                <div>

                  <h1>
                    Notifications
                  </h1>

                  <p>
                    Send announcements and important
                    messages to BusGo users.
                  </p>

                </div>

                <div className="notification-heading-icon">

                  <FiBell />

                </div>

              </div>

              {notificationSuccess && (
                <div className="admin-notification-success">

                  <FiCheckCircle />

                  <span>
                    {
                      notificationSuccess
                    }
                  </span>

                </div>
              )}

              {notificationError && (
                <div className="admin-notification-error">

                  <FiXCircle />

                  <span>
                    {
                      notificationError
                    }
                  </span>

                </div>
              )}

              <form
                className="admin-notification-form"
                onSubmit={
                  sendNotification
                }
              >

                <div className="form-grid">

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
                          user =>
                            user.role !==
                            "admin"
                        )
                        .map(
                          user => (
                            <option
                              key={
                                user.id
                              }
                              value={
                                user.id
                              }
                            >

                              {
                                user.name
                              }
                              {" — "}
                              {
                                user.email
                              }

                            </option>
                          )
                        )}

                    </select>

                  </div>

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

                </div>

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

                <button
                  type="submit"
                  className="send-notification-btn"
                  disabled={
                    sendingNotification
                  }
                >

                  <FiBell />

                  {sendingNotification
                    ? "Sending..."
                    : "Send Notification"}

                </button>

              </form>

            </section>
          )}

          {/* ===================================
              PAYMENTS
          =================================== */}

          {activeTab ===
            "payments" && (

            <section className="admin-table-card payments-panel">

              <div className="section-heading">

                <div>

                  <h1>
                    Payments
                  </h1>

                  <p>
                    View and manage all BusGo payment transactions.
                  </p>

                </div>

                <button
                  type="button"
                  className="refresh-btn"
                  onClick={
                    loadAdminData
                  }
                >

                  <FiRefreshCw />

                  Refresh

                </button>

              </div>

              <div className="payment-summary">

                <div className="payment-summary-card">

                  <span>
                    Successful
                  </span>

                  <strong>

                    {
                      payments.filter(
                        payment =>
                          payment.status ===
                          "Successful"
                      ).length
                    }

                  </strong>

                </div>

                <div className="payment-summary-card reversal">

                  <span>
                    Requested Reversal
                  </span>

                  <strong>

                    {
                      payments.filter(
                        payment =>
                          payment.status ===
                          "Requested Reversal"
                      ).length
                    }

                  </strong>

                </div>

                <div className="payment-summary-card reversed">

                  <span>
                    Reversed
                  </span>

                  <strong>

                    {
                      payments.filter(
                        payment =>
                          payment.status ===
                          "Reversed"
                      ).length
                    }

                  </strong>

                </div>

                <div className="payment-summary-card failed">

                  <span>
                    Failed
                  </span>

                  <strong>

                    {
                      payments.filter(
                        payment =>
                          payment.status ===
                          "Failed"
                      ).length
                    }

                  </strong>

                </div>

              </div>

              <div className="admin-table-scroll">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Transaction
                      </th>

                      <th>
                        User
                      </th>

                      <th>
                        Ticket
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Method
                      </th>

                      <th>
                        Date
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

                    {payments.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="8"
                          className="empty-payment"
                        >

                          No payment transactions found.

                        </td>

                      </tr>

                    ) : (

                      payments.map(
                        payment => (

                          <tr
                            key={
                              payment.id
                            }
                          >

                            <td>

                              <strong>
                                {
                                  payment.transaction_id
                                }
                              </strong>

                            </td>

                            <td>

                              <div className="payment-user">

                                <strong>
                                  {
                                    payment.user_name ||
                                    "Unknown User"
                                  }
                                </strong>

                                <small>
                                  {
                                    payment.user_email
                                  }
                                </small>

                              </div>

                            </td>

                            <td>

                              {
                                payment.ticket_number ||
                                "N/A"
                              }

                            </td>

                            <td>

                              <strong>
                                {formatMoney(
                                  payment.amount
                                )}
                              </strong>

                            </td>

                            <td>
                              {
                                payment.payment_method
                              }
                            </td>

                            <td>

                              {payment.payment_date
                                ? new Date(
                                    payment.payment_date
                                  ).toLocaleString(
                                    "en-GB"
                                  )
                                : "N/A"}

                            </td>

                            <td>

                              <span
                                className={`payment-status ${
                                  payment.status
                                    ?.toLowerCase()
                                    .replace(
                                      /\s+/g,
                                      "-"
                                    )
                                }`}
                              >

                                {
                                  payment.status
                                }

                              </span>

                            </td>

                            <td>

                              {
                                payment.status ===
                                "Requested Reversal" ? (

                                  <div className="payment-actions">

                                    <button
                                      type="button"
                                      className="accept-reversal-btn"
                                      onClick={() =>
                                        acceptPaymentReversal(
                                          payment.id
                                        )
                                      }
                                    >

                                      <FiCheckCircle />

                                      Accept

                                    </button>

                                    <button
                                      type="button"
                                      className="deny-reversal-btn"
                                      onClick={() =>
                                        denyPaymentReversal(
                                          payment.id
                                        )
                                      }
                                    >

                                      <FiXCircle />

                                      Deny

                                    </button>

                                  </div>

                                ) : (

                                  <span className="no-payment-action">
                                    —
                                  </span>

                                )
                              }

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

          {/* ===================================
              REPORTS
          =================================== */}

          {activeTab ===
            "reports" && (

            <section className="admin-table-card reports-panel">

              {/* REPORT HEADER */}

              <div className="section-heading">

                <div>

                  <h1>
                    Reports
                  </h1>

                  <p>
                    Review and manage reports submitted by BusGo users.
                  </p>

                </div>

                <button
                  type="button"
                  className="refresh-btn"
                  onClick={
                    loadReports
                  }
                  disabled={
                    reportsLoading
                  }
                >

                  <FiRefreshCw />

                  {reportsLoading
                    ? "Loading..."
                    : "Refresh"}

                </button>

              </div>

              {/* REPORT ERROR */}

              {reportsError && (

                <div className="admin-notification-error">

                  <FiXCircle />

                  <span>
                    {reportsError}
                  </span>

                </div>

              )}

              {/* REPORT SUMMARY */}

              <div className="payment-summary report-summary">

                <div className="payment-summary-card">

                  <span>
                    Total Reports
                  </span>

                  <strong>
                    {reports.length}
                  </strong>

                </div>

                <div className="payment-summary-card reversal">

                  <span>
                    Pending
                  </span>

                  <strong>
                    {pendingReports}
                  </strong>

                </div>

                <div className="payment-summary-card">

                  <span>
                    In Progress
                  </span>

                  <strong>
                    {inProgressReports}
                  </strong>

                </div>

                <div className="payment-summary-card reversed">

                  <span>
                    Resolved
                  </span>

                  <strong>
                    {resolvedReports}
                  </strong>

                </div>

                <div className="payment-summary-card failed">

                  <span>
                    Rejected
                  </span>

                  <strong>
                    {rejectedReports}
                  </strong>

                </div>

              </div>

              {/* REPORT TOOLBAR */}

              <div className="reports-toolbar">

                <div className="reports-search">

                  <FiSearch />

                  <input
                    type="text"
                    value={
                      reportSearch
                    }
                    onChange={e =>
                      setReportSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search reports..."
                  />

                </div>

                <div className="reports-filter">

                  <label htmlFor="report-status-filter">
                    Status
                  </label>

                  <select
                    id="report-status-filter"
                    value={
                      reportFilter
                    }
                    onChange={e =>
                      setReportFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="all">
                      All Reports
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="in progress">
                      In Progress
                    </option>

                    <option value="resolved">
                      Resolved
                    </option>

                    <option value="rejected">
                      Rejected
                    </option>

                  </select>

                </div>

              </div>

              {/* REPORT TABLE */}

              <div className="admin-table-scroll">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Report
                      </th>

                      <th>
                        Reporter
                      </th>

                      <th>
                        Message
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Submitted
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {reportsLoading ? (

                      <tr>

                        <td
                          colSpan="6"
                          className="reports-loading-cell"
                        >

                          <FiRefreshCw />

                          Loading reports...

                        </td>

                      </tr>

                    ) : filteredReports.length ===
                      0 ? (

                      <tr>

                        <td
                          colSpan="6"
                          className="reports-empty-cell"
                        >

                          <FiAlertCircle />

                          <span>

                            {reports.length ===
                            0
                              ? "No reports have been submitted yet."
                              : "No reports match your current search or filter."}

                          </span>

                        </td>

                      </tr>

                    ) : (

                      filteredReports.map(
                        report => {

                          const reportStatus =
                            normalizeReportStatus(
                              report.status
                            );

                          return (
                            <tr
                              key={
                                report.id
                              }
                            >

                              {/* REPORT */}

                              <td>

                                <div className="report-title-cell">

                                  <strong>

                                    {
                                      report.subject ||
                                      "User Report"
                                    }

                                  </strong>

                                  <small>

                                    #
                                    {
                                      report.id
                                    }

                                  </small>

                                </div>

                              </td>

                              {/* REPORTER */}

                              <td>

                                <div className="report-user-cell">

                                  <div className="report-user-avatar">

                                    <FiUser />

                                  </div>

                                  <div>

                                    <strong>

                                      {
                                        report.user_name ||
                                        report.name ||
                                        "Unknown User"
                                      }

                                    </strong>

                                    <small>

                                      {
                                        report.user_email ||
                                        report.email ||
                                        "No email available"
                                      }

                                    </small>

                                  </div>

                                </div>

                              </td>

                              {/* MESSAGE */}

                              <td>

                                <div className="report-message-preview">

                                  {
                                    report.message
                                      ? String(
                                          report.message
                                        ).length >
                                        90
                                        ? `${String(
                                            report.message
                                          ).slice(
                                            0,
                                            90
                                          )}...`
                                        : report.message
                                      : "No message provided."
                                  }

                                </div>

                              </td>

                              {/* STATUS */}

                              <td>

                                <span
                                  className={`report-status-badge report-status-${reportStatus
                                    .toLowerCase()
                                    .replace(
                                      /\s+/g,
                                      "-"
                                    )}`}
                                >

                                  {reportStatus ===
                                    "Pending" && (
                                    <FiClock />
                                  )}

                                  {reportStatus ===
                                    "In Progress" && (
                                    <FiRefreshCw />
                                  )}

                                  {reportStatus ===
                                    "Resolved" && (
                                    <FiCheckCircle />
                                  )}

                                  {reportStatus ===
                                    "Rejected" && (
                                    <FiXCircle />
                                  )}

                                  {
                                    reportStatus
                                  }

                                </span>

                              </td>

                              {/* DATE */}

                              <td>

                                {formatReportDate(
                                  report.created_at ||
                                    report.createdAt ||
                                    report.date
                                )}

                              </td>

                              {/* ACTION */}

                              <td>

                                <button
                                  type="button"
                                  className="view-report-btn"
                                  onClick={() =>
                                    setSelectedReport(
                                      report
                                    )
                                  }
                                >

                                  <FiEye />

                                  View

                                </button>

                              </td>

                            </tr>
                          );
                        }
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>
          )}

          {/* ===================================
              REPORT DETAILS MODAL
          =================================== */}

          {selectedReport && (

            <div
              className="report-modal-overlay"
              onClick={e => {

                if (
                  e.target ===
                  e.currentTarget
                ) {
                  setSelectedReport(
                    null
                  );
                }

              }}
            >

              <div className="report-modal">

                {/* MODAL HEADER */}

                <div className="report-modal-header">

                  <div>

                    <span className="report-modal-eyebrow">

                      REPORT #

                      {
                        selectedReport.id
                      }

                    </span>

                    <h2>

                      {
                        selectedReport.subject ||
                        "User Report"
                      }

                    </h2>

                  </div>

                  <button
                    type="button"
                    className="report-modal-close"
                    onClick={() =>
                      setSelectedReport(
                        null
                      )
                    }
                    aria-label="Close report"
                  >

                    <FiX />

                  </button>

                </div>

                {/* MODAL BODY */}

                <div className="report-modal-body">

                  {/* REPORTER */}

                  <div className="report-detail-section">

                    <div className="report-detail-heading">

                      <FiUser />

                      <h3>
                        Reporter
                      </h3>

                    </div>

                    <div className="report-detail-user">

                      <div className="report-detail-avatar">

                        <FiUser />

                      </div>

                      <div>

                        <strong>

                          {
                            selectedReport.user_name ||
                            selectedReport.name ||
                            "Unknown User"
                          }

                        </strong>

                        <span>

                          {
                            selectedReport.user_email ||
                            selectedReport.email ||
                            "No email available"
                          }

                        </span>

                        {selectedReport.user_id && (
                          <small>

                            User ID:{" "}
                            {
                              selectedReport.user_id
                            }

                          </small>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* REPORT DATE */}

                  <div className="report-detail-grid">

                    <div className="report-detail-box">

                      <span>
                        Submitted
                      </span>

                      <strong>

                        {formatReportDate(
                          selectedReport.created_at ||
                            selectedReport.createdAt ||
                            selectedReport.date
                        )}

                      </strong>

                    </div>

                    <div className="report-detail-box">

                      <span>
                        Current Status
                      </span>

                      <strong>

                        {
                          normalizeReportStatus(
                            selectedReport.status
                          )
                        }

                      </strong>

                    </div>

                  </div>

                  {/* MESSAGE */}

                  <div className="report-detail-section">

                    <div className="report-detail-heading">

                      <FiMessageSquare />

                      <h3>
                        Full Report Message
                      </h3>

                    </div>

                    <div className="report-full-message">

                      {
                        selectedReport.message ||
                        "No message was provided."
                      }

                    </div>

                  </div>

                  {/* ADDITIONAL INFORMATION */}

                  {(selectedReport.booking_id ||
                    selectedReport.ticket_number ||
                    selectedReport.route ||
                    selectedReport.phone) && (

                    <div className="report-detail-section">

                      <div className="report-detail-heading">

                        <FiInfo />

                        <h3>
                          Additional Information
                        </h3>

                      </div>

                      <div className="report-detail-extra">

                        {selectedReport.booking_id && (
                          <div>

                            <span>
                              Booking ID
                            </span>

                            <strong>
                              {
                                selectedReport.booking_id
                              }
                            </strong>

                          </div>
                        )}

                        {selectedReport.ticket_number && (
                          <div>

                            <span>
                              Ticket
                            </span>

                            <strong>
                              {
                                selectedReport.ticket_number
                              }
                            </strong>

                          </div>
                        )}

                        {selectedReport.route && (
                          <div>

                            <span>
                              Route
                            </span>

                            <strong>
                              {
                                selectedReport.route
                              }
                            </strong>

                          </div>
                        )}

                        {selectedReport.phone && (
                          <div>

                            <span>
                              Phone
                            </span>

                            <strong>
                              {
                                selectedReport.phone
                              }
                            </strong>

                          </div>
                        )}

                      </div>

                    </div>

                  )}

                  {/* STATUS MANAGEMENT */}

                  <div className="report-detail-section">

                    <div className="report-detail-heading">

                      <FiBarChart2 />

                      <h3>
                        Manage Report
                      </h3>

                    </div>

                    <p className="report-status-help">

                      Update the report status after reviewing the user's message.

                    </p>

                    <div className="report-status-actions">

                      <button
                        type="button"
                        className={`report-status-action pending ${
                          normalizeReportStatus(
                            selectedReport.status
                          ) ===
                          "Pending"
                            ? "active"
                            : ""
                        }`}
                        disabled={
                          updatingReportId ===
                          selectedReport.id
                        }
                        onClick={() =>
                          updateReportStatus(
                            selectedReport.id,
                            "Pending"
                          )
                        }
                      >

                        <FiClock />

                        Pending

                      </button>

                      <button
                        type="button"
                        className={`report-status-action progress ${
                          normalizeReportStatus(
                            selectedReport.status
                          ) ===
                          "In Progress"
                            ? "active"
                            : ""
                        }`}
                        disabled={
                          updatingReportId ===
                          selectedReport.id
                        }
                        onClick={() =>
                          updateReportStatus(
                            selectedReport.id,
                            "In Progress"
                          )
                        }
                      >

                        <FiRefreshCw />

                        In Progress

                      </button>

                      <button
                        type="button"
                        className={`report-status-action resolved ${
                          normalizeReportStatus(
                            selectedReport.status
                          ) ===
                          "Resolved"
                            ? "active"
                            : ""
                        }`}
                        disabled={
                          updatingReportId ===
                          selectedReport.id
                        }
                        onClick={() =>
                          updateReportStatus(
                            selectedReport.id,
                            "Resolved"
                          )
                        }
                      >

                        <FiCheckCircle />

                        Resolved

                      </button>

                      <button
                        type="button"
                        className={`report-status-action rejected ${
                          normalizeReportStatus(
                            selectedReport.status
                          ) ===
                          "Rejected"
                            ? "active"
                            : ""
                        }`}
                        disabled={
                          updatingReportId ===
                          selectedReport.id
                        }
                        onClick={() =>
                          updateReportStatus(
                            selectedReport.id,
                            "Rejected"
                          )
                        }
                      >

                        <FiXCircle />

                        Rejected

                      </button>

                    </div>

                    {updatingReportId ===
                      selectedReport.id && (

                      <div className="report-updating-message">

                        <FiRefreshCw />

                        Updating report status...

                      </div>

                    )}

                  </div>

                </div>

                {/* MODAL FOOTER */}

                <div className="report-modal-footer">

                  <button
                    type="button"
                    className="report-close-btn"
                    onClick={() =>
                      setSelectedReport(
                        null
                      )
                    }
                  >

                    Close Report

                  </button>

                </div>

              </div>

            </div>

          )}

          {/* ===================================
              SETTINGS
          =================================== */}

          {activeTab ===
            "settings" && (

            <section className="admin-settings">

              {/* SETTINGS HEADER */}

              <div className="settings-heading">

                <div>

                  <h1>
                    Settings
                  </h1>

                  <p>
                    Manage your BusGo administrator preferences.
                  </p>

                </div>

                <div className="settings-heading-icon">

                  <FiSettings />

                </div>

              </div>

              {/* APPEARANCE */}

              <div className="settings-card">

                <div className="settings-card-header">

                  <div className="settings-card-icon">

                    <FiMonitor />

                  </div>

                  <div>

                    <h2>
                      Appearance
                    </h2>

                    <p>
                      Choose how the admin dashboard looks.
                    </p>

                  </div>

                </div>

                <div className="settings-options">

                  <button
                    type="button"
                    className={`settings-option ${
                      theme ===
                      "light"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeTheme(
                        "light"
                      )
                    }
                  >

                    <span className="settings-option-icon">
                      <FiSun />
                    </span>

                    <span className="settings-option-text">

                      <strong>
                        Light Mode
                      </strong>

                      <small>
                        Use the light BusGo dashboard theme.
                      </small>

                    </span>

                    <span className="settings-radio">

                      {theme ===
                      "light"
                        ? "✓"
                        : ""}

                    </span>

                  </button>

                  <button
                    type="button"
                    className={`settings-option ${
                      theme ===
                      "dark"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeTheme(
                        "dark"
                      )
                    }
                  >

                    <span className="settings-option-icon">
                      <FiMoon />
                    </span>

                    <span className="settings-option-text">

                      <strong>
                        Dark Mode
                      </strong>

                      <small>
                        Use a darker interface for the dashboard.
                      </small>

                    </span>

                    <span className="settings-radio">

                      {theme ===
                      "dark"
                        ? "✓"
                        : ""}

                    </span>

                  </button>

                </div>

              </div>

              {/* LANGUAGE */}

              <div className="settings-card">

                <div className="settings-card-header">

                  <div className="settings-card-icon">

                    <FiGlobe />

                  </div>

                  <div>

                    <h2>
                      Language
                    </h2>

                    <p>
                      Choose your preferred dashboard language.
                    </p>

                  </div>

                </div>

                <div className="settings-language">

                  <label htmlFor="admin-language">
                    Dashboard Language
                  </label>

                  <select
                    id="admin-language"
                    value={
                      language
                    }
                    onChange={e =>
                      changeLanguage(
                        e.target
                          .value
                      )
                    }
                  >

                    <option value="English">
                      English
                    </option>

                    <option value="Français">
                      Français
                    </option>

                  </select>

                  <small>
                    Language preference is saved on this device.
                  </small>

                </div>

              </div>

              {/* CLIENT VIEW */}

              <div className="settings-card">

                <div className="settings-card-header">

                  <div className="settings-card-icon">

                    <FiExternalLink />

                  </div>

                  <div>

                    <h2>
                      Client View
                    </h2>

                    <p>
                      Open the public BusGo website as a normal client.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="settings-action-btn client-view-btn"
                  onClick={
                    viewSiteAsClient
                  }
                >

                  <FiExternalLink />

                  View Site as Client

                </button>

              </div>

              {/* ABOUT APP */}

              <div className="settings-card">

                <div className="settings-card-header">

                  <div className="settings-card-icon">

                    <FiInfo />

                  </div>

                  <div>

                    <h2>
                      About BusGo
                    </h2>

                    <p>
                      Information about the current BusGo application.
                    </p>

                  </div>

                </div>

                <div className="about-app-info">

                  <div className="about-app-row">

                    <span>
                      Application
                    </span>

                    <strong>
                      BusGo
                    </strong>

                  </div>

                  <div className="about-app-row">

                    <span>
                      Version
                    </span>

                    <strong>
                      v{
                        packageJson.version
                      }
                    </strong>

                  </div>

                  <div className="about-app-row">

                    <span>
                      Application Type
                    </span>

                    <strong>
                      Progressive Web App
                    </strong>

                  </div>

                  <div className="about-app-row">

                    <span>
                      Platform
                    </span>

                    <strong>
                      BusGo Web App
                    </strong>

                  </div>

                </div>

              </div>

              {/* ACCOUNT */}

              <div className="settings-card settings-danger-card">

                <div className="settings-card-header">

                  <div className="settings-card-icon danger">

                    <FiLogOut />

                  </div>

                  <div>

                    <h2>
                      Account
                    </h2>

                    <p>
                      Sign out of the BusGo administrator account.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="settings-action-btn logout-settings-btn"
                  onClick={
                    logoutFromSettings
                  }
                >

                  <FiLogOut />

                  Logout

                </button>

              </div>

            </section>
          )}

          {/* ===================================
              FUTURE ROUTES ONLY
          =================================== */}

          {activeTab ===
            "routes" && (

            <section className="coming-soon-card">

              <div className="coming-soon-icon">
                <FiMap />
              </div>

              <h1>
                Routes
              </h1>

              <p>
                This section is ready for the existing
                BusGo functionality to be connected.
              </p>

            </section>
          )}

        </main>

        {/* =====================================
            FOOTER
        ===================================== */}

        <footer className="admin-footer">

          <span>
            © {new Date().getFullYear()} BusGo
          </span>

          <span>
            Admin Dashboard
          </span>

        </footer>

      </div>

    </div>
  );
}

export default AdminDashboard;