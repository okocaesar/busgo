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
  // VERIFICATION METHOD SELECTION
  // =========================================

  const [showVerificationChoice, setShowVerificationChoice] =
    useState(false);

  const [verificationLoading, setVerificationLoading] =
    useState(false);

  const [registrationResponse, setRegistrationResponse] =
    useState(null);

  const [selectedMethod, setSelectedMethod] =
    useState("");


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

    localStorage.setItem(
      "pendingVerificationEmail",
      verificationEmail
    );

    localStorage.setItem(
      "pendingVerificationPhone",
      verificationPhone
    );

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
  }) => {

    const verificationData =
      saveVerificationData({
        email,
        phone,
        otpChannel,
      });

    navigate("/verify-otp", {
      state: {
        email: verificationData.email,
        phone: verificationData.phone,
        otpChannel: otpChannel || "",
      },
    });
  };


  // =========================================
  // HANDLE REGISTRATION
  // =========================================

  const handleRegister = async (e) => {
    e.preventDefault();

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
      // REGISTER ACCOUNT
      //
      // IMPORTANT:
      //
      // The backend creates and stores the OTP.
      // It does NOT send the OTP yet.
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


      setRegistrationResponse(data);


      // =========================================
      // SAVE BASIC VERIFICATION DATA
      // =========================================

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


      // =========================================
      // SHOW METHOD SELECTION
      // =========================================

      if (
        data.requiresVerification === true ||
        data.chooseVerificationMethod === true
      ) {

        setShowVerificationChoice(true);

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
  // SEND OTP USING SELECTED METHOD
  // =========================================

  const handleVerificationMethod = async (
    method
  ) => {

    if (verificationLoading) {
      return;
    }


    setSelectedMethod(method);

    setVerificationLoading(true);


    try {

      const email =
        registrationResponse?.email ||
        formData.email
          .trim()
          .toLowerCase();


      const phone =
        registrationResponse?.phone ||
        formData.phone.trim();


      // =========================================
      // WHATSAPP
      // =========================================

      if (method === "whatsapp") {

        const response =
          await axios.post(
            `${API_URL}/api/auth/send-whatsapp-otp`,
            {
              email,
            }
          );


        const data =
          response.data || {};


        console.log(
          "WHATSAPP OTP RESPONSE:",
          data
        );


        // =========================================
        // WHATSAPP SUCCESS
        // =========================================

        if (
          data.otpChannel === "whatsapp" ||
          data.requiresVerification === true
        ) {

          goToOTPPage({

            email:
              data.email ||
              email,

            phone,

            otpChannel:
              "whatsapp",

          });

          return;
        }


        throw new Error(
          data.message ||
          "Unable to send OTP through WhatsApp."
        );
      }


      // =========================================
      // EMAIL
      // =========================================

      if (method === "email") {

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
          "EMAIL OTP RESPONSE:",
          data
        );


        // =========================================
        // EMAIL SUCCESS
        // =========================================

        if (
          data.otpChannel === "email" ||
          data.requiresVerification === true
        ) {

          goToOTPPage({

            email:
              data.email ||
              email,

            phone,

            otpChannel:
              "email",

          });

          return;
        }


        throw new Error(
          data.message ||
          "Unable to send OTP through email."
        );
      }

    } catch (error) {

      console.error(
        `${method} OTP error:`,
        error
      );


      // =========================================
      // WHATSAPP FAILURE
      // =========================================

      if (method === "whatsapp") {

        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to send the verification code through WhatsApp.";

        alert(message);

        return;
      }


      // =========================================
      // EMAIL FAILURE
      // =========================================

      if (method === "email") {

        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to send the verification email.";

        alert(message);

        return;
      }

    } finally {

      setVerificationLoading(false);

      setSelectedMethod("");

    }
  };


  // =========================================
  // CANCEL METHOD SELECTION
  // =========================================

  const handleCancelVerification = () => {

    if (verificationLoading) {
      return;
    }

    setShowVerificationChoice(false);

    setRegistrationResponse(null);

    setSelectedMethod("");

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
                required
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
                required
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
                required
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
                required
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
                required
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
          VERIFICATION METHOD MODAL
      ========================================= */}

      {showVerificationChoice && (

        <div
          className="verification-method-overlay"
        >

          <div
            className="verification-method-modal"
          >

            {/* ICON */}

            <div
              className="verification-method-icon"
            >
              🔐
            </div>


            <h2>
              Verify Your Account
            </h2>


            <p>
              Your account has been created successfully.
            </p>


            <p>
              How would you like to receive
              your verification code?
            </p>


            {/* EMAIL ADDRESS */}

            <div
              className="verification-email-display"
            >
              {registrationResponse?.email ||
                formData.email
                  .trim()
                  .toLowerCase()}
            </div>


            {/* =====================================
                WHATSAPP OPTION
            ====================================== */}

            <button
              type="button"
              className="verification-method-btn whatsapp-method-btn"
              onClick={() =>
                handleVerificationMethod(
                  "whatsapp"
                )
              }
              disabled={
                verificationLoading
              }
            >

              <span className="verification-method-btn-icon">
                💬
              </span>

              <span className="verification-method-btn-content">

                <strong>
                  {selectedMethod === "whatsapp" &&
                  verificationLoading
                    ? "Sending..."
                    : "WhatsApp"}
                </strong>

                <small>
                  Send the code to{" "}
                  {registrationResponse?.phone ||
                    formData.phone}
                </small>

              </span>

              <span className="verification-method-arrow">
                →
              </span>

            </button>


            {/* =====================================
                EMAIL OPTION
            ====================================== */}

            <button
              type="button"
              className="verification-method-btn email-method-btn"
              onClick={() =>
                handleVerificationMethod(
                  "email"
                )
              }
              disabled={
                verificationLoading
              }
            >

              <span className="verification-method-btn-icon">
                ✉️
              </span>

              <span className="verification-method-btn-content">

                <strong>
                  {selectedMethod === "email" &&
                  verificationLoading
                    ? "Sending..."
                    : "Email"}
                </strong>

                <small>
                  Send the code to{" "}
                  {registrationResponse?.email ||
                    formData.email}
                </small>

              </span>

              <span className="verification-method-arrow">
                →
              </span>

            </button>


            {/* =====================================
                CANCEL
            ====================================== */}

            <button
              type="button"
              className="verification-method-cancel"
              onClick={
                handleCancelVerification
              }
              disabled={
                verificationLoading
              }
            >
              Cancel
            </button>


            {/* NOTE */}

            <p
              className="verification-method-note"
            >
              Your verification code will
              expire in 10 minutes.
            </p>

          </div>

        </div>

      )}

    </section>
  );
}

export default Register;