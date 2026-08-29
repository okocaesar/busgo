import React, {
  useEffect,
  useState
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import axios from "axios";

import { useTranslation } from "../../useTranslation";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Payment.css";


// ============================================================
// API URL
// ============================================================

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";


// ============================================================
// FLUTTERWAVE CARD ENCRYPTION KEY
// ============================================================
//
// Put the Flutterwave encryption key in:
//
// frontend/.env
//
// REACT_APP_FLW_ENCRYPTION_KEY=YOUR_KEY
//
// NEVER put FLW_CLIENT_SECRET here.
// ============================================================

const FLW_ENCRYPTION_KEY =
  process.env.REACT_APP_FLW_ENCRYPTION_KEY ||
  "";


// ============================================================
// RANDOM NONCE
// ============================================================
//
// Flutterwave requires a 12-character nonce.
// ============================================================

function generateNonce() {

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const randomValues =
    new Uint32Array(12);

  window.crypto.getRandomValues(
    randomValues
  );

  let nonce = "";

  for (
    let i = 0;
    i < randomValues.length;
    i++
  ) {

    nonce +=
      characters[
        randomValues[i] %
        characters.length
      ];
  }

  return nonce;
}


// ============================================================
// BASE64 -> UINT8ARRAY
// ============================================================

function base64ToBytes(
  base64
) {

  const binary =
    window.atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}


// ============================================================
// ARRAYBUFFER -> BASE64
// ============================================================

function arrayBufferToBase64(
  buffer
) {

  const bytes =
    new Uint8Array(buffer);

  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {

    binary += String.fromCharCode(
      bytes[i]
    );
  }

  return window.btoa(
    binary
  );
}


// ============================================================
// FLUTTERWAVE AES-GCM ENCRYPTION
// ============================================================
//
// Flutterwave V4 uses AES-256-GCM.
//
// Each card field is encrypted using the SAME nonce.
// ============================================================

async function encryptCardValue(
  value,
  encryptionKey,
  nonce
) {

  if (!value) {
    throw new Error(
      "Card value is empty."
    );
  }

  if (!encryptionKey) {
    throw new Error(
      "Flutterwave card encryption key is not configured."
    );
  }

  if (!nonce || nonce.length !== 12) {
    throw new Error(
      "Flutterwave card encryption nonce must contain exactly 12 characters."
    );
  }


  if (
    !window.crypto ||
    !window.crypto.subtle
  ) {

    throw new Error(
      "Secure browser encryption is not available. Please use HTTPS or a modern browser."
    );
  }


  let keyBytes;

  try {

    keyBytes =
      base64ToBytes(
        encryptionKey
      );

  } catch (error) {

    throw new Error(
      "The Flutterwave encryption key is not valid Base64."
    );
  }


  if (
    keyBytes.length !== 32
  ) {

    throw new Error(
      "Flutterwave AES-256 encryption key must decode to 32 bytes."
    );
  }


  const cryptoKey =
    await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      {
        name: "AES-GCM"
      },
      false,
      [
        "encrypt"
      ]
    );


  const iv =
    new TextEncoder().encode(
      nonce
    );


  const plaintext =
    new TextEncoder().encode(
      String(value)
    );


  const encrypted =
    await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      cryptoKey,
      plaintext
    );


  return arrayBufferToBase64(
    encrypted
  );
}


// ============================================================
// LUHN CHECK
// ============================================================

function isValidCardNumber(
  cardNumber
) {

  const digits =
    String(cardNumber)
      .replace(/\D/g, "");

  if (
    digits.length < 13 ||
    digits.length > 19
  ) {
    return false;
  }


  let sum = 0;

  let shouldDouble =
    false;


  for (
    let i =
      digits.length - 1;
    i >= 0;
    i--
  ) {

    let digit =
      Number(
        digits[i]
      );


    if (shouldDouble) {

      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }


    sum += digit;

    shouldDouble =
      !shouldDouble;
  }


  return (
    sum % 10 === 0
  );
}


// ============================================================
// FORMAT CARD NUMBER
// ============================================================

function formatCardNumber(
  value
) {

  return String(value)
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(
      /(.{4})/g,
      "$1 "
    )
    .trim();
}


// ============================================================
// PAYMENT COMPONENT
// ============================================================

