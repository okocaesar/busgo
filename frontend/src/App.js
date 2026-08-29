import {
  BrowserRouter,
  Routes,
  Route,
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
import Profile from "./pages/Profile/Profile";
import Report from "./pages/Report/Report";
import Community from "./pages/Community/Community";

import AdminRoute from "./components/AdminRoute/AdminRoute";

import {
  LanguageProvider,
  useLanguage
} from "./context/LanguageContext";


// ============================================================
// PAGE NOT FOUND
// ============================================================

function PageNotFound() {
  const { t } = useLanguage();

  return (
    <div className="page-not-found">
      <h1>
        {t("pageNotFound")}
      </h1>

      <p>
        The page you are looking for does not exist.
      </p>
    </div>
  );
}


// ============================================================
// CHECK MOBILE DEVICE
// ============================================================

function isMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(
    "(max-width: 768px)"
  ).matches;
}


// ============================================================
// MOBILE START ROUTE
// ============================================================
//
// Mobile:
// - No logged-in user -> Login
// - Logged-in user -> Home
//
// Desktop:
// - Home
// ============================================================

function MobileStartRoute() {
  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
  } catch (error) {
    console.error(
      "Unable to read currentUser:",
      error
    );
  }

  const isMobile = isMobileDevice();

  if (isMobile && !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Home />;
}


// ============================================================
// CLIENT ROUTE
// ============================================================

function ClientRoute() {
  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
  } catch (error) {
    console.error(
      "Unable to read currentUser:",
      error
    );
  }

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

  return <Outlet />;
}


// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  const { language } = useLanguage();

  return (
    <BrowserRouter>
      <div
        key={language}
        className="app-root"
      >

        {/* ==================================================
            APPLICATION SHELL
            ==================================================
            
            Desktop:
            Existing desktop layout remains untouched.

            Mobile:
            CSS will use this shell to create a safe area
            between the fixed mobile header and bottom nav.
        ================================================== */}

        <div className="app-page-wrapper">

          <main className="app-main-content">

            <Routes>

              {/* ============================================
                  CLIENT / PUBLIC ROUTES
              ============================================ */}

              <Route element={<ClientRoute />}>

                {/* ==========================================
                    START PAGE
                ========================================== */}

                <Route
                  path="/"
                  element={<MobileStartRoute />}
                />

                {/* ==========================================
                    ROUTES
                ========================================== */}

                <Route
                  path="/routes"
                  element={<RoutesPage />}
                />

                {/* ==========================================
                    AUTHENTICATION
                ========================================== */}

                <Route
                  path="/login"
                  element={<Login />}
                />

                <Route
                  path="/register"
                  element={<Register />}
                />

                <Route
                  path="/verify-otp"
                  element={<VerifyOTP />}
                />

                {/* ==========================================
                    BOOKING
                ========================================== */}

                <Route
                  path="/booking"
                  element={<Booking />}
                />

                {/* ==========================================
                    OFFERS
                ========================================== */}

                <Route
                  path="/offers"
                  element={<Offers />}
                />

                {/* ==========================================
                    ABOUT
                ========================================== */}

                <Route
                  path="/about"
                  element={<About />}
                />

                {/* ==========================================
                    CONFIRMATION
                ========================================== */}

                <Route
                  path="/confirmation"
                  element={<Confirmation />}
                />

                {/* ==========================================
                    DASHBOARD
                ========================================== */}

                <Route
                  path="/dashboard"
                  element={<Dashboard />}
                />

                {/* ==========================================
                    PAYMENT
                ========================================== */}

                <Route
                  path="/payment"
                  element={<Payment />}
                />

                {/* ==========================================
                    NOTIFICATIONS
                ========================================== */}

                <Route
                  path="/notifications"
                  element={<Notifications />}
                />

                {/* ==========================================
                    COMMUNITY
                ========================================== */}

                <Route
                  path="/community"
                  element={<Community />}
                />

                {/* ==========================================
                    PROFILE
                ========================================== */}

                <Route
                  path="/profile"
                  element={<Profile />}
                />

                {/* ==========================================
                    REPORT
                ========================================== */}

                <Route
                  path="/report"
                  element={<Report />}
                />

                {/* ==========================================
                    CLIENT CATCH-ALL
                ========================================== */}

                <Route
                  path="*"
                  element={<PageNotFound />}
                />

              </Route>


              {/* ============================================
                  ADMIN
              ============================================ */}

              <Route element={<AdminRoute />}>

                <Route
                  path="/admin"
                  element={<AdminDashboard />}
                />

              </Route>

            </Routes>

          </main>

        </div>

      </div>
    </BrowserRouter>
  );
}


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}


export default App;
