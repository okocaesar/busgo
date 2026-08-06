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
  // PAYMENT
  // =========================================

  const handlePayment = () => {

    if (!method) {
      alert("Please select a payment method");
      return;
    }


    const paymentData = {

      ...booking,

      // Keep the original price
      totalPrice: booking.total,

      // Keep discount
      discount: booking.discount || 0,

      discountPercentage:
        booking.discountPercentage || 0,

      offerTitle:
        booking.offerTitle || "No Offer",

      // Final amount customer actually pays
      totalPayment:
        booking.totalPayment ?? booking.total,

      paymentStatus: "Paid",

      paymentMethod: method,

      paymentDate:
        new Date().toLocaleDateString("en-GB"),
    };


    navigate("/confirmation", {
      state: paymentData,
    });

  };


  // =========================================
  // NO BOOKING
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
              onClick={() => navigate("/booking")}
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
    booking.total ?? 0;

  const discount =
    booking.discount ?? 0;

  const discountPercentage =
    booking.discountPercentage ?? 0;

  const totalPayment =
    booking.totalPayment ?? totalPrice;


  return (
    <>

      <Navbar />


      <section className="payment-page">

        <div className="payment-card">


          {/* HEADER */}

          <div className="payment-header">

            <div className="payment-icon">
              💳
            </div>

            <div>

              <h1>
                Complete Payment
              </h1>

              <p>
                Review your booking before payment.
              </p>

            </div>

          </div>


          {/* OFFER */}

          {booking.offerTitle &&
            booking.offerTitle !== "No Offer" && (

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


          {/* PRICE BREAKDOWN */}

          <div className="payment-summary">

            <h3>
              Payment Summary
            </h3>


            <div className="payment-row">

              <span>
                Total Price
              </span>

              <strong>
                XAF {totalPrice.toLocaleString("en-GB")}
              </strong>

            </div>


            <div className="payment-row discount-payment-row">

              <span>
                Discount
                {discountPercentage > 0 &&
                  ` (${discountPercentage}%)`}
              </span>

              <strong>
                - XAF {discount.toLocaleString("en-GB")}
              </strong>

            </div>


            <div className="payment-divider"></div>


            <div className="payment-total">

              <span>
                Total Payment
              </span>

              <strong>
                XAF {totalPayment.toLocaleString("en-GB")}
              </strong>

            </div>

          </div>


          {/* PAYMENT METHOD */}

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


          {/* PAY BUTTON */}

          <button
            className="payment-btn"
            onClick={handlePayment}
          >
            Pay XAF {totalPayment.toLocaleString("en-GB")}
          </button>


          <p className="payment-note">
            🔒 Your booking information is securely processed.
          </p>


        </div>

      </section>


      <Footer />

    </>
  );
}

export default Payment;