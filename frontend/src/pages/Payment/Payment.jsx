import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Payment.css";


function Payment() {

  const location = useLocation();

  const navigate = useNavigate();


  const booking = location.state;


  const [method, setMethod] = useState("");



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
                navigate("/booking")
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
      booking.discount ?? 0
    );


  const discountPercentage =

    Number(
      booking.discountPercentage ?? 0
    );


  const totalPayment =

    Number(
      booking.totalPayment ??
      Math.max(
        0,
        totalPrice - discount
      )
    );



  // =========================================
  // PAYMENT
  // =========================================

  const handlePayment = () => {


    if (!method) {

      alert(
        "Please select a payment method"
      );

      return;

    }



    /*
      Payment information is added
      to the booking object.

      We will save this information
      into MySQL from Confirmation.jsx.
    */

    const paymentData = {

      ...booking,


      // Original price

      totalPrice:
        totalPrice,


      // Discount

      discount:
        discount,


      discountPercentage:
        discountPercentage,


      offerTitle:
        booking.offerTitle ||
        "No Offer",


      // Final amount paid

      totalPayment:
        totalPayment,


      /*
        Keep total for compatibility
        with older components.
      */

      total:
        totalPayment,


      // Payment information

      paymentStatus:
        "Paid",


      paymentMethod:
        method,


      paymentDate:
        new Date()
          .toLocaleDateString("en-GB"),

    };



    navigate(

      "/confirmation",

      {

        state:
          paymentData

      }

    );

  };



  return (

    <>

      <Navbar />



      <section className="payment-page">


        <div className="payment-card">



          {/* =========================================
              HEADER
          ========================================= */}

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



          {/* =========================================
              BOOKING INFORMATION
          ========================================= */}

          <div className="payment-booking-info">


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



            <div>

              <span>
                Bus
              </span>


              <strong>
                {booking.busType}
              </strong>

            </div>



            <div>

              <span>
                Seats
              </span>


              <strong>

                {booking.seats?.join(", ") ||
                  "Not selected"}

              </strong>

            </div>



            <div>

              <span>
                Travel Date
              </span>


              <strong>
                {booking.date}
              </strong>

            </div>


          </div>



          {/* =========================================
              OFFER
          ========================================= */}

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



          {/* =========================================
              PAYMENT SUMMARY
          ========================================= */}

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

                  ` (${discountPercentage}%)`

                }

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



          {/* =========================================
              PAYMENT METHOD
          ========================================= */}

          <div className="payment-method-section">


            <label>
              Select Payment Method
            </label>


            <select

              value={method}

              onChange={(e) =>
                setMethod(e.target.value)
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



          {/* =========================================
              PAY BUTTON
          ========================================= */}

          <button

            className="payment-btn"

            onClick={handlePayment}

          >

            Pay XAF{" "}

            {totalPayment.toLocaleString(
              "en-GB"
            )}

          </button>



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
