import React from "react";
import "./Offers.css";

function Offers() {

  const offers = [
    {
      title: "Weekend Discount",
      discount: "20% OFF",
      description:
        "Enjoy discounted bus tickets every weekend on selected routes.",
    },

    {
      title: "Early Booking Offer",
      discount: "15% OFF",
      description:
        "Book your trip early and save more on your journey.",
    },

    {
      title: "Student Travel Deal",
      discount: "25% OFF",
      description:
        "Special discounts available for students travelling across Cameroon.",
    },
  ];


  return (
    <section className="offers-page">

      <div className="offers-header">

        <h1>BusGo Offers</h1>

        <p>
          Save more on your journeys with our latest travel deals.
        </p>

      </div>


      <div className="offers-container">

        {offers.map((offer, index) => (

          <div className="offer-card" key={index}>

            <div className="discount">
              {offer.discount}
            </div>


            <h2>
              {offer.title}
            </h2>


            <p>
              {offer.description}
            </p>


            <button>
              Book Now
            </button>

          </div>

        ))}

      </div>

    </section>
  );
}


export default Offers;