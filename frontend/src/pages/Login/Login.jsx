import React, { useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import "./Login.css";

import background from "../../assets/1010.jpg";

function Login() {

  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData
      );

      localStorage.setItem(
        "currentUser",
        JSON.stringify(response.data.user)
      );

      localStorage.setItem(
        "loggedIn",
        "true"
      );

      navigate("/");

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
      style={{ backgroundImage: `url(${background})` }}
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