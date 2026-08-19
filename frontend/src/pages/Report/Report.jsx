import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../../api";

import "./Report.css";

function Report() {

  const navigate = useNavigate();

  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);

  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");

  // =========================================
  // SEND REPORT
  // =========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setSuccess("");
    setError("");

    const reportMessage =
      message.trim();

    // =======================================
    // VALIDATION
    // =======================================

    if (!reportMessage) {

      setError(
        "Please write your report before sending."
      );

      return;
    }

    if (sending) {
      return;
    }

    // =======================================
    // AUTHENTICATION
    // =======================================

    const token =
      localStorage.getItem("authToken");

    const loggedIn =
      localStorage.getItem("loggedIn") === "true";

    if (!loggedIn || !token) {

      navigate("/login");

      return;
    }

    // =======================================
    // SEND REPORT
    // =======================================

    setSending(true);

    try {

      const response =
        await axios.post(
          `${API_URL}/api/reports`,
          {
            message: reportMessage
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      console.log(
        "REPORT SENT:",
        response.data
      );

      // =====================================
      // CLEAR FORM
      // =====================================

      setMessage("");

      // =====================================
      // SUCCESS MESSAGE
      // =====================================

      setSuccess(
        "Report delivered successfully. The BusGo admin will get back to you as soon as possible."
      );

    } catch (err) {

      console.error(
        "SEND REPORT ERROR:",
        err
      );

      // =====================================
      // SESSION EXPIRED
      // =====================================

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "authToken"
        );

        localStorage.removeItem(
          "loggedIn"
        );

        localStorage.removeItem(
          "currentUser"
        );

        navigate("/login");

        return;
      }

      // =====================================
      // SERVER ERROR
      // =====================================

      setError(
        err.response?.data?.message ||
        "Unable to deliver your report. Please try again."
      );

    } finally {

      setSending(false);

    }

  };


  return (

    <section className="report-page">

      <div className="report-container">

        {/* ===================================
            HEADER
        =================================== */}

        <div className="report-header">

          <span className="report-eyebrow">
            BUSGO SUPPORT
          </span>

          <h1>
            Report a Problem
          </h1>

          <p>
            Tell the BusGo administrator about a
            problem, concern, or anything you would
            like us to know.
          </p>

        </div>


        {/* ===================================
            SUCCESS
        =================================== */}

        {success && (

          <div className="report-success">

            <span className="report-success-icon">
              ✓
            </span>

            <div>

              <strong>
                Report delivered successfully
              </strong>

              <p>
                The BusGo admin will get back to
                you as soon as possible.
              </p>

            </div>

          </div>

        )}


        {/* ===================================
            ERROR
        =================================== */}

        {error && (

          <div className="report-error">

            {error}

          </div>

        )}


        {/* ===================================
            REPORT FORM
        =================================== */}

        <form
          className="report-card"
          onSubmit={handleSubmit}
        >

          <div className="report-card-title">

            <span>
              SUPPORT
            </span>

            <h2>
              Send a Report
            </h2>

            <p>
              Your report will be delivered directly
              to the BusGo administration team.
            </p>

          </div>


          {/* =================================
              MESSAGE
          ================================= */}

          <div className="report-field">

            <label htmlFor="report-message">
              Your Message
            </label>

            <textarea
              id="report-message"
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              placeholder="Describe the problem or concern you want to report..."
              rows="8"
              maxLength="2000"
              disabled={sending}
            />

            <div className="report-character-count">

              {message.length}/2000

            </div>

          </div>


          {/* =================================
              SUBMIT
          ================================= */}

          <button
            type="submit"
            className="report-submit-btn"
            disabled={sending}
          >

            {sending
              ? "Sending Report..."
              : "Send Report"}

          </button>

        </form>


        {/* ===================================
            INFORMATION
        =================================== */}

        <div className="report-info-card">

          <span className="report-info-icon">
            ℹ️
          </span>

          <div>

            <strong>
              What happens after you report?
            </strong>

            <p>
              Your report is sent directly to the
              BusGo admin team. Once the administrator
              reviews your report, their response will
              appear in your BusGo notifications.
            </p>

          </div>

        </div>


      </div>

    </section>

  );

}

export default Report;