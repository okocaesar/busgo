import React, { useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import "./Register.css";

import { API_URL } from "../../api";
import background from "../../assets/1010.jpg";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // =========================================
  // EMAIL FALLBACK PROMPT
  // =========================================

  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  const [emailFallbackLoading, setEmailFallbackLoading] =
    useState(false);

  const [registrationResponse, setRegistrationResponse] =
    useState(null);


  // =========================================
  // HANDLE INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  // =========================================
  // SAVE VERIFICATION EMAIL
  // =========================================

  const saveVerificationEmail = (email) => {
    const verificationEmail =
      email ||
      formData.email.trim().toLowerCase();

    localStorage.setItem(
      "pendingVerificationEmail",
      verificationEmail
    );

    return verificationEmail;
  };


  // =========================================
  // GO TO OTP PAGE
  // =========================================

  const goToOTPPage = (email) => {
    const verificationEmail =
      saveVerificationEmail(email);

    navigate("/verify-otp", {
      state: {
        email: verificationEmail,
      },
    });
  };


  // =========================================
  // HANDLE REGISTRATION
  // =========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    // Prevent double clicking
    if (loading) {
      return;
    }


    // =========================================
    // VALIDATION
    // =========================================

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }


    if (
      formData.password !==
      formData.confirmPassword
    ) {
      alert("Passwords do not match.");
      return;
    }


    if (formData.password.length < 6) {
      alert(
        "Password must be at least 6 characters."
      );
      return;
    }


    try {

      setLoading(true);


      // =========================================
      // SEND REGISTRATION REQUEST
      // =========================================

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        {
          name:
            formData.name.trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            formData.phone.trim(),

          password:
            formData.password,
        }
      );


      const data =
        response.data || {};


      // =========================================
      // SAVE RESPONSE
      //
      // We keep this because if WhatsApp is
      // unavailable, we need the registration
      // information while showing the prompt.
      // =========================================

      setRegistrationResponse(data);


      // =========================================
      // WHATSAPP OTP SENT
      //
      // User does NOT need to approve email.
      // Go directly to verification.
      // =========================================

      if (
        data.otpChannel === "whatsapp" &&
        data.whatsappAvailable === true
      ) {

        goToOTPPage(
          data.email ||
          formData.email
            .trim()
            .toLowerCase()
        );

        return;
      }


      // =========================================
      // WHATSAPP NOT AVAILABLE
      //
      // IMPORTANT:
      //
      // Backend has NOT sent an email.
      //
      // We now ask the user for permission.
      // =========================================

      if (
        data.requiresEmailPermission === true
      ) {

        setShowEmailPrompt(true);

        return;
      }


      // =========================================
      // FALLBACK
      //
      // If backend doesn't return a channel
      // for some unexpected reason, still allow
      // the user to continue to verification.
      // =========================================

      if (
        data.requiresVerification
      ) {

        goToOTPPage(
          data.email ||
          formData.email
            .trim()
            .toLowerCase()
        );

        return;
      }


      // =========================================
      // UNEXPECTED RESPONSE
      // =========================================

      alert(
        data.message ||
          "Registration completed."
      );

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================
  // SEND OTP TO EMAIL
  //
  // This function runs ONLY after the user
  // explicitly chooses email fallback.
  // =========================================

  const handleSendEmailOTP = async () => {

    if (emailFallbackLoading) {
      return;
    }


    try {

      setEmailFallbackLoading(true);


      const email =
        registrationResponse?.email ||
        formData.email
          .trim()
          .toLowerCase();


      // =========================================
      // REQUEST EMAIL OTP
      // =========================================

      const response =
        await axios.post(
          `${API_URL}/api/auth/send-email-otp`,
          {
            email,
          }
        );


      const data =
        response.data || {};


      // =========================================
      // SAVE EMAIL
      // =========================================

      const verificationEmail =
        saveVerificationEmail(
          data.email || email
        );


      // =========================================
      // CLOSE PROMPT
      // =========================================

      setShowEmailPrompt(false);


      // =========================================
      // GO TO OTP PAGE
      // =========================================

      navigate("/verify-otp", {
        state: {
          email: verificationEmail,
        },
      });


    } catch (error) {

      console.error(
        "Email OTP fallback error:",
        error
      );


      alert(
        error.response?.data?.message ||
          "Unable to send the verification email. Please try again."
      );

    } finally {

      setEmailFallbackLoading(false);

    }
  };


  // =========================================
  // CANCEL EMAIL FALLBACK
  // =========================================

  const handleCancelEmailFallback = () => {

    setShowEmailPrompt(false);

    setRegistrationResponse(null);

  };


  // =========================================
  // PAGE
  // =========================================

  return (
    <section
      className="auth-page"
      style={{
        backgroundImage:
          `url(${background})`,
      }}
    >

      <div className="auth-overlay">

        <div className="auth-card">

          <h1>
            Create Account
          </h1>

          <p>
            Join BusGo and start booking your journeys.
          </p>


          {/* =====================================
              REGISTRATION FORM
          ====================================== */}

          <form
            onSubmit={handleRegister}
          >

            {/* FULL NAME */}

            <div className="input-box">

              <label>
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
              />

            </div>


            {/* EMAIL */}

            <div className="input-box">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />

            </div>


            {/* PHONE */}

            <div className="input-box">

              <label>
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                autoComplete="tel"
                disabled={loading}
              />

            </div>


            {/* PASSWORD */}

            <div className="input-box">

              <label>
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={loading}
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="input-box">

              <label>
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
              />

            </div>


            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={loading}
            >

              {loading
                ? "Creating Account..."
                : "Register"}

            </button>

          </form>


          {/* =====================================
              LOGIN LINK
          ====================================== */}

          <div className="auth-link">

            Already have an account?

            {" "}

            <NavLink to="/login">
              Login
            </NavLink>

          </div>

        </div>

      </div>


      {/* =========================================
          EMAIL FALLBACK MODAL
      ========================================= */}

      {showEmailPrompt && (

        <div
          className="email-fallback-overlay"
        >

          <div
            className="email-fallback-modal"
          >

            {/* ICON */}

            <div
              className="email-fallback-icon"
            >
              📱
            </div>


            <h2>
              WhatsApp Unavailable
            </h2>


            <p>
              We couldn't find WhatsApp on
              this phone number.
            </p>


            <p>
              Would you like BusGo to send
              your verification code to:
            </p>


            <div
              className="email-fallback-address"
            >
              {registrationResponse?.email ||
                formData.email
                  .trim()
                  .toLowerCase()}
            </div>


            <p
              className="email-fallback-note"
            >
              Your verification code will
              expire in 10 minutes.
            </p>


            {/* BUTTONS */}

            <div
              className="email-fallback-actions"
            >

              <button
                type="button"
                className="email-fallback-cancel"
                onClick={
                  handleCancelEmailFallback
                }
                disabled={
                  emailFallbackLoading
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="email-fallback-confirm"
                onClick={
                  handleSendEmailOTP
                }
                disabled={
                  emailFallbackLoading
                }
              >

                {emailFallbackLoading
                  ? "Sending..."
                  : "Send OTP to Email"}

              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}

export default Register;