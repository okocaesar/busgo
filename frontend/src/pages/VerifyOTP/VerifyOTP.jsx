import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

import { API_URL } from "../../api";
import "./VerifyOTP.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [otpChannel, setOtpChannel] = useState("");
  const [whatsappAvailable, setWhatsappAvailable] = useState(null);

  const [requiresEmailPermission, setRequiresEmailPermission] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================
  // LOAD VERIFICATION DATA
  // =========================================

  useEffect(() => {
    const state = location.state || {};

    const stateEmail = state.email;

    const savedEmail = localStorage.getItem(
      "pendingVerificationEmail"
    );

    const savedPhone = localStorage.getItem(
      "pendingVerificationPhone"
    );

    const verificationEmail =
      stateEmail ||
      savedEmail ||
      "";

    setEmail(verificationEmail);

    setPhone(
      state.phone ||
      savedPhone ||
      ""
    );

    setOtpChannel(
      state.otpChannel ||
      ""
    );

    if (
      typeof state.whatsappAvailable !== "undefined"
    ) {
      setWhatsappAvailable(
        state.whatsappAvailable
      );
    }

    if (
      state.requiresEmailPermission
    ) {
      setRequiresEmailPermission(true);
    }
  }, [location.state]);

  // =========================================
  // VERIFY OTP
  // =========================================

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Email address is missing. Please register again."
      );
      return;
    }

    if (!otp) {
      setError(
        "Please enter the verification code."
      );
      return;
    }

    if (otp.length !== 6) {
      setError(
        "Verification code must contain 6 digits."
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
        response.data.message ||
          "Account verified successfully."
      );

      localStorage.removeItem(
        "pendingVerificationEmail"
      );

      localStorage.removeItem(
        "pendingVerificationPhone"
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
          "Unable to verify your account."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SEND OTP TO EMAIL
  //
  // ONLY happens after the user explicitly
  // chooses email fallback.
  // =========================================

  const handleSendEmailOTP = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Email address is missing."
      );
      return;
    }

    try {
      setSendingEmail(true);

      const response = await axios.post(
        `${API_URL}/api/auth/send-email-otp`,
        {
          email
        }
      );

      setOtpChannel("email");

      setWhatsappAvailable(false);

      setRequiresEmailPermission(false);

      setMessage(
        response.data.message ||
          "Your verification code has been sent to your email."
      );

    } catch (error) {
      console.error(
        "Send email OTP error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to send the verification email."
      );
    } finally {
      setSendingEmail(false);
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

      // =========================================
      // WHATSAPP RESEND
      // =========================================

      if (
        response.data.otpChannel === "whatsapp"
      ) {
        setOtpChannel("whatsapp");

        setWhatsappAvailable(true);

        setRequiresEmailPermission(false);
      }

      // =========================================
      // WHATSAPP UNAVAILABLE
      // =========================================

      if (
        response.data.requiresEmailPermission
      ) {
        setOtpChannel("none");

        setWhatsappAvailable(false);

        setRequiresEmailPermission(true);
      }

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

        {/* =========================================
            ICON
        ========================================= */}

        <div className="verify-otp-icon">

          {otpChannel === "whatsapp"
            ? "💬"
            : "✉"}

        </div>


        {/* =========================================
            TITLE
        ========================================= */}

        <h1>
          Verify Your Account
        </h1>


        {/* =========================================
            WHATSAPP OTP
        ========================================= */}

        {otpChannel === "whatsapp" && (
          <>
            <p className="verify-description">

              Your 6-digit verification code
              has been sent to your WhatsApp
              number.

            </p>

            {phone && (
              <strong className="verify-email">
                {phone}
              </strong>
            )}
          </>
        )}


        {/* =========================================
            EMAIL OTP
        ========================================= */}

        {otpChannel === "email" && (
          <>
            <p className="verify-description">

              Your 6-digit verification code
              has been sent to:

            </p>

            <strong className="verify-email">
              {email || "your email address"}
            </strong>
          </>
        )}


        {/* =========================================
            UNKNOWN CHANNEL
        ========================================= */}

        {!otpChannel &&
          !requiresEmailPermission && (
            <>
              <p className="verify-description">

                Enter the 6-digit verification
                code sent to you.

              </p>
            </>
          )}


        {/* =========================================
            WHATSAPP NOT AVAILABLE
        ========================================= */}

        {requiresEmailPermission && (
          <div className="email-fallback-box">

            <div className="email-fallback-icon">
              📧
            </div>

            <h2>
              WhatsApp is unavailable
            </h2>

            <p>
              This phone number does not appear
              to have WhatsApp.
            </p>

            <p>
              Would you like us to send your
              verification code to:
            </p>

            <strong className="verify-email">
              {email}
            </strong>

            <button
              type="button"
              className="email-fallback-button"
              onClick={handleSendEmailOTP}
              disabled={sendingEmail}
            >

              {sendingEmail
                ? "Sending to Email..."
                : "Send OTP to Email"}

            </button>

          </div>
        )}


        {/* =========================================
            OTP FORM
        ========================================= */}

        {!requiresEmailPermission && (
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
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setOtp(value);

                }}
                placeholder="Enter 6-digit code"
                disabled={loading}
              />

            </div>


            {/* =========================================
                ERROR
            ========================================= */}

            {error && (
              <div className="verify-error">
                {error}
              </div>
            )}


            {/* =========================================
                SUCCESS
            ========================================= */}

            {message && (
              <div className="verify-success">
                {message}
              </div>
            )}


            {/* =========================================
                VERIFY BUTTON
            ========================================= */}

            <button
              type="submit"
              disabled={loading}
            >

              {loading
                ? "Verifying..."
                : "Verify Account"}

            </button>

          </form>
        )}


        {/* =========================================
            MESSAGE
        ========================================= */}

        {requiresEmailPermission && error && (
          <div className="verify-error">
            {error}
          </div>
        )}

        {requiresEmailPermission && message && (
          <div className="verify-success">
            {message}
          </div>
        )}


        {/* =========================================
            RESEND
        ========================================= */}

        {!requiresEmailPermission && (
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
                ? "Checking WhatsApp..."
                : "Resend OTP"}

            </button>

          </div>
        )}


        {/* =========================================
            BACK TO LOGIN
        ========================================= */}

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