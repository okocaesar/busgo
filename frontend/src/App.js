import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  Outlet
} from "react-router-dom";

import Home from "./pages/Home/Home";
import RoutesPage from "./pages/Routes/Routes";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Booking from "./pages/Booking/Booking";
import Offers from "./pages/Offers/Offers";
import About from "./pages/AboutUs/AboutUs";
import Confirmation from "./pages/Confirmation/Confirmation";
import Dashboard from "./pages/Dashboard/Dashboard";
import Payment from "./pages/Payment/Payment";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP";
import Notifications from "./pages/Notifications/Notifications";

import BackButton from "./components/BackButton/BackButton";
import AdminRoute from "./components/AdminRoute/AdminRoute";


// =========================================
// CLIENT ROUTE
// =========================================
// Prevent ADMIN users from accessing
// normal client pages.
//
// Normal users and logged-out visitors
// can continue using the normal website.
//
// Admin users are redirected to /admin.
// =========================================

function ClientRoute() {

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

  // =======================================
  // ADMIN USERS
  // =======================================

  if (
    currentUser &&
    currentUser.role === "admin"
  ) {

    return (
      <Navigate
        to="/admin"
        replace
      />
    );

  }

  // =======================================
  // NORMAL USERS / PUBLIC USERS
  // =======================================

  return <Outlet />;

}


// =========================================
// GLOBAL BACK BUTTON
// =========================================

function MobileBackButton() {

  const location = useLocation();

  // =======================================
  // DO NOT SHOW ON HOME
  // DO NOT SHOW ON ADMIN DASHBOARD
  // =======================================

  if (
    location.pathname === "/" ||
    location.pathname === "/admin"
  ) {

    return null;

  }

  return (

    <div
      className="global-mobile-back"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 10000,
        pointerEvents: "none"
      }}
    >

      <div
        style={{
          pointerEvents: "auto"
        }}
      >

        <BackButton />

      </div>

    </div>

  );

}


// =========================================
// APP
// =========================================

function App() {

  return (

    <BrowserRouter>

      {/* =====================================
          GLOBAL BACK BUTTON

          Appears on all pages except:
          - Home
          - Admin Dashboard
      ===================================== */}

      <MobileBackButton />


      {/* =====================================
          PAGE WRAPPER
      ===================================== */}

      <div className="app-page-wrapper">

        <Routes>


          {/* ===================================
              CLIENT / PUBLIC ROUTES
          ===================================

              ClientRoute prevents an admin
              from entering these pages.
          =================================== */}

          <Route element={<ClientRoute />}>


            {/* ================================
                HOME
            ================================= */}

            <Route
              path="/"
              element={<Home />}
            />


            {/* ================================
                ROUTES
            ================================= */}

            <Route
              path="/routes"
              element={<RoutesPage />}
            />


            {/* ================================
                LOGIN
            ================================= */}

            <Route
              path="/login"
              element={<Login />}
            />


            {/* ================================
                REGISTER
            ================================= */}

            <Route
              path="/register"
              element={<Register />}
            />


            {/* ================================
                VERIFY OTP
            ================================= */}

            <Route
              path="/verify-otp"
              element={<VerifyOTP />}
            />


            {/* ================================
                BOOKING
            ================================= */}

            <Route
              path="/booking"
              element={<Booking />}
            />


            {/* ================================
                OFFERS
            ================================= */}

            <Route
              path="/offers"
              element={<Offers />}
            />


            {/* ================================
                ABOUT
            ================================= */}

            <Route
              path="/about"
              element={<About />}
            />


            {/* ================================
                CONFIRMATION
            ================================= */}

            <Route
              path="/confirmation"
              element={<Confirmation />}
            />


            {/* ================================
                DASHBOARD
            ================================= */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />


            {/* ================================
                PAYMENT
            ================================= */}

            <Route
              path="/payment"
              element={<Payment />}
            />


            {/* ================================
                NOTIFICATIONS
            ================================= */}

            <Route
              path="/notifications"
              element={<Notifications />}
            />


            {/* ================================
                PAGE NOT FOUND
            ================================= */}

            <Route
              path="*"
              element={
                <h1>
                  Page Not Found
                </h1>
              }
            />


          </Route>


          {/* ===================================
              ADMIN ROUTES
          ===================================

              AdminRoute verifies:
              - authToken exists
              - currentUser exists
              - currentUser.role === "admin"

              Normal users cannot enter /admin.
          =================================== */}

          <Route element={<AdminRoute />}>


            <Route
              path="/admin"
              element={<AdminDashboard />}
            />


          </Route>


        </Routes>

      </div>

    </BrowserRouter>

  );

}


export default App;