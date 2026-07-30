import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import cities from "../../data/cities";
import routes from "../../data/routes";
import buses from "../../data/buses";
import SeatSelection from "../../components/SeatSelection/SeatSelection";

import "./Booking.css";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function Booking() {
    const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [booking, setBooking] = useState({
  from: "",
  to: "",
  busType: "",
  passengers: 1,
  name: "",
  phone: "",
  date: "",
});


  const handleChange = (e) => {
  const { name, value } = e.target;

  setBooking((prev) => ({
    ...prev,
    [name]: value,
  }));
};

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
    selectedRoute.price + selectedBus.extraPrice;


  const total =
    pricePerPerson * Number(booking.passengers);


  return total;

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
            Select your journey details and reserve your seat.
          </p>

        </div>




        <div className="booking-container">



          {/* LEFT SIDE */}

          <div className="booking-summary">


            <h2>
              Trip Details
            </h2>



            <div className="form-group">

              <label>
                From
              </label>


              <select
  name="from"
  value={booking.from}
  onChange={handleChange}
>
  <option value="">Select Departure City</option>

  {cities.map((city) => (
    <option key={city} value={city}>
      {city}
    </option>
  ))}
</select>

            </div>





            <div className="form-group">

              <label>
                To
              </label>


              <select
  name="to"
  value={booking.to}
  onChange={handleChange}
>
  <option value="">Select Destination</option>

  {cities
    .filter((city) => city !== booking.from)
    .map((city) => (
      <option key={city} value={city}>
        {city}
      </option>
    ))}
</select>

            </div>





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


{/* Seat Selection */}

{booking.busType && (

  <SeatSelection

    totalSeats={
      buses.find(
        (bus) => bus.name === booking.busType
      )?.seats || 0
    }

    selectedSeats={selectedSeats}

    setSelectedSeats={setSelectedSeats}

  />

)}

            </div>





            <div className="summary-item">

              <span>
                Route
              </span>


              <strong>

                {
                  booking.from && booking.to
                    ?
                    `${booking.from} → ${booking.to}`
                    :
                    "Not selected"
                }

              </strong>


            </div>





            <div className="summary-item">

              <span>
                Bus
              </span>


              <strong>

                {
                  booking.busType
                    ?
                    booking.busType
                    :
                    "Not selected"
                }

              </strong>

              <span>
    Seats
  </span>


  <strong>

    {
      selectedSeats.length > 0
      ?
      selectedSeats.join(", ")
      :
      "Not selected"
    }

  </strong>


            </div>





            <div className="summary-item">

              <span>
                Total Price
              </span>


              <strong className="price">

                {
                  calculatePrice() > 0
                    ?
                    `XAF ${calculatePrice().toLocaleString("en-GB")}`
                    :
                    "Select route"
                }

              </strong>


            </div>



          </div>







          {/* RIGHT SIDE */}


          <div className="booking-form">


            <h2>
              Passenger Information
            </h2>




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

        <button

  className="confirm-btn"

  onClick={() => {

    navigate("/payment", {

      state: {

  from: booking.from,

  to: booking.to,

  busType: booking.busType,

  seats: selectedSeats,

  total: calculatePrice(),

  name: booking.name,

  phone: booking.phone,

  date: booking.date,

}

    });

  }}

>

  Continue

</button>



          </div>




        </div>


      </section>




      <Footer />


    </>
  );
}


export default Booking;