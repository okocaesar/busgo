import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";
import { Link } from "react-router-dom";

import {
  FiArrowRight,
  FiChevronRight,
  FiClock,
  FiCompass,
  FiMapPin,
  FiMessageCircle,
  FiNavigation,
  FiSearch,
  FiTag,
} from "react-icons/fi";

import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import SearchCard from "../../components/SearchCard/SearchCard";
import Features from "../../components/Features/Features";
import PopularRoutes from "../../components/PopularRoutes/PopularRoutes";
import Testimonials from "../../components/Testimonials/Testimonials";
import Footer from "../../components/Footer/Footer";
import InstallApp from "../../components/InstallApp/InstallApp";

import douala from "../../assets/routes/douala.jpg";
import yaounde from "../../assets/routes/yaounde.jpg";
import buea from "../../assets/routes/buea.jpg";

import "./Home.css";


// ============================================================
// BUSGO API / SOCKET
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:10000";


// ============================================================
// MOBILE HOME ROUTES
// Uses the same actual content as PopularRoutes.jsx
// ============================================================

const recommendedRoutes = [
  {
    image: douala,
    from: "Bamenda",
    to: "Douala",
    price: 5000,
    duration: "6 Hours",
  },
  {
    image: yaounde,
    from: "Yaoundé",
    to: "Buea",
    price: 4500,
    duration: "5 Hours",
  },
  {
    image: buea,
    from: "Douala",
    to: "Limbe",
    price: 3500,
    duration: "2 Hours",
  },
];


// ============================================================
// MOBILE HOME OFFERS
// Uses the actual offers from Offers.jsx
// ============================================================

const mobileOffers = [
  {
    title: "Weekend Discount",
    discount: "20%",
    description:
      "Make your weekend trips more affordable. Enjoy special discounts on selected routes every Saturday and Sunday.",
    route: "Selected Routes",
    validity: "Every Weekend",
    badge: "WEEKEND SPECIAL",
    icon: "🎉",
  },
  {
    title: "Early Booking Offer",
    discount: "15%",
    description:
      "Planning ahead? Book your bus ticket early and enjoy exclusive savings while securing your preferred seat.",
    route: "All Major Routes",
    validity: "Book 7+ Days Early",
    badge: "SAVE MORE",
    icon: "📅",
  },
];


// ============================================================
// TOKEN
// ============================================================

function getCommunityToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt")
  );
}


// ============================================================
// MOBILE HOME
// ============================================================

