import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../../useTranslation";

import "./Hero.css";

import hero1 from "../../assets/hero.jpg";
import hero2 from "../../assets/hero2.jpg";
import hero3 from "../../assets/hero3.jpg";
import hero4 from "../../assets/hero4.jpg";
import hero5 from "../../assets/hero5.jpg";

function Hero() {

  const { t } = useTranslation();

  const images = [
    hero1,
    hero2,
    hero3,
    hero4,
    hero5
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {

    const interval = setInterval(() => {

      setCurrentImage((prev) =>
        (prev + 1) % images.length
      );

    }, 5000);

    return () => clearInterval(interval);

  }, [images.length]);

  return (

    <section
      className="hero"
      style={{
        backgroundImage:
          `url(${images[currentImage]})`
      }}
    >

      <div className="overlay">

        <div className="hero-content">

          <div className="hero-text">

            <h1>
              {t("travelEasy")}
              <br />
              <span>
                {t("bookSmart")}
              </span>
            </h1>

            <p>
              {t("heroDescription")}
            </p>

            <NavLink to="/booking">

              <button>
                {t("bookNow")}
              </button>

            </NavLink>

          </div>

        </div>

        {/* SLIDER DOTS */}

        <div className="hero-dots">

          {images.map((_, index) => (

            <button
              key={index}
              className={
                currentImage === index
                  ? "dot active"
                  : "dot"
              }
              onClick={() =>
                setCurrentImage(index)
              }
              aria-label={t("goToSlide", {
                number: index + 1
              })}
            />

          ))}

        </div>

      </div>

    </section>

  );
}

export default Hero;
