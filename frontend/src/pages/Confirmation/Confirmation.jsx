import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import axios from "axios";

import {
  useLocation,
  NavLink,
  useNavigate
} from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import { API_URL } from "../../api";

import { useLanguage } from "../../context/LanguageContext";

import "./Confirmation.css";


function Confirmation() {

  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useLanguage();


  // =========================================
  // TEMPORARY CONFIRMATION STORAGE KEY
  // =========================================

  const CONFIRMATION_STORAGE_KEY =
    "busgo_confirmation_booking";

  const TICKET_STORAGE_KEY =
    "busgo_confirmation_ticket";


  // =========================================
  // BOOKING DATA
  // =========================================

  const [booking, setBooking] = useState(() => {

    if (location.state) {
      return location.state;
    }

    try {

      const savedBooking =
        sessionStorage.getItem(
          CONFIRMATION_STORAGE_KEY
        );

      if (!savedBooking) {
        return null;
      }

      return JSON.parse(savedBooking);

    } catch (error) {

      console.error(
        "Unable to restore confirmation booking:",
        error
      );

      return null;

    }

  });


  // =========================================
  // TICKET NUMBER
  // =========================================

  const [ticketNumber] = useState(() => {

    try {

      const savedTicket =
        sessionStorage.getItem(
          TICKET_STORAGE_KEY
        );

      if (savedTicket) {
        return savedTicket;
      }

    } catch (error) {

      console.error(
        "Unable to restore ticket number:",
        error
      );

    }

    const generatedTicket =
      "BG-" +
      Math.floor(
        100000 +
        Math.random() * 900000
      );

    try {

      sessionStorage.setItem(
        TICKET_STORAGE_KEY,
        generatedTicket
      );

    } catch (error) {

      console.error(
        "Unable to save ticket number:",
        error
      );

    }

    return generatedTicket;

  });


  // =========================================
  // SAVING STATE
  // =========================================

  const [saving, setSaving] =
    useState(false);


  // =========================================
  // CONFIRMATION SUCCESS
  // =========================================

  const [confirmed, setConfirmed] =
    useState(false);


  // =========================================
  // LIVE PAYMENT STATUS
  // =========================================
  //
  // Shown while BusGo is waiting on Flutterwave
  // to actually confirm the charge (phone approval,
  // redirect, etc). Not the same as `saving`, which
  // only covers the initial network requests.
  // =========================================

  const [paymentStage, setPaymentStage] =
    useState(null);
  // null | "waiting-approval" | "redirecting" | "failed"

  const [paymentStageMessage, setPaymentStageMessage] =
    useState("");


  // =========================================
  // SAVE BOOKING TO SESSION STORAGE
  // =========================================

  useEffect(() => {

    if (!booking) {
      return;
    }

    try {

      sessionStorage.setItem(
        CONFIRMATION_STORAGE_KEY,
        JSON.stringify(booking)
      );

    } catch (error) {

      console.error(
        "Unable to save confirmation booking:",
        error
      );

    }

  }, [booking]);


  // =========================================
  // NORMALISE SEATS
  // =========================================

  const normalizedSeats = useMemo(() => {

    if (
      !Array.isArray(
        booking?.seats
      )
    ) {
      return [];
    }

    return [
      ...new Set(

        booking.seats
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

  }, [booking]);


  // =========================================
  // PRICE VALUES
  // =========================================

  const totalPrice = Number(
    booking?.totalPrice ??
    booking?.total ??
    0
  );

  const discount = Number(
    booking?.discount ?? 0
  );

  const discountPercentage = Number(
    booking?.discountPercentage ??
    booking?.discount_percentage ??
    0
  );

  const totalPayment = Number(
    booking?.totalPayment ??
    Math.max(
      0,
      totalPrice - discount
    )
  );


  // =========================================
  // QR CODE DATA
  // =========================================

  const qrData = useMemo(() => {

    return `
BUSGO TICKET

${t("ticketNo")}: ${ticketNumber}

${t("passenger")}: ${booking?.name || ""}

${t("phone")}: ${booking?.phone || ""}

${t("route")}:
${booking?.from || ""} → ${booking?.to || ""}

${t("busType")}:
${booking?.busType || ""}

${t("seats")}:
${normalizedSeats.join(", ")}

${t("travelDate")}:
${booking?.date || ""}

${t("totalPrice")}:
XAF ${totalPrice.toLocaleString("en-GB")}

${t("discount")}:
XAF ${discount.toLocaleString("en-GB")}

${t("totalPayment")}:
XAF ${totalPayment.toLocaleString("en-GB")}

${t("paymentMethod")}:
${booking?.paymentMethod || ""}
`;

  }, [
    booking,
    ticketNumber,
    normalizedSeats,
    totalPrice,
    discount,
    totalPayment,
    t
  ]);


  // =========================================
  // CLEAR TEMPORARY CONFIRMATION DATA
  // =========================================

  const clearConfirmationStorage = () => {

    try {

      sessionStorage.removeItem(
        CONFIRMATION_STORAGE_KEY
      );

      sessionStorage.removeItem(
        TICKET_STORAGE_KEY
      );

    } catch (error) {

      console.error(
        "Unable to clear confirmation storage:",
        error
      );

    }

  };


  // =========================================
  // HANDLE AUTH SESSION EXPIRATION
  // =========================================

  const handleSessionExpired = () => {

    localStorage.removeItem(
      "loggedIn"
    );

    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "authToken"
    );

    navigate("/login");

  };


  // =========================================
  // POLL PAYMENT VERIFICATION
  // =========================================
  //
  // Repeatedly calls POST /api/payments/verify, which
  // checks the charge directly with Flutterwave (see
  // paymentController.verifyPayment). Keeps polling while
  // the charge is "Pending" (customer still needs to
  // approve on their phone), and stops as soon as
  // Flutterwave reports a final "Successful" or "Failed"
  // status - or after a timeout.
  // =========================================

  const sleep = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  const pollPaymentVerification = async ({
    transactionId,
    authToken,
    intervalMs = 4000,
    maxAttempts = 30 // ~2 minutes
  }) => {

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {

      try {

        const verifyResponse =
          await axios.post(

            `${API_URL}/api/payments/verify`,

            {
              transactionId
            },

            {
              headers: {
                Authorization:
                  `Bearer ${authToken}`
              }
            }

          );

        const status =
          verifyResponse.data?.status;

        console.log(
          `PAYMENT VERIFY ATTEMPT ${attempt}:`,
          status
        );

        if (
          status === "Successful" ||
          status === "Failed"
        ) {

          return {
            status,
            data: verifyResponse.data
          };

        }

        // status is "Pending" - keep polling

      } catch (verifyError) {

        // A 404 ("charge not found yet") or transient
        // network error shouldn't abort the whole flow -
        // Flutterwave may just not have the charge
        // indexed yet. Keep retrying until maxAttempts.

        console.error(
          `PAYMENT VERIFY ATTEMPT ${attempt} ERROR:`,
          verifyError.response?.data ||
            verifyError.message
        );

      }

      if (attempt < maxAttempts) {
        await sleep(intervalMs);
      }

    }

    return { status: "Pending" };

  };


  // =========================================
  // CONFIRM BOOKING
  // =========================================

  const confirmBooking = async () => {

    if (saving) {
      return;
    }

    setPaymentStage(null);
    setPaymentStageMessage("");


    // =========================================
    // CHECK BOOKING
    // =========================================

    if (!booking) {

      alert(
        t("noBookingInformation")
      );

      navigate("/booking");

      return;

    }


    // =========================================
    // GET CURRENT USER
    // =========================================

    let currentUser = null;

    try {

      currentUser = JSON.parse(
        localStorage.getItem(
          "currentUser"
        ) || "null"
      );

    } catch {

      currentUser = null;

    }


    if (!currentUser?.id) {

      alert(
        t("loginBeforeConfirmation")
      );

      navigate("/login");

      return;

    }


    // =========================================
    // GET AUTH TOKEN
    // =========================================

    const authToken =
      localStorage.getItem(
        "authToken"
      );

    if (!authToken) {

      alert(
        t("sessionExpired")
      );

      handleSessionExpired();

      return;

    }


    // =========================================
    // VALIDATE ROUTE
    // =========================================

    if (
      !booking.from ||
      !booking.to
    ) {

      alert(
        t("routeInformationMissing")
      );

      return;

    }


    // =========================================
    // ROUTE ID
    // =========================================

    if (!booking.routeId) {

      alert(
        t("routeIdMissing")
      );

      return;

    }


    // =========================================
    // BUS TYPE
    // =========================================

    if (!booking.busType) {

      alert(
        t("busTypeMissing")
      );

      return;

    }


    // =========================================
    // BUS ID
    // =========================================

    if (!booking.busId) {

      alert(
        t("busInformationMissing")
      );

      return;

    }


    // =========================================
    // SEATS
    // =========================================

    if (
      normalizedSeats.length === 0
    ) {

      alert(
        t("noValidSeats")
      );

      return;

    }


    // =========================================
    // PASSENGER COUNT
    // =========================================

    const passengerCount =
      Number(
        booking.passengers ??
        normalizedSeats.length
      );

    if (
      !Number.isInteger(
        passengerCount
      ) ||
      passengerCount <= 0
    ) {

      alert(
        t("invalidPassengerCount")
      );

      return;

    }


    if (
      passengerCount !==
      normalizedSeats.length
    ) {

      alert(
        t("passengerSeatMismatch")
      );

      return;

    }


    // =========================================
    // DATE
    // =========================================

    if (!booking.date) {

      alert(
        t("travelDateMissing")
      );

      return;

    }


    // =========================================
    // PASSENGER NAME
    // =========================================

    if (
      !String(
        booking.name || ""
      ).trim()
    ) {

      alert(
        t("passengerNameMissing")
      );

      return;

    }


    // =========================================
    // PHONE
    // =========================================

    if (
      !String(
        booking.phone || ""
      ).trim()
    ) {

      alert(
        t("passengerPhoneMissing")
      );

      return;

    }


    // =========================================
    // PAYMENT METHOD
    // =========================================

    if (!booking.paymentMethod) {

      alert(
        t("paymentMethodMissing")
      );

      return;

    }


    // =========================================
    // PAYMENT AMOUNT
    // =========================================

    if (
      !Number.isFinite(
        totalPayment
      ) ||
      totalPayment <= 0
    ) {

      alert(
        t("invalidPaymentAmount")
      );

      return;

    }


    try {

      setSaving(true);


      console.log(
        "========================================="
      );

      console.log(
        "BUSGO CONFIRMATION"
      );

      console.log(
        "========================================="
      );

      console.log(
        "Booking data:",
        booking
      );

      console.log(
        "User ID:",
        currentUser.id
      );

      console.log(
        "Route ID:",
        booking.routeId
      );

      console.log(
        "Bus ID:",
        booking.busId
      );

      console.log(
        "Seats:",
        normalizedSeats
      );

      console.log(
        "Date:",
        booking.date
      );

      console.log(
        "Total Payment:",
        totalPayment
      );


      // =========================================
      // STEP 1
      // CREATE BOOKING
      // =========================================

      const bookingResponse =
        await axios.post(

          `${API_URL}/api/bookings`,

          {

            ticketNumber:
              ticketNumber,

            userId:
              currentUser.id,

            name:
              booking.name,

            phone:
              booking.phone,

            from:
              booking.from,

            to:
              booking.to,

            routeId:
              booking.routeId,

            busType:
              booking.busType,

            busId:
              booking.busId,

            seats:
              normalizedSeats,

            passengers:
              passengerCount,

            date:
              booking.date,

            totalPrice:
              totalPrice,

            discountPercentage:
              discountPercentage,

            discount:
              discount,

            totalPayment:
              totalPayment,

            offerId:
              booking.offerId ||
              null,

            offerTitle:
              booking.offerTitle ||
              "No Offer",

            // Never claim success before Flutterwave has confirmed
            // anything - the booking starts Pending and is only
            // promoted to Confirmed by verifyPayment() below.
            paymentStatus:
              "Pending",

            paymentMethod:
              booking.paymentMethod,

            paymentDate:
              booking.paymentDate ||
              new Date().toISOString()

          }

        );


      console.log(
        "BOOKING RESPONSE:",
        bookingResponse.data
      );


      // =========================================
      // GET BOOKING ID
      // =========================================

      const bookingId =
        bookingResponse.data?.bookingId ||
        bookingResponse.data?.id ||
        bookingResponse.data?.booking?.id;


      if (!bookingId) {

        throw new Error(
          "Booking was created but the server did not return a booking ID."
        );

      }


      // =========================================
      // STEP 2
      // CREATE PAYMENT RECORD
      // =========================================

      const paymentResponse =
        await axios.post(

          `${API_URL}/api/payments`,

          {

            userId:
              currentUser.id,

            bookingId:
              bookingId,

            amount:
              totalPayment,

            currency:
              "XAF",

            paymentMethod:
              booking.paymentMethod,

            phoneNumber:
              booking.phone

          },

          {

            headers: {

              Authorization:
                `Bearer ${authToken}`

            }

          }

        );


      console.log(
        "PAYMENT RESPONSE:",
        paymentResponse.data
      );


      // =========================================
      // STEP 3
      // CONFIRM THE CHARGE WITH FLUTTERWAVE
      // =========================================
      //
      // POST /api/payments only *initiates* the charge.
      // At this point Flutterwave usually still needs the
      // customer to approve a push notification / PIN on
      // their phone (mobile money), or complete a redirect
      // (card / 3DS). Nothing is actually paid yet.
      //
      // We must call /api/payments/verify - which checks
      // the real status directly with Flutterwave - before
      // this booking can be treated as paid.
      // =========================================

      const transactionId =
        paymentResponse.data?.transactionId;

      const flutterwaveInfo =
        paymentResponse.data?.flutterwave ||
        {};

      const nextAction =
        flutterwaveInfo.nextAction ||
        null;

      if (!transactionId) {

        throw new Error(
          "Payment was initialized but no transaction reference was returned."
        );

      }


      // -----------------------------------------
      // REDIRECT FLOW
      // (card 3DS, or Flutterwave-hosted mobile
      // money authorization page)
      // -----------------------------------------

      const redirectUrl =
        nextAction?.type === "redirect_url"
          ? (
            nextAction?.redirect_url?.url ||
            nextAction?.url ||
            null
          )
          : null;

      if (redirectUrl) {

        setPaymentStage("redirecting");

        setPaymentStageMessage(
          (t("redirectingToCompletePayment") || "Redirecting you to complete the payment...")
        );

        // Persist so verification can be resumed
        // once Flutterwave sends the customer back.
        try {

          sessionStorage.setItem(
            "busgo_pending_payment",
            JSON.stringify({
              transactionId,
              bookingId,
              ticketNumber
            })
          );

        } catch (storageError) {

          console.error(
            "Unable to save pending payment:",
            storageError
          );

        }

        window.location.href =
          redirectUrl;

        return;

      }


      // -----------------------------------------
      // PUSH NOTIFICATION / PIN APPROVAL FLOW
      // (typical for MTN / Orange mobile money)
      // or any other "still pending" charge
      // -----------------------------------------

      setPaymentStage("waiting-approval");

      setPaymentStageMessage(
        (t("approvePaymentOnPhone") || "Check your phone and approve the payment request to continue.")
      );

      const verifiedPayment =
        await pollPaymentVerification({
          transactionId,
          authToken
        });

      if (
        verifiedPayment.status ===
        "Successful"
      ) {

        // =========================================
        // SUCCESS - confirmed by Flutterwave
        // =========================================

        setPaymentStage(null);
        setConfirmed(true);
        clearConfirmationStorage();

        try {

          sessionStorage.removeItem(
            "busgo_pending_payment"
          );

        } catch {

          // ignore

        }


        setBooking(
          (currentBooking) => ({
            ...currentBooking,

            ticketNumber:
              ticketNumber,

            paymentStatus:
              "Successful",

            bookingStatus:
              "Confirmed",

            bookingId:
              bookingId

          })
        );


        alert(
          t("bookingPaymentSuccessful")
        );


        navigate(
          "/dashboard"
        );

        return;

      }

      if (
        verifiedPayment.status ===
        "Failed"
      ) {

        setPaymentStage("failed");

        setPaymentStageMessage(
          (t("paymentFailedTryAgain") || "Payment failed or was declined. Please try again.")
        );

        alert(
          (t("paymentFailedTryAgain") || "Payment failed or was declined. Please try again.")
        );

        return;

      }

      // -----------------------------------------
      // TIMED OUT WAITING - still Pending
      // -----------------------------------------
      // Do NOT mark this as successful. The user can
      // check "My Payments" later; verifyPayment() will
      // still confirm it correctly whenever they do.

      setPaymentStage("failed");

      setPaymentStageMessage(
        (t("paymentStillProcessing") || "We could not confirm your payment yet. It may still be processing - please check My Payments in a few minutes before trying again.")
      );

      alert(
        (t("paymentStillProcessing") || "We could not confirm your payment yet. It may still be processing - please check My Payments in a few minutes before trying again.")
      );


    } catch (error) {

      console.error(
        "BUSGO BOOKING/PAYMENT ERROR",
        error
      );


      // =========================================
      // AUTHORIZATION ERROR
      // =========================================

      if (
        error.response?.status === 401
      ) {

        alert(
          t("sessionExpired")
        );

        handleSessionExpired();

        return;

      }


      // =========================================
      // SEAT CONFLICT
      // =========================================

      if (
        error.response?.status === 409
      ) {

        const conflictMessage =
          error.response.data?.message ||
          t("seatAlreadyBooked");


        const conflictSeats =
          error.response.data?.bookedSeats ||
          [];


        if (
          Array.isArray(
            conflictSeats
          ) &&
          conflictSeats.length > 0
        ) {

          alert(
            `${conflictMessage}\n\n${t("bookedSeats")}: ${conflictSeats.join(", ")}\n\n${t("selectAnotherSeat")}`
          );

        } else {

          alert(
            `${conflictMessage}\n\n${t("selectAnotherSeat")}`
          );

        }

        return;

      }


      // =========================================
      // SERVER ERROR
      // =========================================

      if (error.response) {

        const serverMessage =
          error.response.data?.message ||
          t("unableSaveBooking");


        const serverError =
          error.response.data?.error ||
          "";


        if (serverError) {

          alert(
            `${serverMessage}\n\n${serverError}`
          );

        } else {

          alert(
            serverMessage
          );

        }

        return;

      }


      // =========================================
      // NETWORK ERROR
      // =========================================

      alert(
        t("serverConnectionError")
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================
  // DOWNLOAD TICKET
  // =========================================

  const downloadTicket = async () => {

    const ticket =
      document.getElementById(
        "ticket"
      );


    if (!ticket) {

      alert(
        t("ticketNotFound")
      );

      return;

    }


    try {

      const canvas =
        await html2canvas(
          ticket,
          {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
          }
        );


      const imgData =
        canvas.toDataURL(
          "image/png"
        );


      const pdf =
        new jsPDF(
          "p",
          "mm",
          "a4"
        );


      const width = 190;


      const height =
        (
          canvas.height *
          width
        ) /
        canvas.width;


      pdf.addImage(
        imgData,
        "PNG",
        10,
        10,
        width,
        height
      );


      pdf.save(
        `BusGo-${ticketNumber}.pdf`
      );


    } catch (error) {

      console.error(
        "PDF download error:",
        error
      );

      alert(
        t("ticketDownloadError")
      );

    }

  };


  // =========================================
  // NO BOOKING
  // =========================================

  if (!booking) {

    return (

      <>

        <Navbar />

        <div className="empty-booking">

          <h2>
            {t("noBookingFound")}
          </h2>

          <p>
            {t("bookingNoLongerAvailable")}
          </p>

          <NavLink to="/booking">

            {t("makeBooking")}

          </NavLink>

        </div>

        <Footer />

      </>

    );

  }


  // =========================================
  // PAGE
  // =========================================

  return (

    <>

      <Navbar />


      <section className="ticket-page">


        {/* =====================================
            TICKET
        ===================================== */}

        <div
          className="ticket"
          id="ticket"
        >


          {/* HEADER */}

          <div className="ticket-header">

            <h1>
              BUSGO
            </h1>

            <p>
              {t("busTransportReservation")}
            </p>

          </div>


          {/* TICKET NUMBER */}

          <div className="ticket-number">

            {t("ticketNo")}:

            <strong>
              {ticketNumber}
            </strong>

          </div>


          {/* ROUTE */}

          <div className="route-box">

            <div>

              <small>
                {t("from").toUpperCase()}
              </small>

              <h2>
                {booking.from}
              </h2>

            </div>


            <span>
              →
            </span>


            <div>

              <small>
                {t("to").toUpperCase()}
              </small>

              <h2>
                {booking.to}
              </h2>

            </div>

          </div>


          {/* DETAILS */}

          <div className="details">


            {/* PASSENGER */}

            <p>

              <span>
                {t("passenger")}
              </span>

              {booking.name}

            </p>


            {/* PHONE */}

            <p>

              <span>
                {t("phone")}
              </span>

              {booking.phone}

            </p>


            {/* BUS */}

            <p>

              <span>
                {t("busType")}
              </span>

              {booking.busType}

            </p>


            {/* BUS ID */}

            {booking.busId && (

              <p>

                <span>
                  {t("busId")}
                </span>

                {booking.busId}

              </p>

            )}


            {/* SEATS */}

            <p>

              <span>
                {t("seats")}
              </span>

              {normalizedSeats.join(
                ", "
              ) || t("notSelected")}

            </p>


            {/* PASSENGERS */}

            <p>

              <span>
                {t("passengers")}
              </span>

              {booking.passengers ??
                normalizedSeats.length}

            </p>


            {/* DATE */}

            <p>

              <span>
                {t("travelDate")}
              </span>

              {booking.date}

            </p>


            {/* PAYMENT */}

            <p>

              <span>
                {t("payment")}
              </span>

              {booking.paymentMethod}

            </p>


            {/* OFFER */}

            {booking.offerTitle &&
              booking.offerTitle !==
                "No Offer" && (

              <p>

                <span>
                  {t("offer")}
                </span>

                <strong
                  className="offer-used"
                >

                  {booking.offerTitle}

                  {discountPercentage > 0 &&
                    ` (${discountPercentage}% ${t("off")})`}

                </strong>

              </p>

            )}


            {/* STATUS */}

            <p>

              <span>
                {t("status")}
              </span>

              <span className="paid">

                {confirmed
                  ? t("successful")
                  : t("readyForConfirmation")}

              </span>

            </p>


          </div>


          {/* PRICE BREAKDOWN */}

          <div className="ticket-price-breakdown">


            <div className="ticket-price-row">

              <span>
                {t("totalPrice")}
              </span>

              <strong>

                XAF{" "}

                {totalPrice.toLocaleString(
                  "en-GB"
                )}

              </strong>

            </div>


            <div
              className="
                ticket-price-row
                ticket-discount
              "
            >

              <span>

                {t("discount")}

                {discountPercentage > 0 &&
                  ` (${discountPercentage}%)`}

              </span>


              <strong>

                - XAF{" "}

                {discount.toLocaleString(
                  "en-GB"
                )}

              </strong>

            </div>


            <div
              className="
                ticket-price-divider
              "
            ></div>


            <div
              className="
                ticket-final-price
              "
            >

              <span>
                {t("totalPayment").toUpperCase()}
              </span>

              <h2>

                XAF{" "}

                {totalPayment.toLocaleString(
                  "en-GB"
                )}

              </h2>

            </div>


          </div>


          {/* QR CODE */}

          <div className="qr-box">

            <QRCodeCanvas

              value={qrData}

              size={120}

              bgColor="#ffffff"

              fgColor="#0b7d45"

            />

          </div>


          {/* THANK YOU */}

          <p className="thank">

            {t("thankYouBusGo")}

          </p>


        </div>


        {/* ACTION BUTTONS */}


        <button

          type="button"

          className="download-btn"

          onClick={
            downloadTicket
          }

        >

          {t("downloadTicketPdf")}

        </button>


        <button

          type="button"

          className="print-btn"

          onClick={() =>
            window.print()
          }

        >

          {t("printTicket")}

        </button>


        {!confirmed && (

          <>

            {paymentStageMessage && (

              <p
                className={
                  paymentStage === "failed"
                    ? "payment-stage-message payment-stage-error"
                    : "payment-stage-message"
                }
              >

                {paymentStageMessage}

              </p>

            )}

            <button

              type="button"

              className="confirm-btn"

              onClick={
                confirmBooking
              }

              disabled={saving}

            >

              {paymentStage === "waiting-approval"
                ? (t("waitingForApproval") || "Waiting for approval...")
                : paymentStage === "redirecting"
                ? (t("redirecting") || "Redirecting...")
                : saving
                ? t("savingBooking")
                : t("confirmBooking")}

            </button>

          </>

        )}


        {confirmed && (

          <button

            type="button"

            className="confirm-btn"

            onClick={() =>
              navigate(
                "/dashboard"
              )
            }

          >

            {t("goToDashboard")}

          </button>

        )}


      </section>


      <Footer />

    </>

  );

}


export default Confirmation;