function MobileHomeContent() {
  const [latestMessage, setLatestMessage] = useState(null);
  const [communityConnected, setCommunityConnected] =
    useState(false);

  // ----------------------------------------------------------
  // LOAD LATEST COMMUNITY MESSAGE
  // ----------------------------------------------------------

  const loadLatestMessage = useCallback((history) => {
    if (!Array.isArray(history) || history.length === 0) {
      setLatestMessage(null);
      return;
    }

    const sorted = [...history].sort((a, b) => {
      const aTime = new Date(a?.created_at || 0).getTime();
      const bTime = new Date(b?.created_at || 0).getTime();

      return aTime - bTime;
    });

    setLatestMessage(sorted[sorted.length - 1]);
  }, []);


  // ----------------------------------------------------------
  // COMMUNITY LIVE CONNECTION
  //
  // This only powers the Home preview.
  // The actual Community page remains untouched.
  // ----------------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    // Only create this Home community connection on mobile.
    if (window.innerWidth > 600) {
      return undefined;
    }

    const token = getCommunityToken();

    if (!token) {
      setCommunityConnected(false);
      return undefined;
    }

    let currentUser = null;

    try {
      const storedUser =
        localStorage.getItem("currentUser");

      if (storedUser) {
        currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error(
        "Unable to read current user:",
        error
      );
    }

    const socket = io(API_URL, {
      auth: {
        token,
      },

      transports: [
        "websocket",
        "polling",
      ],

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      setCommunityConnected(true);

      socket.emit("community:join", {
        id:
          currentUser?.id ||
          currentUser?.userId ||
          currentUser?.user_id,

        name:
          currentUser?.name ||
          currentUser?.fullName ||
          currentUser?.username ||
          "BusGo User",
      });
    });

    socket.on("disconnect", () => {
      setCommunityConnected(false);
    });

    socket.on("connect_error", () => {
      setCommunityConnected(false);
    });

    socket.on(
      "community-history",
      (history) => {
        loadLatestMessage(history);
      }
    );

    socket.on(
      "community-new-message",
      (newMessage) => {
        if (newMessage) {
          setLatestMessage(newMessage);
        }
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [loadLatestMessage]);


  // ----------------------------------------------------------
  // MESSAGE TIME
  // ----------------------------------------------------------

  const formatMessageTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  // ----------------------------------------------------------
  // MESSAGE NAME
  // ----------------------------------------------------------

  const messageUserName =
    latestMessage?.user_name ||
    "BusGo User";


  // ----------------------------------------------------------
  // MESSAGE INITIAL
  // ----------------------------------------------------------

  const messageInitial =
    messageUserName
      .trim()
      .charAt(0)
      .toUpperCase() || "U";


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <main className="busgo-mobile-home">

      {/* ======================================================
          WELCOME
      ====================================================== */}

      <section className="mobile-home-welcome">

        <div>
          <span className="mobile-home-eyebrow">
            BUSGO
          </span>

          <h1>
            Where are you
            <span> going?</span>
          </h1>

         
        </div>

        <div className="mobile-home-welcome-icon">
          <FiNavigation />
        </div>

      </section>


      {/* ======================================================
          SEARCH
      ====================================================== */}

      <section className="mobile-home-search-section">

        <div className="mobile-section-heading search-heading">

          <div>
            <span className="mobile-section-kicker">
              PLAN YOUR JOURNEY
            </span>

            <h2>
              Find your bus
            </h2>
          </div>

          <div className="mobile-section-heading-icon">
            <FiSearch />
          </div>

        </div>


        <div className="mobile-search-card">

          <div className="mobile-search-card-top">

            <div>
              <span className="mobile-search-label">
                <FiSearch />
                BUS SEARCH
              </span>

              <h3>
                Where would you like to go?
              </h3>
            </div>

            <div className="mobile-search-badge">
              Fast & Easy
            </div>

          </div>


          <div className="mobile-search-existing">
            <SearchCard />
          </div>

        </div>

      </section>


      {/* ======================================================
          RECOMMENDED ROUTES
      ====================================================== */}

      <section className="mobile-home-section">

        <div className="mobile-section-heading">

          <div>
            <span className="mobile-section-kicker">
              EXPLORE CAMEROON
            </span>

            <h2>
              Recommended routes
            </h2>
          </div>

          <div className="mobile-section-heading-icon">
            <FiCompass />
          </div>

        </div>


        <div className="mobile-route-list">

          {recommendedRoutes.map(
            (route, index) => (
              <Link
                to="/booking"
                key={`${route.from}-${route.to}-${index}`}
                className="mobile-route-item"
              >

                <div className="mobile-route-image-wrap">
                  <img
                    src={route.image}
                    alt={`${route.from} to ${route.to}`}
                    className="mobile-route-image"
                  />
                </div>


                <div className="mobile-route-main">

                  <div className="mobile-route-path">

                    <span>
                      {route.from}
                    </span>

                    <FiArrowRight />

                    <span>
                      {route.to}
                    </span>

                  </div>


                  <div className="mobile-route-details">

                    <span>
                      <FiClock />
                      {route.duration}
                    </span>

                    <span>
                      <FiMapPin />
                      Cameroon
                    </span>

                  </div>

                </div>


                <div className="mobile-route-price">

                  <small>
                    From
                  </small>

                  <strong>
                    XAF{" "}
                    {route.price.toLocaleString()}
                  </strong>

                  <FiChevronRight />

                </div>

              </Link>
            )
          )}

        </div>


        <Link
          to="/routes"
          className="mobile-explore-button"
        >
          <span className="mobile-explore-icon">
            <FiCompass />
          </span>

          <span>
            Explore Routes
          </span>

          <FiArrowRight />
        </Link>

      </section>


      {/* ======================================================
          OFFERS
      ====================================================== */}

      <section className="mobile-home-section">

        <div className="mobile-section-heading">

          <div>
            <span className="mobile-section-kicker">
              SAVE MORE
            </span>

            <h2>
              Special offers
            </h2>
          </div>

          <div className="mobile-section-heading-icon">
            <FiTag />
          </div>

        </div>


        <div className="mobile-offers-list">

          {mobileOffers.map(
            (offer, index) => (
              <article
                className={`mobile-offer-card ${
                  index === 1
                    ? "mobile-offer-card-featured"
                    : ""
                }`}
                key={offer.title}
              >

                <div className="mobile-offer-glow" />


                <div className="mobile-offer-top">

                  <div className="mobile-offer-icon">
                    {offer.icon}
                  </div>

                  <span className="mobile-offer-badge">
                    {offer.badge}
                  </span>

                </div>


                <div className="mobile-offer-discount">
                  <strong>
                    {offer.discount}
                  </strong>

                  <span>
                    OFF
                  </span>
                </div>


                <h3>
                  {offer.title}
                </h3>

                <p>
                  {offer.description}
                </p>


                <div className="mobile-offer-meta">

                  <span>
                    <FiMapPin />
                    {offer.route}
                  </span>

                  <span>
                    <FiClock />
                    {offer.validity}
                  </span>

                </div>

              </article>
            )
          )}

        </div>


        <Link
          to="/offers"
          className="mobile-explore-button mobile-offers-explore"
        >
          <span className="mobile-explore-icon">
            <FiTag />
          </span>

          <span>
            Explore Offers
          </span>

          <FiArrowRight />
        </Link>

      </section>


      {/* ======================================================
          COMMUNITY
      ====================================================== */}

      <section className="mobile-home-section mobile-community-section">

        <div className="mobile-section-heading">

          <div>
            <span className="mobile-section-kicker">
              BUSGO COMMUNITY
            </span>

            <h2>
              Latest conversation
            </h2>
          </div>

          <div
            className={`mobile-community-status ${
              communityConnected
                ? "online"
                : ""
            }`}
          >
            <span />
            {communityConnected
              ? "Live"
              : "Community"}
          </div>

        </div>


        <div className="mobile-community-card">

          {latestMessage ? (
            <>

              <div className="mobile-community-message-head">

                <div className="mobile-community-avatar">
                  {messageInitial}
                </div>

                <div className="mobile-community-user">

                  <strong>
                    {messageUserName}
                  </strong>

                  <span>
                    {formatMessageTime(
                      latestMessage.created_at
                    )}
                  </span>

                </div>

                <div className="mobile-community-message-icon">
                  <FiMessageCircle />
                </div>

              </div>


              <div className="mobile-community-message">

                <p>
                  {latestMessage.message}
                </p>

              </div>

              <div className="mobile-community-new">

                <span />

                <span>
                  Latest message
                </span>

              </div>

            </>
          ) : (
            <>

              <div className="mobile-community-empty-icon">
                <FiMessageCircle />
              </div>

              <div className="mobile-community-empty-content">

                <strong>
                  Join the BusGo community
                </strong>

                <p>
                  Connect with fellow travelers,
                  share experiences and keep
                  the conversation moving.
                </p>

              </div>

            </>
          )}


          <Link
            to="/community"
            className="mobile-community-button"
          >
            <span>
              <FiMessageCircle />
            </span>

            <strong>
              Join the conversation
            </strong>

            <FiArrowRight />

          </Link>

        </div>

      </section>


      {/* ======================================================
          MOBILE BOTTOM SPACE
          Keeps content clear of the existing BottomNav.
      ====================================================== */}

      <div className="mobile-home-bottom-space" />

    </main>
  );
}


// ============================================================
// DESKTOP HOME
// EXISTING CONTENT PRESERVED
// ============================================================

function DesktopHomeContent() {
  return (
    <div className="busgo-desktop-home">

      <Hero />

      <InstallApp />

      <SearchCard />

      <Features />

      <PopularRoutes />

      <Testimonials />

      <Footer />

    </div>
  );
}


// ============================================================
// HOME
// ============================================================

function Home() {
  return (
    <>
      {/* ======================================================
          EXISTING NAVBAR
          DO NOT TOUCH
      ====================================================== */}

      <Navbar />


      {/* ======================================================
          DESKTOP / TABLET
          EXISTING HOME CONTENT
      ====================================================== */}

      <DesktopHomeContent />


      {/* ======================================================
          MOBILE ONLY
          NEW APP-STYLE HOME CONTENT
      ====================================================== */}

      <MobileHomeContent />

    </>
  );
}


export default Home;