function Payment() {

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const { t } =
    useTranslation();


  // ==========================================================
  // BOOKING
  // ==========================================================

  const booking =
    location.state;


  // ==========================================================
  // PAYMENT METHOD
  // ==========================================================

  const [
    method,
    setMethod
  ] = useState("");


  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    loading,
    setLoading
  ] = useState(false);


  // ==========================================================
  // PAYMENT MESSAGE
  // ==========================================================

  const [
    paymentMessage,
    setPaymentMessage
  ] = useState("");


  // ==========================================================
  // PAYMENT ERROR
  // ==========================================================

  const [
    paymentError,
    setPaymentError
  ] = useState("");


  // ==========================================================
  // TRANSACTION
  // ==========================================================

  const [
    transactionId,
    setTransactionId
  ] = useState(null);


  // ==========================================================
  // NEXT ACTION
  // ==========================================================

  const [
    nextAction,
    setNextAction
  ] = useState(null);


  // ==========================================================
  // PAYMENT STATE
  // ==========================================================

  const [
    paymentPending,
    setPaymentPending
  ] = useState(false);


  // ==========================================================
  // CARD INPUTS
  //
  // RAW CARD INFORMATION EXISTS ONLY IN COMPONENT MEMORY.
  //
  // It is NEVER stored in localStorage or sent to the
  // backend as raw card information.
  // ==========================================================

  const [
    cardNumber,
    setCardNumber
  ] = useState("");

  const [
    expiryMonth,
    setExpiryMonth
  ] = useState("");

  const [
    expiryYear,
    setExpiryYear
  ] = useState("");

  const [
    cvv,
    setCvv
  ] = useState("");


  // ==========================================================
  // ENCRYPTED CARD DATA
  // ==========================================================

  const [
    cardDetails,
    setCardDetails
  ] = useState(null);


  // ==========================================================
  // MOBILE MONEY PHONE
  // ==========================================================

  const [
    mobilePhone,
    setMobilePhone
  ] = useState(
    booking?.phone || ""
  );


  // ==========================================================
  // PAYMENT COMPLETION
  // ==========================================================

  const [
    completed,
    setCompleted
  ] = useState(false);


  // ==========================================================
  // PRICE VALUES
  // ==========================================================

  const totalPrice =
    Number(
      booking?.totalPrice ??
      booking?.total ??
      0
    );


  const discount =
    Number(
      booking?.discount ??
      0
    );


  const discountPercentage =
    Number(
      booking?.discountPercentage ??
      0
    );


  const totalPayment =
    Number(
      booking?.totalPayment ??
      Math.max(
        0,
        totalPrice -
        discount
      )
    );


  // ==========================================================
  // AUTH TOKEN
  // ==========================================================

  const getAuthToken =
    () => {

      return (
        localStorage.getItem(
          "authToken"
        ) ||

        localStorage.getItem(
          "token"
        )
      );
    };


  // ==========================================================
  // AXIOS CONFIG
  // ==========================================================

  const getAxiosConfig =
    () => {

      const token =
        getAuthToken();


      return {

        headers: {

          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {})

        },

        timeout:
          30000

      };
    };


  // ==========================================================
  // FORMAT PHONE
  // ==========================================================

  const normalizePhone =
    (phone) => {

      if (!phone) {
        return "";
      }


      let value =
        String(phone)
          .trim()
          .replace(
            /\s+/g,
            ""
          )
          .replace(
            /-/g,
            ""
          )
          .replace(
            /\(/g,
            ""
          )
          .replace(
            /\)/g,
            ""
          );


      if (
        value.startsWith("+")
      ) {

        value =
          value.substring(1);
      }


      if (
        /^2376\d{8}$/.test(
          value
        )
      ) {

        return value;
      }


      if (
        /^6\d{8}$/.test(
          value
        )
      ) {

        return `237${value}`;
      }


      return value;
    };


  // ==========================================================
  // CHECK AUTHENTICATION
  // ==========================================================

  useEffect(
    () => {

      const loggedIn =
        localStorage.getItem(
          "loggedIn"
        ) === "true";


      if (!loggedIn) {

        navigate(
          "/login",
          {
            replace: true
          }
        );
      }

    },
    [navigate]
  );


  // ==========================================================
  // NO BOOKING
  // ==========================================================

  if (!booking) {

    return (
      <>
        <Navbar />

        <section
          className="payment-page"
        >

          <div
            className="payment-card"
          >

            <h2>
              {t(
                "noBookingInformation"
              )}
            </h2>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/booking"
                )
              }
            >
              {t(
                "returnToBooking"
              )}
            </button>

          </div>

        </section>

        <Footer />
      </>
    );
  }


  // ==========================================================
  // HANDLE METHOD CHANGE
  // ==========================================================

  const handleMethodChange =
    (event) => {

      const selectedMethod =
        event.target.value;


      setMethod(
        selectedMethod
      );

      setPaymentError("");

      setPaymentMessage("");

      setNextAction(null);

      setPaymentPending(false);


      // Clear encrypted card state
      // when changing methods.

      setCardDetails(null);


      if (
        selectedMethod ===
          "MTN Mobile Money" ||

        selectedMethod ===
          "Orange Money"
      ) {

        setMobilePhone(
          booking.phone ||
          ""
        );
      }
    };


  // ==========================================================
  // VALIDATE BOOKING
  // ==========================================================

  const validateBooking =
    () => {

      if (!booking.from) {

        return (
          t(
            "bookingRouteMissing"
          ) ||
          "Departure location is missing."
        );
      }


      if (!booking.to) {

        return (
          t(
            "bookingRouteMissing"
          ) ||
          "Destination is missing."
        );
      }


      if (!booking.routeId) {

        return (
          t(
            "bookingRouteIdMissing"
          ) ||
          "Booking route information is missing."
        );
      }


      if (!booking.busType) {

        return (
          t(
            "busInformationMissing"
          ) ||
          "Bus information is missing."
        );
      }


      if (!booking.busId) {

        return (
          t(
            "bookingBusIdMissing"
          ) ||
          "Bus information is missing."
        );
      }


      if (
        !Array.isArray(
          booking.seats
        ) ||

        booking.seats.length === 0
      ) {

        return (
          t(
            "noSeatsSelected"
          ) ||
          "No seats have been selected."
        );
      }


      if (!booking.date) {

        return (
          t(
            "travelDateMissing"
          ) ||
          "Travel date is missing."
        );
      }


      if (!booking.name) {

        return (
          t(
            "passengerNameMissing"
          ) ||
          "Passenger name is missing."
        );
      }


      if (!booking.phone) {

        return (
          t(
            "passengerPhoneMissing"
          ) ||
          "Passenger phone number is missing."
        );
      }


      if (!booking.userId) {

        return (
          t(
            "userInformationMissing"
          ) ||
          "User information is missing."
        );
      }


      if (
        totalPayment <= 0
      ) {

        return (
          t(
            "invalidPaymentAmount"
          ) ||
          "Invalid payment amount."
        );
      }


      return null;
    };


  // ==========================================================
  // VALIDATE MOBILE MONEY
  // ==========================================================

  const validateMobileMoney =
    () => {

      const normalizedPhone =
        normalizePhone(
          mobilePhone ||
          booking.phone
        );


      if (
        !/^2376\d{8}$/.test(
          normalizedPhone
        )
      ) {

        return (
          "Please enter a valid Cameroon mobile money number."
        );
      }


      return null;
    };


  // ==========================================================
  // VALIDATE CARD
  // ==========================================================

  const validateCard =
    () => {

      const cleanNumber =
        cardNumber.replace(
          /\D/g,
          ""
        );


      if (
        !isValidCardNumber(
          cleanNumber
        )
      ) {

        return (
          "Please enter a valid card number."
        );
      }


      if (
        !/^\d{2}$/.test(
          expiryMonth
        )
      ) {

        return (
          "Please enter the card expiry month as MM."
        );
      }


      const month =
        Number(
          expiryMonth
        );


      if (
        month < 1 ||
        month > 12
      ) {

        return (
          "Card expiry month must be between 01 and 12."
        );
      }


      if (
        !/^\d{2,4}$/.test(
          expiryYear
        )
      ) {

        return (
          "Please enter the card expiry year."
        );
      }


      if (
        !/^\d{3,4}$/.test(
          cvv
        )
      ) {

        return (
          "Please enter a valid CVV."
        );
      }


      if (
        !FLW_ENCRYPTION_KEY
      ) {

        return (
          "Flutterwave card encryption is not configured. Add REACT_APP_FLW_ENCRYPTION_KEY to the frontend .env file and restart the frontend."
        );
      }


      return null;
    };


  // ==========================================================
  // ENCRYPT CARD
  // ==========================================================

  const encryptCard =
    async () => {

      const validationError =
        validateCard();


      if (validationError) {

        throw new Error(
          validationError
        );
      }


      const cleanNumber =
        cardNumber.replace(
          /\D/g,
          ""
        );


      const normalizedMonth =
        expiryMonth.padStart(
          2,
          "0"
        );


      let normalizedYear =
        String(
          expiryYear
        ).trim();


      if (
        normalizedYear.length === 4
      ) {

        normalizedYear =
          normalizedYear.slice(
            -2
          );
      }


      const nonce =
        generateNonce();


      const encryptedCardNumber =
        await encryptCardValue(
          cleanNumber,
          FLW_ENCRYPTION_KEY,
          nonce
        );


      const encryptedExpiryMonth =
        await encryptCardValue(
          normalizedMonth,
          FLW_ENCRYPTION_KEY,
          nonce
        );


      const encryptedExpiryYear =
        await encryptCardValue(
          normalizedYear,
          FLW_ENCRYPTION_KEY,
          nonce
        );


      const encryptedCvv =
        await encryptCardValue(
          cvv,
          FLW_ENCRYPTION_KEY,
          nonce
        );


      const encrypted = {

        encrypted_card_number:
          encryptedCardNumber,

        encrypted_expiry_month:
          encryptedExpiryMonth,

        encrypted_expiry_year:
          encryptedExpiryYear,

        encrypted_cvv:
          encryptedCvv,

        nonce

      };


      // Keep only encrypted information.

      setCardDetails(
        encrypted
      );


      // Immediately clear raw card fields
      // after encryption.

      setCardNumber("");

      setExpiryMonth("");

      setExpiryYear("");

      setCvv("");


      return encrypted;
    };


  // ==========================================================
  // HANDLE PAYMENT
  // ==========================================================

  const handlePayment =
    async () => {

      setPaymentError("");

      setPaymentMessage("");

      setNextAction(null);

      setPaymentPending(false);


      // ========================================================
      // METHOD
      // ========================================================

      if (!method) {

        setPaymentError(
          t(
            "selectPaymentMethodError"
          ) ||
          "Please select a payment method."
        );

        return;
      }


      // ========================================================
      // BOOKING
      // ========================================================

      const bookingError =
        validateBooking();


      if (bookingError) {

        setPaymentError(
          bookingError
        );

        return;
      }


      // ========================================================
      // MOBILE MONEY
      // ========================================================

      if (
        method ===
          "MTN Mobile Money" ||

        method ===
          "Orange Money"
      ) {

        const mobileError =
          validateMobileMoney();


        if (mobileError) {

          setPaymentError(
            mobileError
          );

          return;
        }
      }


      // ========================================================
      // AUTH TOKEN
      // ========================================================

      const token =
        getAuthToken();


      if (!token) {

        setPaymentError(
          "Your login session has expired. Please login again."
        );


        navigate(
          "/login",
          {
            state: {
              from:
                "/payment"
            }
          }
        );

        return;
      }


      // ========================================================
      // ENCRYPT CARD
      // ========================================================

      let encryptedCard =
        cardDetails;


      try {

        if (
          method ===
          "Bank Card"
        ) {

          encryptedCard =
            await encryptCard();
        }

      } catch (error) {

        console.error(
          "CARD ENCRYPTION ERROR:",
          error
        );


        setPaymentError(
          error.message ||
          "Unable to securely encrypt your card information."
        );

        return;
      }


      // ========================================================
      // LOADING
      // ========================================================

      setLoading(true);


      try {

        // ======================================================
        // PAYMENT PAYLOAD
        // ======================================================

        const paymentPayload = {

          userId:
            booking.userId,

          bookingId:
            booking.id ||
            booking.bookingId,

          amount:
            totalPayment,

          currency:
            "XAF",

          paymentMethod:
            method,

          phoneNumber:
            normalizePhone(
              mobilePhone ||
              booking.phone
            )

        };


        // ======================================================
        // CARD
        // ======================================================

        if (
          method ===
          "Bank Card"
        ) {

          if (
            !encryptedCard
          ) {

            throw new Error(
              "Secure card information could not be created."
            );
          }


          paymentPayload.card =
            encryptedCard;
        }


        // ======================================================
        // DEBUG
        //
        // NEVER PRINT CARD DETAILS.
        // ======================================================

        console.log(
          "========================================="
        );

        console.log(
          "BUSGO FLUTTERWAVE PAYMENT"
        );

        console.log(
          "========================================="
        );


        console.log({

          ...paymentPayload,

          card:
            method ===
            "Bank Card"

              ? "[SECURE ENCRYPTED CARD DATA]"

              : undefined

        });


        console.log(
          "========================================="
        );


        // ======================================================
        // INITIALIZE PAYMENT
        // ======================================================

        const response =
          await axios.post(
            `${API_URL}/api/payments`,
            paymentPayload,
            getAxiosConfig()
          );


        console.log(
          "FLUTTERWAVE INITIALIZATION RESPONSE:",
          response.data
        );


        const data =
          response.data ||
          {};


        if (
          !data.success
        ) {

          throw new Error(
            data.message ||
            "Unable to initialize payment."
          );
        }


        // ======================================================
        // TRANSACTION
        // ======================================================

        const newTransactionId =
          data.transactionId;


        if (
          !newTransactionId
        ) {

          throw new Error(
            "Flutterwave did not return a transaction reference."
          );
        }


        setTransactionId(
          newTransactionId
        );


        // ======================================================
        // NEXT ACTION
        // ======================================================

        const action =
          data.flutterwave
            ?.nextAction ||

          data.nextAction ||

          null;


        setNextAction(
          action
        );


        // ======================================================
        // PAYMENT PENDING
        // ======================================================

        setPaymentPending(
          true
        );


        // ======================================================
        // MESSAGE
        // ======================================================

        if (
          method ===
          "MTN Mobile Money"
        ) {

          setPaymentMessage(
            "Payment request sent. Please check your MTN phone and approve the payment."
          );

        }

        else if (
          method ===
          "Orange Money"
        ) {

          setPaymentMessage(
            "Payment request sent. Please check your Orange Money phone and approve the payment."
          );

        }

        else {

          setPaymentMessage(
            "Card payment initialized. Please complete the secure authentication if your bank requests it."
          );
        }


        // ======================================================
        // NEXT ACTION
        // ======================================================

        handleNextAction(
          action
        );


        // ======================================================
        // VERIFICATION
        // ======================================================

        startVerificationPolling(
          newTransactionId
        );


      } catch (
        error
      ) {

        console.error(
          "BUSGO PAYMENT ERROR:",
          error
        );


        const serverMessage =
          error
            ?.response
            ?.data
            ?.message;


        const serverError =
          error
            ?.response
            ?.data
            ?.error;


        let message =
          serverMessage ||
          serverError ||
          error.message ||
          "Unable to initialize Flutterwave payment.";


        if (
          String(message)
            .includes(
              "FLW_CLIENT_ID"
            )
        ) {

          message =
            "Flutterwave Client ID is missing on the BusGo backend. Add FLW_CLIENT_ID and FLW_CLIENT_SECRET to the backend .env file and restart the server.";
        }


        if (
          String(message)
            .includes(
              "FLW_CLIENT_SECRET"
            )
        ) {

          message =
            "Flutterwave Client Secret is missing on the BusGo backend. Add FLW_CLIENT_SECRET to the backend .env file and restart the server.";
        }


        setPaymentError(
          message
        );


      } finally {

        setLoading(
          false
        );
      }
    };


  // ==========================================================
  // HANDLE NEXT ACTION
  // ==========================================================

  const handleNextAction =
    (action) => {

      if (!action) {

        console.log(
          "No Flutterwave next_action returned."
        );

        return;
      }


      console.log(
        "FLUTTERWAVE NEXT ACTION:",
        action
      );


      // ========================================================
      // REDIRECT
      // ========================================================

      const redirectUrl =
        action?.redirect_url ||
        action?.redirectUrl ||
        action?.url;


      if (redirectUrl) {

        setPaymentMessage(
          "Redirecting you to complete the secure payment..."
        );


        window.location.href =
          redirectUrl;

        return;
      }


      // ========================================================
      // AUTH URL
      // ========================================================

      const authUrl =
        action?.authorization_url ||
        action?.authorizationUrl;


      if (authUrl) {

        setPaymentMessage(
          "Please complete the payment authorization..."
        );


        window.location.href =
          authUrl;

        return;
      }


      // ========================================================
      // OTHER ACTION
      // ========================================================

      if (
        action?.type ||
        action?.action ||
        action?.status
      ) {

        setPaymentMessage(
          getNextActionMessage(
            action
          )
        );
      }
    };


  // ==========================================================
  // NEXT ACTION MESSAGE
  // ==========================================================

  const getNextActionMessage =
    (action) => {

      if (!action) {

        return (
          "Please complete the payment."
        );
      }


      const type =
        String(
          action.type ||
          action.action ||
          ""
        ).toLowerCase();


      if (
        type.includes(
          "mobile"
        )
      ) {

        if (
          method ===
          "MTN Mobile Money"
        ) {

          return (
            "Approve the payment request on your MTN mobile phone."
          );
        }


        if (
          method ===
          "Orange Money"
        ) {

          return (
            "Approve the payment request on your Orange Money phone."
          );
        }
      }


      if (
        type.includes(
          "otp"
        )
      ) {

        return (
          "Please complete the OTP verification."
        );
      }


      if (
        type.includes(
          "redirect"
        ) ||

        type.includes(
          "authentication"
        ) ||

        type.includes(
          "3ds"
        )
      ) {

        return (
          "Please complete the secure payment authentication."
        );
      }


      return (
        "Please complete the payment using the instructions provided."
      );
    };


  // ==========================================================
  // VERIFY PAYMENT
  // ==========================================================

  const verifyPayment =
    async (
      reference
    ) => {

      if (!reference) {
        return null;
      }


      try {

        const response =
          await axios.post(
            `${API_URL}/api/payments/verify`,
            {
              transactionId:
                reference
            },
            getAxiosConfig()
          );


        console.log(
          "BUSGO PAYMENT VERIFICATION:",
          response.data
        );


        return (
          response.data ||
          null
        );


      } catch (
        error
      ) {

        console.error(
          "BUSGO PAYMENT VERIFICATION ERROR:",
          error
            ?.response
            ?.data ||
          error.message
        );


        return null;
      }
    };


  // ==========================================================
  // PAYMENT POLLING
  // ==========================================================

  const startVerificationPolling =
    async (
      reference
    ) => {

      const maxAttempts =
        40;

      let attempt =
        0;


      const poll =
        async () => {

          attempt++;


          const result =
            await verifyPayment(
              reference
            );


          if (!result) {

            if (
              attempt <
              maxAttempts
            ) {

              setTimeout(
                poll,
                5000
              );
            }

            return;
          }


          const status =
            String(
              result.status ||
              ""
            ).toLowerCase();


          // ==================================================
          // SUCCESS
          // ==================================================

          if (
            result.success ===
              true ||

            status ===
              "successful" ||

            status ===
              "succeeded" ||

            status ===
              "completed"
          ) {

            handlePaymentSuccess(
              result
            );

            return;
          }


          // ==================================================
          // FAILED
          // ==================================================

          if (
            status ===
              "failed" ||

            status ===
              "cancelled" ||

            status ===
              "voided"
          ) {

            setPaymentPending(
              false
            );


            setPaymentError(
              "The payment was not completed. Please try again."
            );

            return;
          }


          // ==================================================
          // STILL PENDING
          // ==================================================

          if (
            attempt <
            maxAttempts
          ) {

            setPaymentMessage(
              getPendingMessage()
            );


            setTimeout(
              poll,
              5000
            );

          } else {

            setPaymentPending(
              true
            );


            setPaymentMessage(
              "Your payment is still being processed. You can verify again."
            );
          }
        };


      poll();
    };


  // ==========================================================
  // PENDING MESSAGE
  // ==========================================================

  const getPendingMessage =
    () => {

      if (
        method ===
        "MTN Mobile Money"
      ) {

        return (
          "Waiting for your MTN payment approval..."
        );
      }


      if (
        method ===
        "Orange Money"
      ) {

        return (
          "Waiting for your Orange Money payment approval..."
        );
      }


      return (
        "Waiting for Flutterwave to confirm your card payment..."
      );
    };


  // ==========================================================
  // PAYMENT SUCCESS
  // ==========================================================

  const handlePaymentSuccess =
    (verification) => {

      if (completed) {
        return;
      }


      setCompleted(
        true
      );


      setPaymentPending(
        false
      );


      setPaymentMessage(
        "Payment successful. Your booking has been confirmed."
      );


      const paymentData = {

        ...booking,

        userId:
          booking.userId,

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
          booking.seats,

        passengers:
          Number(
            booking.passengers ??
            booking.seats.length
          ),

        name:
          booking.name,

        phone:
          booking.phone,

        date:
          booking.date,

        totalPrice:
          totalPrice,

        discount:
          discount,

        discountPercentage:
          discountPercentage,

        totalPayment:
          totalPayment,

        offerId:
          booking.offerId ||
          null,

        offerTitle:
          booking.offerTitle ||
          "No Offer",

        total:
          totalPayment,

        paymentStatus:
          "Successful",

        paymentMethod:
          method,

        paymentDate:
          new Date().toISOString(),

        transactionId:
          verification?.transactionId ||
          transactionId,

        paymentId:
          verification?.paymentId ||
          null

      };


      setTimeout(
        () => {

          navigate(
            "/confirmation",
            {
              state:
                paymentData
            }
          );

        },
        1200
      );
    };


  // ==========================================================
  // MANUAL VERIFY
  // ==========================================================

  const handleManualVerification =
    async () => {

      if (!transactionId) {

        setPaymentError(
          "No payment transaction is available to verify."
        );

        return;
      }


      setLoading(
        true
      );


      try {

        const result =
          await verifyPayment(
            transactionId
          );


        if (!result) {

          setPaymentError(
            "Unable to verify the payment right now. Please try again."
          );

          return;
        }


        const status =
          String(
            result.status ||
            ""
          ).toLowerCase();


        if (
          result.success ===
            true ||

          status ===
            "successful" ||

          status ===
            "succeeded" ||

          status ===
            "completed"
        ) {

          handlePaymentSuccess(
            result
          );

          return;
        }


        if (
          status ===
            "failed" ||

          status ===
            "cancelled" ||

          status ===
            "voided"
        ) {

          setPaymentPending(
            false
          );


          setPaymentError(
            "The payment failed or was cancelled."
          );

          return;
        }


        setPaymentMessage(
          getPendingMessage()
        );


      } finally {

        setLoading(
          false
        );
      }
    };


  // ==========================================================
  // PAYMENT PAGE
  // ==========================================================

  return (
    <>
      <Navbar />


      <section
        className="payment-page"
      >

        <div
          className="payment-card"
        >


          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="payment-header"
          >

            <div
              className="payment-icon"
            >
              💳
            </div>

            <div>

              <h1>
                {t(
                  "completePayment"
                )}
              </h1>

              <p>
                {t(
                  "reviewBookingBeforePayment"
                )}
              </p>

            </div>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {paymentError && (

            <div
              className="payment-error"
              role="alert"
            >

              ⚠️{" "}
              {paymentError}

            </div>
          )}


          {/* ==================================================
              SUCCESS / PENDING
          ================================================== */}

          {paymentMessage && (

            <div
              className={
                completed
                  ? "payment-success"
                  : "payment-pending"
              }
              role="status"
            >

              {completed
                ? "✅"
                : "⏳"}{" "}

              {paymentMessage}

            </div>
          )}


          {/* ==================================================
              BOOKING INFORMATION
          ================================================== */}

          <div
            className="payment-booking-info"
          >

            <div>

              <span>
                {t("route")}
              </span>

              <strong>
                {booking.from}
                {" → "}
                {booking.to}
              </strong>

            </div>


            <div>

              <span>
                {t("bus")}
              </span>

              <strong>
                {booking.busType}
              </strong>

            </div>


            <div>

              <span>
                {t("seats")}
              </span>

              <strong>
                {booking.seats?.join(
                  ", "
                ) ||
                  t(
                    "notSelected"
                  )}
              </strong>

            </div>


            <div>

              <span>
                {t("passengers")}
              </span>

              <strong>
                {booking.passengers ??
                  booking.seats?.length ??
                  0}
              </strong>

            </div>


            <div>

              <span>
                {t("travelDate")}
              </span>

              <strong>
                {booking.date}
              </strong>

            </div>

          </div>


          {/* ==================================================
              OFFER
          ================================================== */}

          {booking.offerTitle &&
            booking.offerTitle !==
              "No Offer" && (

            <div
              className="payment-offer"
            >

              <span>
                🎉
              </span>

              <div>

                <small>
                  {t(
                    "offerApplied"
                  )}
                </small>

                <strong>
                  {booking.offerTitle}
                </strong>

                <b>
                  {discountPercentage}%{" "}
                  {t("off")}
                </b>

              </div>

            </div>
          )}


          {/* ==================================================
              PAYMENT SUMMARY
          ================================================== */}

          <div
            className="payment-summary"
          >

            <h3>
              {t(
                "paymentSummary"
              )}
            </h3>


            <div
              className="payment-row"
            >

              <span>
                {t(
                  "totalPrice"
                )}
              </span>

              <strong>
                XAF{" "}
                {totalPrice.toLocaleString(
                  "en-GB"
                )}
              </strong>

            </div>


            <div
              className="payment-row discount-payment-row"
            >

              <span>

                {t(
                  "discount"
                )}

                {discountPercentage >
                  0 &&
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
              className="payment-divider"
            />


            <div
              className="payment-total"
            >

              <span>
                {t(
                  "totalPayment"
                )}
              </span>

              <strong>
                XAF{" "}
                {totalPayment.toLocaleString(
                  "en-GB"
                )}
              </strong>

            </div>

          </div>


          {/* ==================================================
              PAYMENT METHOD
          ================================================== */}

          <div
            className="payment-method-section"
          >

            <label
              htmlFor="payment-method"
            >
              {t(
                "selectPaymentMethod"
              )}
            </label>


            <select
              id="payment-method"
              value={method}
              onChange={
                handleMethodChange
              }
              disabled={
                loading ||
                paymentPending ||
                completed
              }
            >

              <option value="">
                {t(
                  "chooseMethod"
                )}
              </option>


              <option value="MTN Mobile Money">
                {t(
                  "mtnMobileMoney"
                )}
              </option>


              <option value="Orange Money">
                {t(
                  "orangeMoney"
                )}
              </option>


              <option value="Bank Card">
                {t(
                  "bankCard"
                )}
              </option>

            </select>

          </div>


          {/* ==================================================
              MOBILE MONEY
          ================================================== */}

          {(
            method ===
              "MTN Mobile Money" ||

            method ===
              "Orange Money"
          ) && (

            <div
              className="mobile-money-payment-section"
            >

              <label
                htmlFor="mobile-money-phone"
              >
                Mobile Money Phone Number
              </label>


              <input
                id="mobile-money-phone"
                type="tel"
                value={mobilePhone}
                onChange={(event) =>
                  setMobilePhone(
                    event.target.value
                  )
                }
                placeholder="6XXXXXXXX"
                disabled={
                  loading ||
                  paymentPending ||
                  completed
                }
                autoComplete="tel"
              />


              <small>

                {method ===
                "MTN Mobile Money"

                  ? "Enter the MTN number that should receive the payment approval request."

                  : "Enter the Orange Money number that should receive the payment approval request."}

              </small>

            </div>
          )}


          {/* ==================================================
              BANK CARD
          ================================================== */}

          {method ===
            "Bank Card" && (

            <div
              className="card-payment-section"
            >

              <div
                className="payment-card-notice"
              >

                🔒 Secure card payment

                <p>
                  Your card details are encrypted
                  with Flutterwave AES-256 encryption
                  before they are sent to BusGo.
                  BusGo does not store your raw card
                  number or CVV.
                </p>

              </div>


              {/* CARD NUMBER */}

              <div
                className="form-group"
              >

                <label
                  htmlFor="busgo-card-number"
                >
                  Card Number
                </label>


                <input
                  id="busgo-card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={
                    formatCardNumber(
                      cardNumber
                    )
                  }
                  onChange={(event) => {

                    const value =
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          19
                        );

                    setCardNumber(
                      value
                    );

                    setCardDetails(
                      null
                    );

                    setPaymentError(
                      ""
                    );
                  }}
                  disabled={
                    loading ||
                    paymentPending ||
                    completed
                  }
                />

              </div>


              {/* EXPIRY + CVV */}

              <div
                className="card-fields-row"
              >

                <div
                  className="form-group"
                >

                  <label
                    htmlFor="busgo-card-expiry-month"
                  >
                    Expiry Month
                  </label>


                  <input
                    id="busgo-card-expiry-month"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    placeholder="MM"
                    maxLength={2}
                    value={
                      expiryMonth
                    }
                    onChange={(event) => {

                      const value =
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            2
                          );

                      setExpiryMonth(
                        value
                      );

                      setCardDetails(
                        null
                      );

                    }}
                    disabled={
                      loading ||
                      paymentPending ||
                      completed
                    }
                  />

                </div>


                <div
                  className="form-group"
                >

                  <label
                    htmlFor="busgo-card-expiry-year"
                  >
                    Expiry Year
                  </label>


                  <input
                    id="busgo-card-expiry-year"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    placeholder="YY"
                    maxLength={4}
                    value={
                      expiryYear
                    }
                    onChange={(event) => {

                      const value =
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            4
                          );

                      setExpiryYear(
                        value
                      );

                      setCardDetails(
                        null
                      );

                    }}
                    disabled={
                      loading ||
                      paymentPending ||
                      completed
                    }
                  />

                </div>


                <div
                  className="form-group"
                >

                  <label
                    htmlFor="busgo-card-cvv"
                  >
                    CVV
                  </label>


                  <input
                    id="busgo-card-cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="CVV"
                    maxLength={4}
                    value={
                      cvv
                    }
                    onChange={(event) => {

                      const value =
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            4
                          );

                      setCvv(
                        value
                      );

                      setCardDetails(
                        null
                      );

                    }}
                    disabled={
                      loading ||
                      paymentPending ||
                      completed
                    }
                  />

                </div>

              </div>


              <small
                className="card-security-help"
              >
                🔐 Card details are encrypted
                before being sent for payment.
                They are not stored by BusGo.
              </small>

            </div>
          )}


          {/* ==================================================
              NEXT ACTION
          ================================================== */}

          {nextAction && (

            <div
              className="flutterwave-next-action"
            >

              <h3>
                Payment Action Required
              </h3>

              <p>
                {getNextActionMessage(
                  nextAction
                )}
              </p>

            </div>
          )}


          {/* ==================================================
              TRANSACTION
          ================================================== */}

          {transactionId && (

            <div
              className="payment-transaction"
            >

              <small>
                Transaction Reference
              </small>

              <strong>
                {transactionId}
              </strong>

            </div>
          )}


          {/* ==================================================
              PAY BUTTON
          ================================================== */}

          {!completed &&
            !paymentPending && (

            <button
              type="button"
              className="payment-btn"
              onClick={
                handlePayment
              }
              disabled={
                loading
              }
            >

              {loading

                ? "Securing Payment..."

                : `${t("pay")} XAF ${totalPayment.toLocaleString(
                    "en-GB"
                  )}`}

            </button>
          )}


          {/* ==================================================
              VERIFY BUTTON
          ================================================== */}

          {paymentPending &&
            !completed && (

            <button
              type="button"
              className="payment-btn"
              onClick={
                handleManualVerification
              }
              disabled={
                loading
              }
            >

              {loading

                ? "Checking Payment..."

                : "I've Completed the Payment — Verify"}

            </button>
          )}


          {/* ==================================================
              SECURITY NOTE
          ================================================== */}

          <p
            className="payment-note"
          >

            🔒{" "}

            {t(
              "secureBookingInformation"
            )}

          </p>

        </div>

      </section>


      <Footer />

    </>
  );
}


export default Payment;