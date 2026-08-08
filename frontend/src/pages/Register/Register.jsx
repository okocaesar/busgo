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
  // HANDLE INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      // =========================================
      // SEND ONE REGISTRATION REQUEST
      // =========================================

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
        }
      );

      // =========================================
      // SAVE EMAIL FOR OTP PAGE
      // =========================================

      const verificationEmail =
        response.data.email ||
        formData.email.trim().toLowerCase();

      localStorage.setItem(
        "pendingVerificationEmail",
        verificationEmail
      );

      // =========================================
      // GO TO OTP VERIFICATION PAGE
      // =========================================

      navigate("/verify-otp", {
        state: {
          email: verificationEmail,
        },
      });

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
  // PAGE
  // =========================================

  return (
    <section
      className="auth-page"
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      <div className="auth-overlay">

        <div className="auth-card">

          <h1>Create Account</h1>

          <p>
            Join BusGo and start booking your journeys.
          </p>

          <form onSubmit={handleRegister}>

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


          {/* LOGIN LINK */}

          <div className="auth-link">

            Already have an account?

            {" "}

            <NavLink to="/login">
              Login
            </NavLink>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Register;