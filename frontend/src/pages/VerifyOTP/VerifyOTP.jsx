import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, NavLink } from "react-router-dom";

import { API_URL } from "../../api";
import "./VerifyOTP.css";

function VerifyOTP() {

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email ||
    localStorage.getItem("pendingVerificationEmail") ||
    ""
  );

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [countdown, setCountdown] = useState(0);


  // =========================================
  // COUNTDOWN
  // =========================================

  useEffect(() => {

    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown(
        (current) => current - 1
      );
    }, 1000);

    return () => clearInterval(timer);

  }, [countdown]);


  // =========================================
  // VERIFY OTP
  // =========================================

  const handleVerify = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Email address is missing."
      );
      return;
    }

    if (!otp || otp.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    try {

      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        {
          email,
          otp
        }
      );

      setMessage(
        response.data.message
      );

      localStorage.removeItem(
        "pendingVerificationEmail"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (requestError) {

      setError(
        requestError.response?.data?.message ||
        "Unable to verify the code."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================
  // RESEND OTP
  // =========================================

  const handleResend = async () => {

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Email address is missing."
      );
      return;
    }

    try {

      setResending(true);

      const response = await axios.post(
        `${API_URL}/api/auth/resend-otp`,
        {
          email
        }
      );

      setMessage(
        response.data.message
      );

      setOtp("");

      // 60-second resend cooldown
      setCountdown(60);

    } catch (requestError) {

      setError(
        requestError.response?.data?.message ||
        "Unable to resend the verification code."
      );

    } finally {

      setResending(false);

    }
  };


  return (
    <section className="verify-otp-page">

      <div className="verify-otp-card">

        <div className="verify-icon">
          ✉
        </div>

        <h1>
          Verify Your Email
        </h1>

        <p className="verify-description">
          We sent a 6-digit verification code
          to:
        </p>

        <strong className="verify-email">
          {email}
        </strong>


        <form onSubmit={handleVerify}>

          <div className="otp-input-box">

            <label>
              Verification Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value
                    .replace(/\D/g, "")
                )
              }
              placeholder="000000"
              autoComplete="one-time-code"
            />

          </div>


          {error && (
            <p className="otp-error">
              {error}
            </p>
          )}


          {message && (
            <p className="otp-success">
              {message}
            </p>
          )}


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify Email"}
          </button>

        </form>


        <div className="resend-section">

          <p>
            Didn't receive the code?
          </p>

          <button
            type="button"
            className="resend-button"
            onClick={handleResend}
            disabled={
              resending ||
              countdown > 0
            }
          >

            {resending
              ? "Sending..."
              : countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend OTP"}

          </button>

        </div>


        <div className="back-login">

          <NavLink to="/login">
            Back to Login
          </NavLink>

        </div>

      </div>

    </section>
  );
}

export default VerifyOTP;