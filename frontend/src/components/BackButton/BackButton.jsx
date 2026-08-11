import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./BackButton.css";

function BackButton({ fallback = "/" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className="back-button"
      onClick={handleBack}
    >
      <FaArrowLeft />
      <span>Back</span>
    </button>
  );
}

export default BackButton;