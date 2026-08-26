import React, {
  useEffect,
  useState,
  useRef,
  useCallback
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

  const searchData =
    location.state || {};


  // =========================================
  // LOGGED-IN USER
  // =========================================

  const currentUser =
    JSON.parse(
      localStorage.getItem(
        "currentUser"
      ) || "null"
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
  // AVAILABILITY ERROR
  // =========================================

  const [
    availabilityError,
    setAvailabilityError
  ] = useState("");


  // =========================================
  // BACKGROUND SEAT CHECKING
  // =========================================

  const [
    checkingSeats,
    setCheckingSeats
  ] = useState(false);


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
  // PREVENT OLD REQUESTS FROM OVERWRITING
  // NEW DATA
  // =========================================

  const requestIdRef =
    useRef(0);


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

  const selectedBus =
    buses.find(
      (bus) =>
        bus.name ===
        booking.busType
    );


  // =========================================
  // FIND SELECTED ROUTE
  // =========================================

  const selectedRoute =
    routes.find(
      (route) =>
        route.from ===
          booking.from &&
        route.to ===
          booking.to
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
  // This function DOES NOT hide SeatSelection.
  // =========================================

  const fetchBookedSeats = useCallback(
    async (
      showChecking = false,
      showAlert = false
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


      const currentRequestId =
        ++requestIdRef.current;


      try {

        if (showChecking) {
          setCheckingSeats(true);
        }


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


        // =========================================
        // IGNORE OLD REQUEST
        // =========================================

        if (
          currentRequestId !==
          requestIdRef.current
        ) {

          return null;

        }


        const serverSeats =
          response.data?.bookedSeats ||
          [];


        const normalizedServerSeats =
          normalizeSeats(
            serverSeats
          );


        // =========================================
        // UPDATE BOOKED SEATS
        //
        // This does NOT affect loading state
        // or remove SeatSelection.
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


            // Only show the alert during
            // background refreshes.

            if (
              showAlert &&
              lostSeats.length > 0
            ) {

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


        // Do not destroy the seat layout.
        // Just show the error message.

        setAvailabilityError(
          t(
            "unableCheckAvailability"
          )
        );


        return null;

      } finally {

        if (
          currentRequestId ===
          requestIdRef.current
        ) {

          setCheckingSeats(false);

        }

      }

    },
    [
      selectedBus?.id,
      selectedRoute?.id,
      booking.from,
      booking.to,
      booking.date,
      t
    ]
  );


  // =========================================
  // INITIAL SEAT AVAILABILITY
  //
  // IMPORTANT:
  // SeatSelection remains mounted while
  // availability is being checked.
  // =========================================

  useEffect(() => {

    let cancelled = false;


    const loadSeats = async () => {

      if (
        !selectedBus?.id ||
        !selectedRoute?.id ||
        !booking.from ||
        !booking.to ||
        !booking.date
      ) {

        setBookedSeats([]);
        setSelectedSeats([]);
        setAvailabilityError("");
        setCheckingSeats(false);

        return;

      }


      if (cancelled) {
        return;
      }


      setAvailabilityError("");
      setCheckingSeats(true);


      const currentRequestId =
        ++requestIdRef.current;


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


        if (
          cancelled ||
          currentRequestId !==
            requestIdRef.current
        ) {

          return;

        }


        const serverSeats =
          response.data?.bookedSeats ||
          [];


        const normalizedServerSeats =
          normalizeSeats(
            serverSeats
          );


        setBookedSeats(
          normalizedServerSeats
        );


        // Remove any selected seat that
        // is already booked.

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

        if (cancelled) {
          return;
        }


        console.error(
          "Initial seat availability error:",
          error
        );


        setAvailabilityError(
          t(
            "unableCheckAvailability"
          )
        );


        // IMPORTANT:
        // Do NOT clear booked seats here.
        // This prevents unnecessary visual flashing.
        //
        // We simply keep whatever data we already have.


      } finally {

        if (!cancelled) {

          setCheckingSeats(false);

        }

      }

    };


    loadSeats();



  }, [
    selectedBus?.id,
    selectedRoute?.id,
    booking.from,
    booking.to,
    booking.date,
    t
  ]);


  // =========================================
  // AUTOMATIC BACKGROUND SEAT REFRESH
  //
  // Refreshes every 3 seconds WITHOUT
  // unmounting SeatSelection.
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

      await fetchBookedSeats(
        false,
        true
      );

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
    booking.date,
    fetchBookedSeats
  ]);


  // =========================================
  // HANDLE INPUT CHANGES
  // =========================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setBooking(
      (prev) => ({
        ...prev,
        [name]: value
      })
    );


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
      Number(
        selectedRoute.price
      ) +
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

      // =========================================
      // LOGIN CHECK
      // =========================================

      if (!currentUser) {

        alert(
          t("loginBeforeBooking")
        );

        navigate("/login");

        return;

      }


      // =========================================
      // ROUTE CHECK
      // =========================================

      if (
        !booking.from ||
        !booking.to
      ) {

        alert(
          t(
            "selectDepartureDestination"
          )
        );

        return;

      }


      if (!selectedRoute) {

        alert(
          t("journeyNotFound")
        );

        return;

      }


      // =========================================
      // BUS CHECK
      // =========================================

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


      // =========================================
      // DATE CHECK
      // =========================================

      if (!booking.date) {

        alert(
          t("selectTravelDate")
        );

        return;

      }


      // =========================================
      // SEAT CHECK
      // =========================================

      if (
        selectedSeats.length === 0
      ) {

        alert(
          t("selectAtLeastOneSeat")
        );

        return;

      }


      // =========================================
      // VERIFY FRESH AVAILABILITY
      // =========================================

      const freshBookedSeats =
        await fetchBookedSeats(
          false,
          false
        );


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


      // =========================================
      // CHECK FOR TAKEN SEAT
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


      // =========================================
      // PASSENGER / SEAT MATCH
      // =========================================

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
              Number(
                booking.passengers
              )
            )
        );

        return;

      }


      // =========================================
      // NAME CHECK
      // =========================================

      if (
        !booking.name.trim()
      ) {

        alert(
          t("enterPassengerName")
        );

        return;

      }


      // =========================================
      // PHONE CHECK
      // =========================================

      if (
        !booking.phone.trim()
      ) {

        alert(
          t("enterPhone")
        );

        return;

      }


      // =========================================
      // PRICE CHECK
      // =========================================

      if (
        totalPrice <= 0
      ) {

        alert(
          t("unableCalculatePrice")
        );

        return;

      }


      // =========================================
      // GO TO PAYMENT
      // =========================================

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


          {/* =================================
              LEFT SIDE
          ================================= */}

          <div className="booking-summary">

            <h2>
              {t("tripDetails")}
            </h2>


            {/* =================================
                OFFER
            ================================= */}

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


            {/* =================================
                FROM
            ================================= */}

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


            {/* =================================
                TO
            ================================= */}

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


            {/* =================================
                BUS TYPE
            ================================= */}

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


              {/* =================================
                  AVAILABILITY ERROR
              ================================= */}

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
                      fetchBookedSeats(
                        true,
                        false
                      )
                    }
                  >
                    {t("retry")}
                  </button>

                </div>

              )}


              {/* =================================
                  SEAT SELECTION
              ================================= */}

              {booking.busType && (

                <>

                  {!booking.from ||
                  !booking.to ||
                  !booking.date ? (

                    <div className="seat-loading">

                      <p>
                        {t(
                          "selectRouteAndDate"
                        )}
                      </p>

                    </div>

                  ) : !selectedBus ? (

                    <div className="seat-loading">

                      <p>
                        {t("busNotFound")}
                      </p>

                    </div>

                  ) : (

                    <div className="seat-selection-wrapper">

                      {/* =================================
                          SMALL BACKGROUND CHECK INDICATOR
                          DOES NOT REPLACE SEATS
                      ================================= */}

                      {checkingSeats && (

                        <div className="seat-background-check">

                          <span className="seat-check-dot">
                            ●
                          </span>

                          <span>
                            {t("checkingSeats")}
                          </span>

                        </div>

                      )}


                      {/* =================================
                          SEAT MAP ALWAYS STAYS MOUNTED
                      ================================= */}

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

                    </div>

                  )}

                </>

              )}

            </div>


            {/* =================================
                ROUTE SUMMARY
            ================================= */}

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


            {/* =================================
                BUS SUMMARY
            ================================= */}

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


            {/* =================================
                SEAT SUMMARY
            ================================= */}

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


            {/* =================================
                TOTAL PRICE
            ================================= */}

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


            {/* =================================
                DISCOUNT
            ================================= */}

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


            {/* =================================
                TOTAL PAYMENT
            ================================= */}

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


          {/* =================================
              RIGHT SIDE
          ================================= */}

          <div className="booking-form">

            <h2>
              {t("passengerInformation")}
            </h2>


            {/* =================================
                NAME
            ================================= */}

            <div className="form-group">

              <label>
                {t("fullName")}
              </label>

              <input
                type="text"
                name="name"
                value={booking.name}
                onChange={handleChange}
                placeholder={
                  t("enterYourName")
                }
              />

            </div>


            {/* =================================
                PHONE
            ================================= */}

            <div className="form-group">

              <label>
                {t("phoneNumber")}
              </label>

              <input
                type="tel"
                name="phone"
                value={booking.phone}
                onChange={handleChange}
                placeholder={
                  t("enterPhoneNumber")
                }
              />

            </div>


            {/* =================================
                DATE
            ================================= */}

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


            {/* =================================
                PASSENGERS
            ================================= */}

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


            {/* =================================
                PAYMENT PREVIEW
            ================================= */}

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


            {/* =================================
                CONTINUE BUTTON
            ================================= */}

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
                ? `🔄 ${t(
                    "checkingAvailability"
                  )}`
                : t(
                    "continueToPayment"
                  )}

            </button>

          </div>

        </div>

      </section>


      <Footer />

    </>

  );

}


export default Booking;