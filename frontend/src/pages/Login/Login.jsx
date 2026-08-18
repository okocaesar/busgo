import React, { useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";

import { useTranslation } from "../../useTranslation";

import "./Login.css";
import background from "../../assets/1010.jpg";
import { API_URL } from "../../api";

function Login() {

  const navigate = useNavigate();

  const { t } = useTranslation();

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // =========================================
  // HANDLE INPUT CHANGE
  // =========================================

  const handleChange = (event) => {

    setLoginData({
      ...loginData,
      [event.target.name]:
        event.target.value
    });

  };

  // =========================================
  // HANDLE LOGIN
  // =========================================

  const handleLogin = async (event) => {

    event.preventDefault();

    try {

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        loginData
      );

      // =====================================
      // SAVE USER
      // =====================================

      localStorage.setItem(
        "currentUser",
        JSON.stringify(response.data.user)
      );

      // =====================================
      // SAVE AUTH TOKEN
      // =====================================

      localStorage.setItem(
        "authToken",
        response.data.token
      );

      // =====================================
      // SAVE LOGIN STATE
      // =====================================

      localStorage.setItem(
        "loggedIn",
        "true"
      );

      // =====================================
      // ADMIN / CLIENT REDIRECT
      // =====================================

      if (
        response.data.user.role === "admin"
      ) {

        navigate("/admin");

      } else {

        navigate("/");

      }

    } catch (error) {

      alert(
        error.response?.data?.message ||
        t("loginFailed")
      );

    }

  };

  return (

    <section
      className="auth-page"
      style={{
        backgroundImage:
          `url(${background})`
      }}
    >

      <div className="auth-overlay">

        <div className="auth-card">


          {/* =================================
              TITLE
          ================================= */}

          <h1>
            {t("welcomeBack")}
          </h1>


          {/* =================================
              DESCRIPTION
          ================================= */}

          <p>
            {t("loginDescription")}
          </p>


          {/* =================================
              LOGIN FORM
          ================================= */}

          <form
            onSubmit={handleLogin}
          >


            {/* EMAIL */}

            <div className="input-box">

              <label>
                {t("email")}
              </label>

              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleChange}
                placeholder={t("enterEmail")}
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="input-box">

              <label>
                {t("password")}
              </label>

              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleChange}
                placeholder={t("enterPassword")}
                required
              />

            </div>


            {/* LOGIN BUTTON */}

            <button type="submit">
              {t("login")}
            </button>

          </form>


          {/* =================================
              REGISTER LINK
          ================================= */}

          <div className="auth-link">

            {t("dontHaveAccount")}

            <NavLink to="/register">
              {t("register")}
            </NavLink>

          </div>

        </div>

      </div>

    </section>

  );
}

export default Login;
