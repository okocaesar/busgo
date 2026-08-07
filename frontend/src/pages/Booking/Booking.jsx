import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import cities from "../../data/cities";
import routes from "../../data/routes";
import buses from "../../data/buses";
import SeatSelection from "../../components/SeatSelection/SeatSelection";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Booking.css";


function Booking() {

  const navigate = useNavigate();

  const location = useLocation();


  // Logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );


  // Selected seats
  const [selectedSeats, setSelectedSeats] = useState([]);


  // Offer coming from Offers page
  const selectedOffer =
    location.state?.offer || null;


  // Booking information
  const [booking, setBooking] = useState({

    from: "",

    to: "",

    busType: "",

    passengers: 1,

    name: currentUser?.name || "",

    phone: "",

    date: "",

  });



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

      [name]: value,

    }));


    // Reset seats when bus type changes

    if (name === "busType") {

      setSelectedSeats([]);

    }

  };



  // =========================================
  // CALCULATE ORIGINAL PRICE
  // =========================================

  const calculatePrice = () => {

    const selectedRoute = routes.find(

      (route) =>

        route.from === booking.from &&

        route.to === booking.to

    );


    const selectedBus = buses.find(

      (bus) =>

        bus.name === booking.busType

    );


    if (!selectedRoute || !selectedBus) {

      return 0;

    }


    const pricePerPerson =

      selectedRoute.price +

      selectedBus.extraPrice;


    const total =

      pricePerPerson *

      Number(booking.passengers);


    return total;

  };



  // =========================================
  // GET DISCOUNT PERCENTAGE
  // =========================================

  const getDiscountPercentage = () => {

    if (!selectedOffer?.discount) {

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

    const totalPrice = calculatePrice();


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

      (discountPercentage / 100)

    );

  };



  // =========================================
  // CALCULATE FINAL PAYMENT
  // =========================================

  const calculateTotalPayment = () => {

    const totalPrice = calculatePrice();

    const discount = calculateDiscount();


    return Math.max(

      0,

      totalPrice - discount

    );

  };



  // =========================================
  // PRICE VARIABLES
  // =========================================

  const totalPrice = calculatePrice();

  const discount = calculateDiscount();

  const totalPayment =
    calculateTotalPayment();

  const discountPercentage =
    getDiscountPercentage();



  // =========================================
  // CONTINUE TO PAYMENT
  // =========================================

  const handleContinue = () => {


    // Check login

    if (!currentUser) {

      alert(
        "Please login before making a booking."
      );

      navigate("/login");

      return;

    }


    // Check route

    if (

      !booking.from ||

      !booking.to

    ) {

      alert(
        "Please select your departure and destination."
      );

      return;

    }


    // Check bus

    if (!booking.busType) {

      alert(
        "Please select a bus type."
      );

      return;

    }


    // Check seats

    if (selectedSeats.length === 0) {

      alert(
        "Please select at least one seat."
      );

      return;

    }


    // Check passenger name

    if (!booking.name.trim()) {

      alert(
        "Please enter the passenger name."
      );

      return;

    }


    // Check phone

    if (!booking.phone.trim()) {

      alert(
        "Please enter your phone number."
      );

      return;

    }


    // Check date

    if (!booking.date) {

      alert(
        "Please select your travel date."
      );

      return;

    }


    // Check price

    if (totalPrice <= 0) {

      alert(
        "Unable to calculate the route price."
      );

      return;

    }



    /*
      Find selected route and bus.

      We need their IDs later
      when saving the booking
      into MySQL.
    */

    const selectedRoute = routes.find(

      (route) =>

        route.from === booking.from &&

        route.to === booking.to

    );


    const selectedBus = buses.find(

      (bus) =>

        bus.name === booking.busType

    );



    // Send everything to Payment page

    navigate("/payment", {

      state: {

        // DATABASE USER ID

        userId: currentUser.id,


        // ROUTE

        from: booking.from,

        to: booking.to,

        routeId:
          selectedRoute?.id || null,


        // BUS

        busType: booking.busType,

        busId:
          selectedBus?.id || null,


        // SEATS

        seats: selectedSeats,


        // PASSENGERS

        passengers:
          Number(booking.passengers),


        // PASSENGER INFORMATION

        name: booking.name,

        phone: booking.phone,

        date: booking.date,


        // ORIGINAL PRICE

        totalPrice: totalPrice,


        // OFFER

        offerId:
          selectedOffer?.id || null,

        offerTitle:
          selectedOffer?.title ||
          "No Offer",

        discountPercentage:
          discountPercentage,


        // DISCOUNT AMOUNT

        discount: discount,


        // FINAL PAYMENT

        totalPayment:
          totalPayment,


        /*
          Keep "total" for compatibility
          with your existing Payment.jsx
          and Confirmation.jsx.
        */

        total:
          totalPayment,

      }

    });

  };



  return (

    <>

      <Navbar />


      <section className="booking-page">


        <div className="booking-header">

          <h1>
            Complete Your Booking
          </h1>


          <p>
            Select your journey details
            and reserve your seat.
          </p>

        </div>



        <div className="booking-container">


          {/* =========================================
              LEFT SIDE
          ========================================= */}

          <div className="booking-summary">


            <h2>
              Trip Details
            </h2>



            {/* =========================================
                OFFER
            ========================================= */}

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
                    You can continue booking
                    at the regular price.
                  </small>

                </div>

              </div>

            )}



            {/* =========================================
                FROM
            ========================================= */}

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


                {cities.map((city) => (

                  <option
                    key={city}
                    value={city}
                  >

                    {city}

                  </option>

                ))}

              </select>

            </div>



            {/* =========================================
                TO
            ========================================= */}

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
                      city !== booking.from

                  )

                  .map((city) => (

                    <option
                      key={city}
                      value={city}
                    >

                      {city}

                    </option>

                  ))}

              </select>

            </div>



            {/* =========================================
                BUS TYPE
            ========================================= */}

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



              {/* =========================================
                  SEAT SELECTION
              ========================================= */}

              {booking.busType && (

                <SeatSelection

                  totalSeats={

                    buses.find(

                      (bus) =>

                        bus.name ===
                        booking.busType

                    )?.seats || 0

                  }


                  selectedSeats={
                    selectedSeats
                  }


                  setSelectedSeats={
                    setSelectedSeats
                  }

                />

              )}

            </div>



            {/* =========================================
                ROUTE
            ========================================= */}

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



            {/* =========================================
                BUS
            ========================================= */}

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



            {/* =========================================
                SEATS
            ========================================= */}

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



            {/* =========================================
                PRICE SUMMARY
            ========================================= */}

            <div className="price-summary">

              <span>
                Total Price
              </span>


              <strong className="price">

                {totalPrice > 0

                  ? `XAF ${totalPrice.toLocaleString(
                      "en-GB"
                    )}`

                  : "Select route"}

              </strong>

            </div>



            <div className="summary-item">

              <span>
                Discount
              </span>


              <strong className="discount-price">

                {discount > 0

                  ? `- XAF ${discount.toLocaleString(
                      "en-GB"
                    )}`

                  : "XAF 0"}

              </strong>

            </div>



            <div className="summary-item">

              <span>
                Total Payment
              </span>


              <strong className="price">

                {totalPayment > 0

                  ? `XAF ${totalPayment.toLocaleString(
                      "en-GB"
                    )}`

                  : "Select route"}

              </strong>

            </div>


          </div>



          {/* =========================================
              RIGHT SIDE
          ========================================= */}

          <div className="booking-form">


            <h2>
              Passenger Information
            </h2>



            {/* NAME */}

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



            {/* PHONE */}

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



            {/* DATE */}

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



            {/* PASSENGERS */}

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



            {/* =========================================
                PAYMENT PREVIEW
            ========================================= */}

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



            {/* =========================================
                CONTINUE
            ========================================= */}

            <button

              className="confirm-btn"

              onClick={handleContinue}

            >

              Continue to Payment

            </button>


          </div>


        </div>


      </section>


      <Footer />

    </>

  );

}


export default Booking;