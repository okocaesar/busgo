import React, {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import axios from "axios";

import { API_URL } from "../../api";

import cities from "../../data/cities";
import routes from "../../data/routes";
import buses from "../../data/buses";

import SeatSelection from "../../components/SeatSelection/SeatSelection";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import BackButton from "../../components/BackButton/BackButton";

import "./Booking.css";

function Booking() {

  const navigate = useNavigate();

  const location = useLocation();

  // =========================================
  // SEARCH CARD DATA
  // =========================================

  const searchData = location.state || {};

  // =========================================
  // LOGGED-IN USER
  // =========================================

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

  // =========================================
  // SELECTED SEATS
  // =========================================

  const [
    selectedSeats,
    setSelectedSeats
  ] = useState([]);

  // =========================================
  // BOOKED SEATS
  // =========================================

  const [
    bookedSeats,
    setBookedSeats
  ] = useState([]);

  // =========================================
  // LOADING BOOKED SEATS
  // =========================================

  const [
    loadingSeats,
    setLoadingSeats
  ] = useState(false);

  // =========================================
  // AVAILABILITY ERROR
  // =========================================

  const [
    availabilityError,
    setAvailabilityError
  ] = useState("");

  // =========================================
  // PROCESSING
  // =========================================

  const [
    isProcessing,
    setIsProcessing
  ] = useState(false);

  // =========================================
  // OFFER
  // =========================================

  const selectedOffer =
    location.state?.offer || null;

  // =========================================
  // BOOKING INFORMATION
  // =========================================

  const [
    booking,
    setBooking
  ] = useState({

    from:
      searchData.from || "",

    to:
      searchData.to || "",

    busType:
      "",

    passengers:
      searchData.passengers || 1,

    name:
      currentUser?.name || "",

    phone:
      "",

    date:
      searchData.date || ""

  });

  // =========================================
  // FIND SELECTED BUS
  // =========================================

  const selectedBus = buses.find(
    (bus) =>
      bus.name === booking.busType
  );

  // =========================================
  // FIND SELECTED ROUTE
  // =========================================

  const selectedRoute = routes.find(
    (route) =>
      route.from === booking.from &&
      route.to === booking.to
  );

  // =========================================
  // NORMALIZE SEAT DATA
  // =========================================

  const normalizeSeats = (seats) => {

    if (!Array.isArray(seats)) {
      return [];
    }

    return [
      ...new Set(
        seats
          .map((seat) => {

            if (
              typeof seat === "object" &&
              seat !== null
            ) {

              return Number(
                seat.seat ??
                seat.seatNumber ??
                seat.number
              );

            }

            return Number(seat);

          })
          .filter(
            (seat) =>
              Number.isInteger(seat) &&
              seat > 0
          )
      )
    ];

  };

  // =========================================
  // FETCH BOOKED SEATS
  //
  // IMPORTANT:
  // This function returns the fresh seats
  // received from the backend.
  //
  // This prevents the stale React state
  // race condition.
  // =========================================

  const fetchBookedSeats = async (
    showLoading = true
  ) => {

    if (
      !selectedBus?.id ||
      !selectedRoute?.id ||
      !booking.from ||
      !booking.to ||
      !booking.date
    ) {

      setBookedSeats([]);

      return [];

    }

    try {

      if (showLoading) {
        setLoadingSeats(true);
      }

      setAvailabilityError("");

      const response =
        await axios.get(
          `${API_URL}/api/bookings/availability`,
          {
            params: {

              busId:
                selectedBus.id,

              routeId:
                selectedRoute.id,

              from:
                booking.from,

              to:
                booking.to,

              date:
                booking.date

            }
          }
        );

      const serverSeats =
        response.data?.bookedSeats || [];
        console.log("========== FRONTEND SEAT DEBUG ==========");
        console.log("Selected Bus:", selectedBus);
        console.log("Selected Route:", selectedRoute);
        console.log("Bus ID:", selectedBus?.id);
        console.log("Route ID:", selectedRoute?.id);
        console.log("Travel Date:", booking.date);
        console.log("Availability Response:", response.data);
        console.log("Booked Seats From Server:", response.data?.bookedSeats);
        console.log("==========================================");

      const normalizedServerSeats =
        normalizeSeats(serverSeats);

      // =========================================
      // UPDATE UI
      // =========================================

      setBookedSeats(
        normalizedServerSeats
      );

      // =========================================
      // REMOVE SEATS THAT BECAME BOOKED
      // =========================================

      setSelectedSeats(
        (currentSelected) => {

          const lostSeats =
            currentSelected.filter(
              (seat) =>
                normalizedServerSeats.includes(
                  Number(seat)
                )
            );

          if (lostSeats.length > 0) {

            alert(
              `Seat${lostSeats.length > 1 ? "s" : ""} ${lostSeats.join(", ")} ${
                lostSeats.length > 1
                  ? "were"
                  : "was"
              } just booked by another user. Please choose another seat.`
            );

          }

          return currentSelected.filter(
            (seat) =>
              !normalizedServerSeats.includes(
                Number(seat)
              )
          );

        }
      );

      // =========================================
      // VERY IMPORTANT
      //
      // Return the latest server seats
      // immediately.
      // =========================================

      return normalizedServerSeats;

    } catch (error) {

      console.error(
        "Seat availability error:",
        error
      );

      setAvailabilityError(
        "Unable to check seat availability. Please try again."
      );

      return null;

    } finally {

      if (showLoading) {
        setLoadingSeats(false);
      }

    }

  };

  // =========================================
  // LOAD BOOKED SEATS WHEN TRIP CHANGES
  // =========================================

  useEffect(() => {

    let mounted = true;

    const loadSeats = async () => {

      if (
        !selectedBus?.id ||
        !selectedRoute?.id ||
        !booking.from ||
        !booking.to ||
        !booking.date
      ) {

        if (mounted) {

          setBookedSeats([]);

          setSelectedSeats([]);

          setAvailabilityError("");

          setLoadingSeats(false);

        }

        return;

      }

      if (mounted) {
        setLoadingSeats(true);
      }

      try {

        setAvailabilityError("");

        const response =
          await axios.get(
            `${API_URL}/api/bookings/availability`,
            {
              params: {

                busId:
                  selectedBus.id,

                routeId:
                  selectedRoute.id,

                from:
                  booking.from,

                to:
                  booking.to,

                date:
                  booking.date

              }
            }
          );

        if (!mounted) {
          return;
        }

        const serverSeats =
          response.data?.bookedSeats || [];

        const normalizedServerSeats =
          normalizeSeats(serverSeats);

        setBookedSeats(
          normalizedServerSeats
        );

        setSelectedSeats(
          (currentSelected) =>
            currentSelected.filter(
              (seat) =>
                !normalizedServerSeats.includes(
                  Number(seat)
                )
            )
        );

      } catch (error) {

        if (!mounted) {
          return;
        }

        console.error(
          "Initial seat availability error:",
          error
        );

        setBookedSeats([]);

        setAvailabilityError(
          "Unable to check seat availability."
        );

      } finally {

        if (mounted) {
          setLoadingSeats(false);
        }

      }

    };

    loadSeats();

    return () => {
      mounted = false;
    };

  }, [
    selectedBus?.id,
    selectedRoute?.id,
    booking.from,
    booking.to,
    booking.date
  ]);

  // =========================================
  // AUTOMATIC SEAT REFRESH
  //
  // Checks the server every 3 seconds.
  // =========================================

  useEffect(() => {

    if (
      !selectedBus?.id ||
      !selectedRoute?.id ||
      !booking.from ||
      !booking.to ||
      !booking.date
    ) {

      return;

    }

    const refreshSeats = async () => {

      try {

        const response =
          await axios.get(
            `${API_URL}/api/bookings/availability`,
            {
              params: {

                busId:
                  selectedBus.id,

                routeId:
                  selectedRoute.id,

                from:
                  booking.from,

                to:
                  booking.to,

                date:
                  booking.date

              }
            }
          );

        const serverSeats =
          response.data?.bookedSeats || [];

        const normalizedServerSeats =
          normalizeSeats(serverSeats);

        setBookedSeats(
          normalizedServerSeats
        );

        setSelectedSeats(
          (currentSelected) => {

            const lostSeats =
              currentSelected.filter(
                (seat) =>
                  normalizedServerSeats.includes(
                    Number(seat)
                  )
              );

            if (lostSeats.length > 0) {

              alert(
                `Seat${lostSeats.length > 1 ? "s" : ""} ${lostSeats.join(", ")} ${
                  lostSeats.length > 1
                    ? "were"
                    : "was"
                } just booked by another user. Please choose another seat.`
              );

            }

            return currentSelected.filter(
              (seat) =>
                !normalizedServerSeats.includes(
                  Number(seat)
                )
            );

          }
        );

      } catch (error) {

        console.error(
          "Automatic seat refresh error:",
          error
        );

      }

    };

    const interval =
      setInterval(
        refreshSeats,
        3000
      );

    return () => {
      clearInterval(interval);
    };

  }, [
    selectedBus?.id,
    selectedRoute?.id,
    booking.from,
    booking.to,
    booking.date
  ]);

  // =========================================
  // HANDLE INPUT CHANGES
  // =========================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;

    setBooking((prev) => ({
      ...prev,
      [name]: value
    }));

    if (
      name === "busType" ||
      name === "date" ||
      name === "from" ||
      name === "to"
    ) {

      setSelectedSeats([]);

      setBookedSeats([]);

      setAvailabilityError("");

    }

  };

  // =========================================
  // CALCULATE PRICE
  // =========================================

  const calculatePrice = () => {

    if (
      !selectedRoute ||
      !selectedBus
    ) {

      return 0;

    }

    const pricePerPerson =
      Number(selectedRoute.price) +
      Number(
        selectedBus.extraPrice || 0
      );

    return (
      pricePerPerson *
      Number(
        booking.passengers || 1
      )
    );

  };

  // =========================================
  // GET DISCOUNT PERCENTAGE
  // =========================================

  const getDiscountPercentage = () => {

    if (
      !selectedOffer?.discount
    ) {

      return 0;

    }

    return (
      parseFloat(
        String(
          selectedOffer.discount
        ).replace("%", "")
      ) || 0
    );

  };

  // =========================================
  // CALCULATE DISCOUNT
  // =========================================

  const calculateDiscount = () => {

    const totalPrice =
      calculatePrice();

    const discountPercentage =
      getDiscountPercentage();

    if (
      totalPrice <= 0 ||
      discountPercentage <= 0
    ) {

      return 0;

    }

    return (
      totalPrice *
      (
        discountPercentage / 100
      )
    );

  };

  // =========================================
  // CALCULATE FINAL PAYMENT
  // =========================================

  const calculateTotalPayment = () => {

    const totalPrice =
      calculatePrice();

    const discount =
      calculateDiscount();

    return Math.max(
      0,
      totalPrice - discount
    );

  };

  // =========================================
  // PRICE VARIABLES
  // =========================================

  const totalPrice =
    calculatePrice();

  const discount =
    calculateDiscount();

  const totalPayment =
    calculateTotalPayment();

  const discountPercentage =
    getDiscountPercentage();

  // =========================================
  // CONTINUE TO PAYMENT
  // =========================================

  const handleContinue = async () => {

    // =========================================
    // PREVENT DOUBLE CLICK
    // =========================================

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {

      // =========================================
      // LOGIN
      // =========================================

      if (!currentUser) {

        alert(
          "Please login before making a booking."
        );

        navigate("/login");

        return;

      }

      // =========================================
      // ROUTE
      // =========================================

      if (
        !booking.from ||
        !booking.to
      ) {

        alert(
          "Please select your departure and destination."
        );

        return;

      }

      if (!selectedRoute) {

        alert(
          "The selected journey could not be found."
        );

        return;

      }

      // =========================================
      // BUS
      // =========================================

      if (!booking.busType) {

        alert(
          "Please select a bus type."
        );

        return;

      }

      if (!selectedBus) {

        alert(
          "The selected bus could not be found."
        );

        return;

      }

      // =========================================
      // DATE
      // =========================================

      if (!booking.date) {

        alert(
          "Please select your travel date."
        );

        return;

      }

      // =========================================
      // SEATS
      // =========================================

      if (
        selectedSeats.length === 0
      ) {

        alert(
          "Please select at least one seat."
        );

        return;

      }

      // =========================================
      // CRITICAL:
      //
      // GET FRESH AVAILABILITY DIRECTLY FROM
      // THE SERVER RIGHT BEFORE PROCEEDING.
      // =========================================

      const freshBookedSeats =
        await fetchBookedSeats(false);

      // =========================================
      // SERVER CHECK FAILED
      // =========================================

      if (
        freshBookedSeats === null
      ) {

        alert(
          "Unable to verify seat availability. Please try again."
        );

        return;

      }

      // =========================================
      // NORMALIZE SELECTED SEATS
      // =========================================

      const normalizedSelectedSeats =
        normalizeSeats(
          selectedSeats
        );

      // =========================================
      // IMPORTANT:
      //
      // Use fresh server response.
      //
      // DO NOT use `bookedSeats` state here.
      // =========================================

      const normalizedBookedSeats =
        normalizeSeats(
          freshBookedSeats
        );

      // =========================================
      // CHECK IF USER SELECTED A TAKEN SEAT
      // =========================================

      const tryingToBookTakenSeat =
        normalizedSelectedSeats.some(
          (seat) =>
            normalizedBookedSeats.includes(
              seat
            )
        );

      if (
        tryingToBookTakenSeat
      ) {

        alert(
          "❌ One or more selected seats have already been booked by another user. Please select another seat."
        );

        setSelectedSeats(
          normalizedSelectedSeats.filter(
            (seat) =>
              !normalizedBookedSeats.includes(
                seat
              )
          )
        );

        return;

      }

      // =========================================
      // PASSENGER COUNT
      // =========================================

      if (
        Number(
          booking.passengers
        ) !==
        normalizedSelectedSeats.length
      ) {

        alert(
          `You selected ${normalizedSelectedSeats.length} seat${
            normalizedSelectedSeats.length > 1
              ? "s"
              : ""
          }, but the passenger count is ${
            Number(
              booking.passengers
            )
          }. Please make them match.`
        );

        return;

      }

      // =========================================
      // PASSENGER NAME
      // =========================================

      if (
        !booking.name.trim()
      ) {

        alert(
          "Please enter the passenger name."
        );

        return;

      }

      // =========================================
      // PHONE
      // =========================================

      if (
        !booking.phone.trim()
      ) {

        alert(
          "Please enter your phone number."
        );

        return;

      }

      // =========================================
      // PRICE
      // =========================================

      if (
        totalPrice <= 0
      ) {

        alert(
          "Unable to calculate the route price."
        );

        return;

      }

      // =========================================
      // ALL CHECKS PASSED
      //
      // GO TO PAYMENT
      // =========================================

      navigate(
        "/payment",
        {
          state: {

            // =====================================
            // USER
            // =====================================

            userId:
              currentUser.id,

            // =====================================
            // ROUTE
            // =====================================

            from:
              booking.from,

            to:
              booking.to,

            routeId:
              selectedRoute.id,

            // =====================================
            // BUS
            // =====================================

            busType:
              booking.busType,

            busId:
              selectedBus.id,

            // =====================================
            // SEATS
            // =====================================

            seats:
              normalizedSelectedSeats,

            // =====================================
            // PASSENGERS
            // =====================================

            passengers:
              Number(
                booking.passengers
              ),

            // =====================================
            // PASSENGER INFORMATION
            // =====================================

            name:
              booking.name,

            phone:
              booking.phone,

            date:
              booking.date,

            // =====================================
            // PRICE
            // =====================================

            totalPrice:
              totalPrice,

            // =====================================
            // OFFER
            // =====================================

            offerId:
              selectedOffer?.id ||
              null,

            offerTitle:
              selectedOffer?.title ||
              "No Offer",

            discountPercentage:
              discountPercentage,

            discount:
              discount,

            totalPayment:
              totalPayment,

            // =====================================
            // COMPATIBILITY
            // =====================================

            total:
              totalPayment

          }

        }
      );

    } finally {

      setIsProcessing(false);

    }

  };

  // =========================================
  // PAGE
  // =========================================

  return (

    <>

      <Navbar />

      <section className="booking-page">

        {/* =====================================
            BACK BUTTON
        ===================================== */}

        <div className="booking-top">

          <BackButton />

        </div>

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="booking-header">

          <h1>
            Complete Your Booking
          </h1>

          <p>
            Select your journey details and reserve your seat.
          </p>

        </div>

        <div className="booking-container">

          {/* =====================================
              LEFT SIDE
          ===================================== */}

          <div className="booking-summary">

            <h2>
              Trip Details
            </h2>

            {/* =====================================
                OFFER
            ===================================== */}

            {selectedOffer ? (

              <div className="booking-offer">

                <div className="booking-offer-icon">
                  🎉
                </div>

                <div className="booking-offer-content">

                  <span>
                    OFFER APPLIED
                  </span>

                  <strong>
                    {selectedOffer.title}
                  </strong>

                  <small>
                    {selectedOffer.discount} OFF
                  </small>

                </div>

              </div>

            ) : (

              <div className="no-offer">

                <span>
                  🎟️
                </span>

                <div>

                  <strong>
                    No offer selected
                  </strong>

                  <small>
                    You can continue booking at the regular price.
                  </small>

                </div>

              </div>

            )}

            {/* =====================================
                FROM
            ===================================== */}

            <div className="form-group">

              <label>
                From
              </label>

              <select
                name="from"
                value={booking.from}
                onChange={handleChange}
              >

                <option value="">
                  Select Departure City
                </option>

                {cities.map(
                  (city) => (

                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>

                  )
                )}

              </select>

            </div>

            {/* =====================================
                TO
            ===================================== */}

            <div className="form-group">

              <label>
                To
              </label>

              <select
                name="to"
                value={booking.to}
                onChange={handleChange}
              >

                <option value="">
                  Select Destination
                </option>

                {cities
                  .filter(
                    (city) =>
                      city !==
                      booking.from
                  )
                  .map(
                    (city) => (

                      <option
                        key={city}
                        value={city}
                      >
                        {city}
                      </option>

                    )
                  )
                }

              </select>

            </div>

            {/* =====================================
                BUS TYPE
            ===================================== */}

            <div className="form-group">

              <label>
                Bus Type
              </label>

              <select
                name="busType"
                value={booking.busType}
                onChange={handleChange}
              >

                <option value="">
                  Select bus type
                </option>

                <option value="VIP Coach">
                  VIP Coach
                </option>

                <option value="Standard">
                  Standard
                </option>

                <option value="Shuttle">
                  Shuttle
                </option>

              </select>

              {/* =====================================
                  AVAILABILITY ERROR
              ===================================== */}

              {availabilityError && (

                <div
                  className="seat-loading"
                  style={{
                    color: "#dc2626"
                  }}
                >

                  <p>
                    {availabilityError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      fetchBookedSeats(true)
                    }
                  >
                    Retry
                  </button>

                </div>

              )}

              {/* =====================================
                  SEAT SELECTION
              ===================================== */}

              {booking.busType && (

                <>

                  {!booking.from ||
                  !booking.to ||
                  !booking.date ? (

                    <div className="seat-loading">

                      <p>
                        Select your route and travel date
                        to view seat availability.
                      </p>

                    </div>

                  ) : loadingSeats ? (

                    <div className="seat-loading">

                      <p>
                        🔄 Checking available seats...
                      </p>

                    </div>

                  ) : (

                    <SeatSelection

                      totalSeats={
                        selectedBus?.seats ||
                        0
                      }

                      selectedSeats={
                        selectedSeats
                      }

                      setSelectedSeats={
                        setSelectedSeats
                      }

                      bookedSeats={
                        bookedSeats
                      }

                    />

                  )}

                </>

              )}

            </div>

            {/* =====================================
                ROUTE SUMMARY
            ===================================== */}

            <div className="summary-item">

              <span>
                Route
              </span>

              <strong>

                {booking.from &&
                booking.to
                  ? `${booking.from} → ${booking.to}`
                  : "Not selected"}

              </strong>

            </div>

            {/* =====================================
                BUS SUMMARY
            ===================================== */}

            <div className="summary-item">

              <span>
                Bus
              </span>

              <strong>

                {booking.busType
                  ? booking.busType
                  : "Not selected"}

              </strong>

            </div>

            {/* =====================================
                SEAT SUMMARY
            ===================================== */}

            <div className="summary-item">

              <span>
                Seats
              </span>

              <strong>

                {selectedSeats.length > 0
                  ? selectedSeats.join(", ")
                  : "Not selected"}

              </strong>

            </div>

            {/* =====================================
                PRICE
            ===================================== */}

            <div className="price-summary">

              <span>
                Total Price
              </span>

              <strong className="price">

                {totalPrice > 0
                  ? `XAF ${totalPrice.toLocaleString("en-GB")}`
                  : "Select route"}

              </strong>

            </div>

            {/* =====================================
                DISCOUNT
            ===================================== */}

            <div className="summary-item">

              <span>
                Discount
              </span>

              <strong className="discount-price">

                {discount > 0
                  ? `- XAF ${discount.toLocaleString("en-GB")}`
                  : "XAF 0"}

              </strong>

            </div>

            {/* =====================================
                TOTAL PAYMENT
            ===================================== */}

            <div className="summary-item">

              <span>
                Total Payment
              </span>

              <strong className="price">

                {totalPayment > 0
                  ? `XAF ${totalPayment.toLocaleString("en-GB")}`
                  : "Select route"}

              </strong>

            </div>

          </div>

          {/* =====================================
              RIGHT SIDE
          ===================================== */}

          <div className="booking-form">

            <h2>
              Passenger Information
            </h2>

            {/* =====================================
                NAME
            ===================================== */}

            <div className="form-group">

              <label>
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={booking.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />

            </div>

            {/* =====================================
                PHONE
            ===================================== */}

            <div className="form-group">

              <label>
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={booking.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />

            </div>

            {/* =====================================
                DATE
            ===================================== */}

            <div className="form-group">

              <label>
                Travel Date
              </label>

              <input
                type="date"
                name="date"
                value={booking.date}
                onChange={handleChange}
              />

            </div>

            {/* =====================================
                PASSENGERS
            ===================================== */}

            <div className="form-group">

              <label>
                Passengers
              </label>

              <select
                name="passengers"
                value={booking.passengers}
                onChange={handleChange}
              >

                <option value={1}>
                  1 Passenger
                </option>

                <option value={2}>
                  2 Passengers
                </option>

                <option value={3}>
                  3 Passengers
                </option>

                <option value={4}>
                  4 Passengers
                </option>

              </select>

            </div>

            {/* =====================================
                PAYMENT PREVIEW
            ===================================== */}

            <div className="payment-preview">

              <div>

                <span>
                  Original Price
                </span>

                <strong>
                  XAF{" "}
                  {totalPrice.toLocaleString(
                    "en-GB"
                  )}
                </strong>

              </div>

              <div className="preview-discount">

                <span>
                  Your Discount
                </span>

                <strong>

                  {discountPercentage > 0
                    ? `${discountPercentage}% OFF`
                    : "No discount"}

                </strong>

              </div>

              <div>

                <span>
                  Discount Amount
                </span>

                <strong>

                  - XAF{" "}
                  {discount.toLocaleString(
                    "en-GB"
                  )}

                </strong>

              </div>

              <div className="preview-total">

                <span>
                  You'll Pay
                </span>

                <strong>

                  XAF{" "}
                  {totalPayment.toLocaleString(
                    "en-GB"
                  )}

                </strong>

              </div>

            </div>

            {/* =====================================
                CONTINUE
            ===================================== */}

            <button
              type="button"
              className="confirm-btn"
              onClick={handleContinue}
              disabled={isProcessing}
              style={{
                opacity:
                  isProcessing
                    ? 0.6
                    : 1,

                cursor:
                  isProcessing
                    ? "not-allowed"
                    : "pointer"
              }}
            >

              {isProcessing
                ? "🔄 Checking availability..."
                : "Continue to Payment"}

            </button>

          </div>

        </div>

      </section>

      <Footer />

    </>

  );

}

export default Booking;