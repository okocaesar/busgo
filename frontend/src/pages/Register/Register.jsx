import React, { useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import "./Register.css";

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
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

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }
      );

      alert(response.data.message);

      navigate("/login");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Registration failed."
      );
    }
  };

  return (
    <section
      className="auth-page"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="auth-overlay">
        <div className="auth-card">
          <h1>Create Account</h1>

          <p>Join BusGo and start booking your journeys.</p>

          <form onSubmit={handleRegister}>
            <div className="input-box">
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="input-box">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="input-box">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="input-box">
              <label>Password</label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
            </div>

            <div className="input-box">
              <label>Confirm Password</label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit">
              Register
            </button>
          </form>

          <div className="auth-link">
            Already have an account?

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