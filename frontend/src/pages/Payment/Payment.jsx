import React, {
  useState
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import { useTranslation } from "../../useTranslation";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Payment.css";


function Payment() {

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const { t } =
    useTranslation();


  const booking =
    location.state;


  const [
    method,
    setMethod
  ] = useState("");


  // =========================================
  // NO BOOKING INFORMATION
  // =========================================

  if (!booking) {

    return (

      <>

        <Navbar />

        <section className="payment-page">

          <div className="payment-card">

            <h2>
              {t("noBookingInformation")}
            </h2>

            <button
              onClick={() =>
                navigate(
                  "/booking"
                )
              }
            >

              {t("returnToBooking")}

            </button>

          </div>

        </section>

        <Footer />

      </>

    );

  }


  // =========================================
  // PRICE VALUES
  // =========================================

  const totalPrice =
    Number(
      booking.totalPrice ??
      booking.total ??
      0
    );


  const discount =
    Number(
      booking.discount ??
      0
    );


  const discountPercentage =
    Number(
      booking.discountPercentage ??
      0
    );


  const totalPayment =
    Number(
      booking.totalPayment ??
      Math.max(
        0,
        totalPrice -
        discount
      )
    );


  // =========================================
  // PAYMENT
  // =========================================

  const handlePayment =
    () => {

      // =========================================
      // VALIDATE PAYMENT METHOD
      // =========================================

      if (!method) {

        alert(
          t("selectPaymentMethodError")
        );

        return;

      }


      // =========================================
      // VALIDATE BOOKING DATA
      // =========================================

      if (
        !booking.from ||
        !booking.to
      ) {

        alert(
          t("bookingRouteMissing")
        );

        return;

      }


      if (
        !booking.routeId
      ) {

        alert(
          t("bookingRouteIdMissing")
        );

        return;

      }


      if (
        !booking.busType
      ) {

        alert(
          t("busInformationMissing")
        );

        return;

      }


      if (
        !booking.busId
      ) {

        alert(
          t("bookingBusIdMissing")
        );

        return;

      }


      if (
        !Array.isArray(
          booking.seats
        ) ||
        booking.seats.length === 0
      ) {

        alert(
          t("noSeatsSelected")
        );

        return;

      }


      if (!booking.date) {

        alert(
          t("travelDateMissing")
        );

        return;

      }


      if (!booking.name) {

        alert(
          t("passengerNameMissing")
        );

        return;

      }


      if (!booking.phone) {

        alert(
          t("passengerPhoneMissing")
        );

        return;

      }


      if (!booking.userId) {

        alert(
          t("userInformationMissing")
        );

        return;

      }


      if (
        totalPayment <= 0
      ) {

        alert(
          t("invalidPaymentAmount")
        );

        return;

      }


      // =========================================
      // PAYMENT DATE
      // =========================================

      const paymentDate =
        new Date().toISOString();


      // =========================================
      // CREATE PAYMENT DATA
      // =========================================

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
          paymentDate

      };


      // =========================================
      // DEBUG
      // =========================================

      console.log(
        "========================================="
      );

      console.log(
        "BUSGO PAYMENT DATA"
      );

      console.log(
        "========================================="
      );

      console.log(
        paymentData
      );

      console.log(
        "========================================="
      );


      // =========================================
      // GO TO CONFIRMATION
      // =========================================

      navigate(
        "/confirmation",
        {
          state:
            paymentData
        }
      );

    };


  // =========================================
  // RETURN PAGE
  // =========================================

  return (

    <>

      <Navbar />


      <section className="payment-page">


        <div className="payment-card">


          {/* =====================================
              HEADER
          ===================================== */}

          <div className="payment-header">


            <div className="payment-icon">
              💳
            </div>


            <div>

              <h1>
                {t("completePayment")}
              </h1>


              <p>
                {t("reviewBookingBeforePayment")}
              </p>

            </div>


          </div>


          {/* =====================================
              BOOKING INFORMATION
          ===================================== */}

          <div className="payment-booking-info">


            {/* ROUTE */}

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


            {/* BUS */}

            <div>

              <span>
                {t("bus")}
              </span>


              <strong>
                {booking.busType}
              </strong>

            </div>


            {/* SEATS */}

            <div>

              <span>
                {t("seats")}
              </span>


              <strong>

                {booking.seats?.join(
                  ", "
                ) ||
                  t("notSelected")}

              </strong>

            </div>


            {/* PASSENGERS */}

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


            {/* TRAVEL DATE */}

            <div>

              <span>
                {t("travelDate")}
              </span>


              <strong>
                {booking.date}
              </strong>

            </div>


          </div>


          {/* =====================================
              OFFER
          ===================================== */}

          {booking.offerTitle &&
            booking.offerTitle !==
              "No Offer" && (

            <div className="payment-offer">


              <span>
                🎉
              </span>


              <div>

                <small>
                  {t("offerApplied")}
                </small>


                <strong>
                  {booking.offerTitle}
                </strong>


                <b>
                  {discountPercentage}% {t("off")}
                </b>

              </div>


            </div>

          )}


          {/* =====================================
              PAYMENT SUMMARY
          ===================================== */}

          <div className="payment-summary">


            <h3>
              {t("paymentSummary")}
            </h3>


            {/* ORIGINAL PRICE */}

            <div className="payment-row">

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


            {/* DISCOUNT */}

            <div className="payment-row discount-payment-row">


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


            <div className="payment-divider"></div>


            {/* FINAL PAYMENT */}

            <div className="payment-total">


              <span>
                {t("totalPayment")}
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
              PAYMENT METHOD
          ===================================== */}

          <div className="payment-method-section">


            <label>
              {t("selectPaymentMethod")}
            </label>


            <select

              value={method}

              onChange={
                (e) =>
                  setMethod(
                    e.target.value
                  )
              }

            >

              <option value="">
                {t("chooseMethod")}
              </option>


              <option value="MTN Mobile Money">
                {t("mtnMobileMoney")}
              </option>


              <option value="Orange Money">
                {t("orangeMoney")}
              </option>


              <option value="Bank Card">
                {t("bankCard")}
              </option>

            </select>


          </div>


          {/* =====================================
              PAY BUTTON
          ===================================== */}

          <button

            type="button"

            className="payment-btn"

            onClick={
              handlePayment
            }

          >

            {t("pay")} XAF{" "}

            {totalPayment.toLocaleString(
              "en-GB"
            )}

          </button>


          {/* =====================================
              SECURITY NOTE
          ===================================== */}

          <p className="payment-note">

            🔒 {t("secureBookingInformation")}

          </p>


        </div>


      </section>


      <Footer />

    </>

  );

}


export default Payment;
