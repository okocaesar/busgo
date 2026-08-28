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


// =========================================
// PAGE NOT FOUND
// =========================================

function PageNotFound() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center"
      }}
    >
      <h1>
        {t("pageNotFound")}
      </h1>

      <p>
        The page you are looking for does not exist.
      </p>
    </div>
  );
}


// =========================================
// CHECK MOBILE DEVICE
// =========================================

function isMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(
    "(max-width: 768px)"
  ).matches;
}


// =========================================
// MOBILE START ROUTE
// =========================================
//
// Mobile:
// - No logged-in user -> Login
// - Logged-in user -> Home
//
// Desktop:
// - Always behaves normally -> Home
// =========================================

function MobileStartRoute() {
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

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


// =========================================
// CLIENT ROUTE
// =========================================

function ClientRoute() {
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

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


// =========================================
// APP CONTENT
// =========================================

function AppContent() {
  const { language } = useLanguage();

  return (
    <BrowserRouter>
      <div
        key={language}
        className="app-root"
      >

        <div className="app-page-wrapper">

          <Routes>

            {/* ===================================
                CLIENT / PUBLIC ROUTES
            =================================== */}

            <Route element={<ClientRoute />}>

              {/* =================================
                  START PAGE

                  MOBILE:
                  Not logged in -> Login
                  Logged in -> Home

                  DESKTOP:
                  Home as before
              ================================= */}

              <Route
                path="/"
                element={<MobileStartRoute />}
              />

              <Route
                path="/routes"
                element={<RoutesPage />}
              />

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

              <Route
                path="/booking"
                element={<Booking />}
              />

              <Route
                path="/offers"
                element={<Offers />}
              />

              <Route
                path="/about"
                element={<About />}
              />

              <Route
                path="/confirmation"
                element={<Confirmation />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/payment"
                element={<Payment />}
              />

              <Route
                path="/notifications"
                element={<Notifications />}
              />

              <Route
                path="/community"
                element={<Community />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/report"
                element={<Report />}
              />

              {/* =================================
                  CLIENT CATCH-ALL
              ================================= */}

              <Route
                path="*"
                element={<PageNotFound />}
              />

            </Route>


            {/* ===================================
                ADMIN
            =================================== */}

            <Route element={<AdminRoute />}>

              <Route
                path="/admin"
                element={<AdminDashboard />}
              />

            </Route>

          </Routes>

        </div>

      </div>
    </BrowserRouter>
  );
}


// =========================================
// APP
// =========================================

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}


export default App;