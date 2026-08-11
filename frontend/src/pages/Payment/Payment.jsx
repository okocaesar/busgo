import React, {
  useState
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Payment.css";


function Payment() {

  const location =
    useLocation();

  const navigate =
    useNavigate();


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
              No booking information found
            </h2>

            <button
              onClick={() =>
                navigate(
                  "/booking"
                )
              }
            >

              Return to Booking

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
          "Please select a payment method."
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
          "Booking route information is missing."
        );

        return;

      }


      if (
        !booking.routeId
      ) {

        alert(
          "Booking route ID is missing."
        );

        return;

      }


      if (
        !booking.busType
      ) {

        alert(
          "Bus information is missing."
        );

        return;

      }


      if (
        !booking.busId
      ) {

        alert(
          "Booking bus ID is missing."
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
          "No seats have been selected."
        );

        return;

      }


      if (!booking.date) {

        alert(
          "Travel date is missing."
        );

        return;

      }


      if (!booking.name) {

        alert(
          "Passenger name is missing."
        );

        return;

      }


      if (!booking.phone) {

        alert(
          "Passenger phone number is missing."
        );

        return;

      }


      if (!booking.userId) {

        alert(
          "User information is missing. Please login again."
        );

        return;

      }


      if (
        totalPayment <= 0
      ) {

        alert(
          "Invalid payment amount."
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
      //
      // IMPORTANT:
      //
      // Preserve EVERYTHING coming from
      // Booking.jsx.
      //
      // This includes:
      //
      // userId
      // routeId
      // busId
      // seats
      // passengers
      // offerId
      // offerTitle
      // discount
      // totalPrice
      // totalPayment
      //
      // =========================================

      const paymentData = {

        ...booking,


        // =========================================
        // USER
        // =========================================

        userId:
          booking.userId,


        // =========================================
        // ROUTE
        // =========================================

        from:
          booking.from,

        to:
          booking.to,

        routeId:
          booking.routeId,


        // =========================================
        // BUS
        // =========================================

        busType:
          booking.busType,

        busId:
          booking.busId,


        // =========================================
        // SEATS
        // =========================================

        seats:
          booking.seats,


        // =========================================
        // PASSENGERS
        // =========================================

        passengers:
          Number(
            booking.passengers ??
            booking.seats.length
          ),


        // =========================================
        // PASSENGER INFORMATION
        // =========================================

        name:
          booking.name,

        phone:
          booking.phone,

        date:
          booking.date,


        // =========================================
        // PRICE
        // =========================================

        totalPrice:
          totalPrice,

        discount:
          discount,

        discountPercentage:
          discountPercentage,

        totalPayment:
          totalPayment,


        // =========================================
        // OFFER
        // =========================================

        offerId:
          booking.offerId ||
          null,

        offerTitle:
          booking.offerTitle ||
          "No Offer",


        // =========================================
        // COMPATIBILITY
        // =========================================

        total:
          totalPayment,


        // =========================================
        // PAYMENT
        // =========================================

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
      //
      // IMPORTANT:
      //
      // DO NOT POST THE BOOKING HERE.
      //
      // Confirmation.jsx will send the final
      // booking request to the backend.
      //
      // The backend then performs the FINAL
      // transaction seat check.
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
                Complete Payment
              </h1>


              <p>
                Review your booking
                before payment.
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
                Route
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
                Bus
              </span>


              <strong>
                {booking.busType}
              </strong>

            </div>


            {/* SEATS */}

            <div>

              <span>
                Seats
              </span>


              <strong>

                {booking.seats?.join(
                  ", "
                ) ||
                  "Not selected"}

              </strong>

            </div>


            {/* PASSENGERS */}

            <div>

              <span>
                Passengers
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
                Travel Date
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
                  OFFER APPLIED
                </small>


                <strong>
                  {booking.offerTitle}
                </strong>


                <b>
                  {discountPercentage}% OFF
                </b>

              </div>


            </div>

          )}


          {/* =====================================
              PAYMENT SUMMARY
          ===================================== */}

          <div className="payment-summary">


            <h3>
              Payment Summary
            </h3>


            {/* ORIGINAL PRICE */}

            <div className="payment-row">

              <span>
                Total Price
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

                Discount

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
                Total Payment
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
              Select Payment Method
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
                Choose method
              </option>


              <option value="MTN Mobile Money">
                MTN Mobile Money
              </option>


              <option value="Orange Money">
                Orange Money
              </option>


              <option value="Bank Card">
                Bank Card
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

            Pay XAF{" "}

            {totalPayment.toLocaleString(
              "en-GB"
            )}

          </button>


          {/* =====================================
              SECURITY NOTE
          ===================================== */}

          <p className="payment-note">

            🔒 Your booking information
            is securely processed.

          </p>


        </div>


      </section>


      <Footer />

    </>

  );

}


export default Payment;