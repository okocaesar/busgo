import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./Offers.css";
import heroImage from "../../assets/hero.jpg";

function Offers() {

  const offers = [
    {
      title: "Weekend Discount",
      discount: "20%",
      description:
        "Make your weekend trips more affordable. Enjoy special discounts on selected routes every Saturday and Sunday.",
      route: "Selected Routes",
      validity: "Every Weekend",
      badge: "WEEKEND SPECIAL",
      icon: "🎉",
      featured: false,
    },

    {
      title: "Early Booking Offer",
      discount: "15%",
      description:
        "Planning ahead? Book your bus ticket early and enjoy exclusive savings while securing your preferred seat.",
      route: "All Major Routes",
      validity: "Book 7+ Days Early",
      badge: "SAVE MORE",
      icon: "📅",
      featured: true,
    },

    {
      title: "Student Travel Deal",
      discount: "25%",
      description:
        "Students can travel across Cameroon for less. Enjoy our special student discount and keep more money in your pocket.",
      route: "Across Cameroon",
      validity: "Student ID Required",
      badge: "STUDENT DEAL",
      icon: "🎓",
      featured: false,
    },
  ];

  return (
    <>
      <Navbar />

      <main className="offers-page">

        <section
          className="offers-hero"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="offers-hero-overlay"></div>

          <div className="offers-hero-content">

            <span className="offers-tag">
              BUSGO SPECIAL OFFERS
            </span>

            <h1>
              Save More on
              <span> Every Journey</span>
            </h1>

            <p>
              Discover exclusive BusGo offers and enjoy affordable bus travel
              across Cameroon. Get more value from every trip you take.
            </p>

            <div className="offers-hero-buttons">

              <Link
  to="/booking"
  className="primary-offer-btn"
>
  Book a Trip
  <span>→</span>
</Link>

              <a
                href="#offers"
                className="secondary-offer-btn"
              >
                View Offers
                <span>↓</span>
              </a>

            </div>

          </div>
        </section>


        {/* OFFERS */}
        <section className="offers-section" id="offers">

          <div className="offers-header">

            <div className="section-label">
              <span></span>
              OUR BEST DEALS
              <span></span>
            </div>

            <h2>
              Amazing Offers,
              <span> Better Journeys</span>
            </h2>

            <p>
              Take advantage of our latest promotions and make your next
              BusGo journey even more affordable.
            </p>

          </div>


          <div className="offers-container">

            {offers.map((offer, index) => (

              <article
                className={`offer-card ${
                  offer.featured ? "featured-offer" : ""
                }`}
                key={index}
              >

                {offer.featured && (
                  <div className="popular-badge">
                    ⭐ MOST POPULAR
                  </div>
                )}

                <div className="offer-card-top">

                  <div className="offer-icon">
                    {offer.icon}
                  </div>

                  <span className="offer-badge">
                    {offer.badge}
                  </span>

                </div>


                <div className="discount-area">

                  <span className="discount-number">
                    {offer.discount}
                  </span>

                  <span className="discount-text">
                    OFF
                  </span>

                </div>


                <h3>{offer.title}</h3>

                <p className="offer-description">
                  {offer.description}
                </p>


                <div className="offer-details">

                  <div className="offer-detail">

                    <span className="detail-icon">
                      🚌
                    </span>

                    <div>
                      <small>AVAILABLE ON</small>
                      <strong>{offer.route}</strong>
                    </div>

                  </div>


                  <div className="offer-detail">

                    <span className="detail-icon">
                      ⏰
                    </span>

                    <div>
                      <small>VALIDITY</small>
                      <strong>{offer.validity}</strong>
                    </div>

                  </div>

                </div>


                <Link
  to="/booking"
  state={{
    offer: {
      title: offer.title,
      discount: offer.discount,
    },
  }}
  className="offer-book-btn"
>
  Book Now
  <span>→</span>
</Link>

              </article>

            ))}

          </div>

        </section>

      </main>
    </>
  );
}

export default Offers;