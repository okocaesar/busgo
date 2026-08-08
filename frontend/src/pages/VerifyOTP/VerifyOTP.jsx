import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

import { API_URL } from "../../api";
import "./VerifyOTP.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stateEmail = location.state?.email;

    const savedEmail = localStorage.getItem(
      "pendingVerificationEmail"
    );

    setEmail(stateEmail || savedEmail || "");
  }, [location.state]);

  // =========================================
  // VERIFY OTP
  // =========================================

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError("Email address is missing. Please register again.");
      return;
    }

    if (!otp) {
      setError("Please enter the verification code.");
      return;
    }

    if (otp.length !== 6) {
      setError("Verification code must contain 6 digits.");
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
        response.data.message ||
          "Email verified successfully."
      );

      localStorage.removeItem(
        "pendingVerificationEmail"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to verify your email."
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
      setError("Email address is missing.");
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
        response.data.message ||
          "A new verification code has been sent."
      );

    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to resend verification code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="verify-otp-page">

      <div className="verify-otp-card">

        <div className="verify-otp-icon">
          ✉
        </div>

        <h1>
          Verify Your Email
        </h1>

        <p className="verify-description">
          We sent a 6-digit verification code to:
        </p>

        <strong className="verify-email">
          {email || "your email address"}
        </strong>

        <form onSubmit={handleVerify}>

          <div className="input-box">

            <label>
              Verification Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otp}
              onChange={(e) => {
                const value =
                  e.target.value.replace(/\D/g, "");

                setOtp(value);
              }}
              placeholder="Enter 6-digit code"
            />

          </div>

          {error && (
            <div className="verify-error">
              {error}
            </div>
          )}

          {message && (
            <div className="verify-success">
              {message}
            </div>
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
            disabled={resending}
          >
            {resending
              ? "Sending..."
              : "Resend OTP"}
          </button>

        </div>

        <button
          type="button"
          className="back-login-button"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>

      </div>

    </section>
  );
}

export default VerifyOTP;