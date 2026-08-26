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
import Profile from "./pages/Profile/Profile";
import Report from "./pages/Report/Report";
import Community from "./pages/Community/Community";

import BackButton from "./components/BackButton/BackButton";
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
// GLOBAL BACK BUTTON
// =========================================

function MobileBackButton() {
  const location = useLocation();

  const hiddenPages = [
    "/",
    "/admin",
    "/login",
    "/register",
    "/verify-otp"
  ];

  if (
    hiddenPages.includes(
      location.pathname
    )
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

        <MobileBackButton />

        <div className="app-page-wrapper">

          <Routes>

            {/* ===================================
                CLIENT / PUBLIC ROUTES
            =================================== */}

            <Route element={<ClientRoute />}>

              <Route
                path="/"
                element={<Home />}
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