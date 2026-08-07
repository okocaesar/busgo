import React, { useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";

import "./Login.css";
import background from "../../assets/1010.jpg";
import { API_URL } from "../../api";

function Login() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (event) => {
    setLoginData({
      ...loginData,
      [event.target.name]: event.target.value
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
                loginData
      );

      localStorage.setItem(
        "currentUser",
        JSON.stringify(response.data.user)
      );

      localStorage.setItem(
        "authToken",
        response.data.token
      );

      localStorage.setItem("loggedIn", "true");

      if (response.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Login failed."
      );
    }
  };

  return (
    <section
      className="auth-page"
      style={{
        backgroundImage: `url(${background})`
      }}
    >
      <div className="auth-overlay">
        <div className="auth-card">
          <h1>Welcome Back</h1>

          <p>Login to continue your journey with BusGo</p>

          <form onSubmit={handleLogin}>
            <div className="input-box">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="input-box">
              <label>Password</label>

              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit">
              Login
            </button>
          </form>

          <div className="auth-link">
            Don't have an account?

            <NavLink to="/register">
              Register
            </NavLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;