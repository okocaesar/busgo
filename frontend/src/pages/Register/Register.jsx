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
  // SAVE VERIFICATION INFORMATION
  // =========================================

  const saveVerificationData = ({
    email,
    phone,
    otpChannel,
  }) => {

    const verificationEmail =
      email ||
      formData.email.trim().toLowerCase();

    const verificationPhone =
      phone ||
      formData.phone.trim();

    // Save email
    localStorage.setItem(
      "pendingVerificationEmail",
      verificationEmail
    );

    // Save phone
    localStorage.setItem(
      "pendingVerificationPhone",
      verificationPhone
    );

    // Save OTP channel
    if (otpChannel) {
      localStorage.setItem(
        "pendingVerificationChannel",
        otpChannel
      );
    }

    return {
      email: verificationEmail,
      phone: verificationPhone,
    };
  };


  // =========================================
  // GO TO OTP PAGE
  // =========================================

  const goToOTPPage = ({
    email,
    phone,
    otpChannel,
    whatsappAvailable,
    requiresEmailPermission,
  }) => {

    const verificationData =
      saveVerificationData({
        email,
        phone,
        otpChannel,
      });

    navigate("/verify-otp", {
      state: {

        email:
          verificationData.email,

        phone:
          verificationData.phone,

        otpChannel:
          otpChannel || "",

        whatsappAvailable:
          typeof whatsappAvailable !== "undefined"
            ? whatsappAvailable
            : null,

        requiresEmailPermission:
          requiresEmailPermission || false,

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


      console.log(
        "REGISTRATION RESPONSE:",
        data
      );


      // =========================================
      // SAVE RESPONSE
      // =========================================

      setRegistrationResponse(data);


      // =========================================
      // WHATSAPP OTP SENT
      //
      // This is the preferred path.
      //
      // NO EMAIL PROMPT.
      // NO EMAIL SENT.
      // =========================================

      if (
        data.otpChannel === "whatsapp" &&
        data.whatsappAvailable === true
      ) {

        goToOTPPage({

          email:
            data.email ||
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            data.phone ||
            formData.phone.trim(),

          otpChannel:
            "whatsapp",

          whatsappAvailable:
            true,

          requiresEmailPermission:
            false,

        });

        return;
      }


      // =========================================
      // WHATSAPP NOT AVAILABLE
      //
      // IMPORTANT:
      //
      // The backend has NOT sent an email.
      //
      // We ask the user first.
      // =========================================

      if (
        data.requiresEmailPermission === true
      ) {

        // Save verification information
        saveVerificationData({

          email:
            data.email ||
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            data.phone ||
            formData.phone.trim(),

          otpChannel:
            "none",

        });

        setShowEmailPrompt(true);

        return;
      }


      // =========================================
      // UNEXPECTED RESPONSE
      // =========================================

      if (
        data.requiresVerification
      ) {

        goToOTPPage({

          email:
            data.email ||
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            data.phone ||
            formData.phone.trim(),

          otpChannel:
            data.otpChannel || "",

          whatsappAvailable:
            data.whatsappAvailable,

          requiresEmailPermission:
            data.requiresEmailPermission,

        });

        return;
      }


      // =========================================
      // UNEXPECTED SUCCESS
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
  // IMPORTANT:
  //
  // This ONLY runs after the user clicks
  // "Send OTP to Email".
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


      console.log(
        "EMAIL FALLBACK RESPONSE:",
        data
      );


      // =========================================
      // SAVE VERIFICATION INFORMATION
      // =========================================

      const verificationData =
        saveVerificationData({

          email:
            data.email ||
            email,

          phone:
            registrationResponse?.phone ||
            formData.phone.trim(),

          otpChannel:
            "email",

        });


      // =========================================
      // CLOSE PROMPT
      // =========================================

      setShowEmailPrompt(false);


      // =========================================
      // GO TO OTP PAGE
      // =========================================

      goToOTPPage({

        email:
          verificationData.email,

        phone:
          verificationData.phone,

        otpChannel:
          "email",

        whatsappAvailable:
          false,

        requiresEmailPermission:
          false,

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