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

import { useTranslation } from "../../useTranslation";

import "./Booking.css";

function Booking() {

  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation();

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
              `${t("seat")} ${
                lostSeats.join(", ")
              } ${
                lostSeats.length > 1
                  ? t("wereJustBooked")
                  : t("wasJustBooked")
              }`
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

      return normalizedServerSeats;

    } catch (error) {

      console.error(
        "Seat availability error:",
        error
      );

      setAvailabilityError(
        t("unableCheckAvailability")
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
          t("unableCheckAvailability")
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
                `${t("seat")} ${
                  lostSeats.join(", ")
                } ${
                  lostSeats.length > 1
                    ? t("wereJustBooked")
                    : t("wasJustBooked")
                }`
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

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {

      if (!currentUser) {

        alert(
          t("loginBeforeBooking")
        );

        navigate("/login");

        return;

      }

      if (
        !booking.from ||
        !booking.to
      ) {

        alert(
          t("selectDepartureDestination")
        );

        return;

      }

      if (!selectedRoute) {

        alert(
          t("journeyNotFound")
        );

        return;

      }

      if (!booking.busType) {

        alert(
          t("selectBusType")
        );

        return;

      }

      if (!selectedBus) {

        alert(
          t("busNotFound")
        );

        return;

      }

      if (!booking.date) {

        alert(
          t("selectTravelDate")
        );

        return;

      }

      if (
        selectedSeats.length === 0
      ) {

        alert(
          t("selectAtLeastOneSeat")
        );

        return;

      }

      const freshBookedSeats =
        await fetchBookedSeats(false);

      if (
        freshBookedSeats === null
      ) {

        alert(
          t("unableVerifySeats")
        );

        return;

      }

      const normalizedSelectedSeats =
        normalizeSeats(
          selectedSeats
        );

      const normalizedBookedSeats =
        normalizeSeats(
          freshBookedSeats
        );

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
          t("seatAlreadyBooked")
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

      if (
        Number(
          booking.passengers
        ) !==
        normalizedSelectedSeats.length
      ) {

        alert(
          t("seatPassengerMismatch")
            .replace(
              "{selected}",
              normalizedSelectedSeats.length
            )
            .replace(
              "{passengers}",
              Number(booking.passengers)
            )
        );

        return;

      }

      if (
        !booking.name.trim()
      ) {

        alert(
          t("enterPassengerName")
        );

        return;

      }

      if (
        !booking.phone.trim()
      ) {

        alert(
          t("enterPhone")
        );

        return;

      }

      if (
        totalPrice <= 0
      ) {

        alert(
          t("unableCalculatePrice")
        );

        return;

      }

      navigate(
        "/payment",
        {
          state: {

            userId:
              currentUser.id,

            from:
              booking.from,

            to:
              booking.to,

            routeId:
              selectedRoute.id,

            busType:
              booking.busType,

            busId:
              selectedBus.id,

            seats:
              normalizedSelectedSeats,

            passengers:
              Number(
                booking.passengers
              ),

            name:
              booking.name,

            phone:
              booking.phone,

            date:
              booking.date,

            totalPrice:
              totalPrice,

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

        <div className="booking-header">

          <h1>
            {t("completeBooking")}
          </h1>

          <p>
            {t("bookingDescription")}
          </p>

        </div>

        <div className="booking-container">

          {/* LEFT SIDE */}

          <div className="booking-summary">

            <h2>
              {t("tripDetails")}
            </h2>

            {selectedOffer ? (

              <div className="booking-offer">

                <div className="booking-offer-icon">
                  🎉
                </div>

                <div className="booking-offer-content">

                  <span>
                    {t("offerApplied")}
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
                    {t("noOfferSelected")}
                  </strong>

                  <small>
                    {t("regularPriceBooking")}
                  </small>

                </div>

              </div>

            )}

            <div className="form-group">

              <label>
                {t("from")}
              </label>

              <select
                name="from"
                value={booking.from}
                onChange={handleChange}
              >

                <option value="">
                  {t("selectDepartureCity")}
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

            <div className="form-group">

              <label>
                {t("to")}
              </label>

              <select
                name="to"
                value={booking.to}
                onChange={handleChange}
              >

                <option value="">
                  {t("selectDestination")}
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

            <div className="form-group">

              <label>
                {t("busType")}
              </label>

              <select
                name="busType"
                value={booking.busType}
                onChange={handleChange}
              >

                <option value="">
                  {t("selectBusType")}
                </option>

                <option value="VIP Coach">
                  {t("vipCoach")}
                </option>

                <option value="Standard">
                  {t("standard")}
                </option>

                <option value="Shuttle">
                  {t("shuttle")}
                </option>

              </select>

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
                    {t("retry")}
                  </button>

                </div>

              )}

              {booking.busType && (

                <>

                  {!booking.from ||
                  !booking.to ||
                  !booking.date ? (

                    <div className="seat-loading">

                      <p>
                        {t("selectRouteAndDate")}
                      </p>

                    </div>

                  ) : loadingSeats ? (

                    <div className="seat-loading">

                      <p>
                        🔄 {t("checkingSeats")}
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

            <div className="summary-item">

              <span>
                {t("route")}
              </span>

              <strong>

                {booking.from &&
                booking.to
                  ? `${booking.from} → ${booking.to}`
                  : t("notSelected")}

              </strong>

            </div>

            <div className="summary-item">

              <span>
                {t("bus")}
              </span>

              <strong>

                {booking.busType
                  ? booking.busType
                  : t("notSelected")}

              </strong>

            </div>

            <div className="summary-item">

              <span>
                {t("seats")}
              </span>

              <strong>

                {selectedSeats.length > 0
                  ? selectedSeats.join(", ")
                  : t("notSelected")}

              </strong>

            </div>

            <div className="price-summary">

              <span>
                {t("totalPrice")}
              </span>

              <strong className="price">

                {totalPrice > 0
                  ? `XAF ${totalPrice.toLocaleString("en-GB")}`
                  : t("selectRoute")}

              </strong>

            </div>

            <div className="summary-item">

              <span>
                {t("discount")}
              </span>

              <strong className="discount-price">

                {discount > 0
                  ? `- XAF ${discount.toLocaleString("en-GB")}`
                  : "XAF 0"}

              </strong>

            </div>

            <div className="summary-item">

              <span>
                {t("totalPayment")}
              </span>

              <strong className="price">

                {totalPayment > 0
                  ? `XAF ${totalPayment.toLocaleString("en-GB")}`
                  : t("selectRoute")}

              </strong>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="booking-form">

            <h2>
              {t("passengerInformation")}
            </h2>

            <div className="form-group">

              <label>
                {t("fullName")}
              </label>

              <input
                type="text"
                name="name"
                value={booking.name}
                onChange={handleChange}
                placeholder={t("enterYourName")}
              />

            </div>

            <div className="form-group">

              <label>
                {t("phoneNumber")}
              </label>

              <input
                type="tel"
                name="phone"
                value={booking.phone}
                onChange={handleChange}
                placeholder={t("enterPhoneNumber")}
              />

            </div>

            <div className="form-group">

              <label>
                {t("travelDate")}
              </label>

              <input
                type="date"
                name="date"
                value={booking.date}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>
                {t("passengers")}
              </label>

              <select
                name="passengers"
                value={booking.passengers}
                onChange={handleChange}
              >

                <option value={1}>
                  {t("onePassenger")}
                </option>

                <option value={2}>
                  {t("twoPassengers")}
                </option>

                <option value={3}>
                  {t("threePassengers")}
                </option>

                <option value={4}>
                  {t("fourPassengers")}
                </option>

              </select>

            </div>

            <div className="payment-preview">

              <div>

                <span>
                  {t("originalPrice")}
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
                  {t("yourDiscount")}
                </span>

                <strong>

                  {discountPercentage > 0
                    ? `${discountPercentage}% ${t("off")}`
                    : t("noDiscount")}

                </strong>

              </div>

              <div>

                <span>
                  {t("discountAmount")}
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
                  {t("youllPay")}
                </span>

                <strong>

                  XAF{" "}
                  {totalPayment.toLocaleString(
                    "en-GB"
                  )}

                </strong>

              </div>

            </div>

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
                ? `🔄 ${t("checkingAvailability")}`
                : t("continueToPayment")}

            </button>

          </div>

        </div>

      </section>

      <Footer />

    </>

  );

}

export default Booking;
