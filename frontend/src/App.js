import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
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
    <div className="global-mobile-back">
      <BackButton />
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
          ROUTES
      ===================================== */}

      <Routes>

        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* ROUTES */}

        <Route
          path="/routes"
          element={<RoutesPage />}
        />


        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* REGISTER */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* VERIFY OTP */}

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />


        {/* BOOKING */}

        <Route
          path="/booking"
          element={<Booking />}
        />


        {/* OFFERS */}

        <Route
          path="/offers"
          element={<Offers />}
        />


        {/* ABOUT */}

        <Route
          path="/about"
          element={<About />}
        />


        {/* CONFIRMATION */}

        <Route
          path="/confirmation"
          element={<Confirmation />}
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* PAYMENT */}

        <Route
          path="/payment"
          element={<Payment />}
        />


        {/* ADMIN DASHBOARD */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />


        {/* NOTIFICATIONS */}

        <Route
          path="/notifications"
          element={<Notifications />}
        />


        {/* PAGE NOT FOUND */}

        <Route
          path="*"
          element={
            <h1>Page Not Found</h1>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;
