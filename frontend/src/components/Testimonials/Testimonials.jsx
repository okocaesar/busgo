import React from "react";
import "./Testimonials.css";
import { FaStar } from "react-icons/fa";

function Testimonials() {
  const reviews = [
    {
      name: "Wesley Itoe",
      location: "Douala",
      review:
        "BusGo made booking my ticket incredibly easy. The journey was comfortable and on time.",
    },
    {
      name: "Maya Eyong",
      location: "Yaoundé",
      review:
        "I love the simple interface and fast booking process. Highly recommended!",
    },
    {
      name: "Lawrence Agbor",
      location: "Bamenda",
      review:
        "Excellent customer service and reliable buses. I'll definitely use BusGo again.",
    },
  ];

  return (
    <section className="testimonials">

      <h2>What Our Customers Say</h2>

      <p>
        Thousands of travellers trust BusGo every day.
      </p>

      <div className="testimonial-grid">

        {reviews.map((item, index) => (
          <div className="testimonial-card" key={index}>

            <div className="stars">
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </div>

            <p className="review">
              {item.review}</p>

            <div className="customer">
              <div className="avatar">
                {item.name.charAt(0)}
              </div>

              <div>
                <h4>{item.name}</h4>
                <span>{item.location}</span>
              </div>
            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default Testimonials;