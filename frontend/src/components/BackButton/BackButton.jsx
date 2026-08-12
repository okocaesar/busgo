import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import "./BackButton.css";

function BackButton() {

const navigate = useNavigate();

const handleBack = () => {


// Go to previous page when possible
if (window.history.length > 1) {

  navigate(-1);

} else {

  // Fallback
  navigate("/");

}


};

return (


<button
  type="button"
  className="back-button"
  onClick={handleBack}
>

  <FiArrowLeft />

  <span>
    Back
  </span>

</button>


);

}

export default BackButton;
