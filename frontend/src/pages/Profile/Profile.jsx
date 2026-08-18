import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

import { API_URL } from "../../api";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =========================================
  // LOAD PROFILE
  // =========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const loggedIn =
          localStorage.getItem("loggedIn");

        // =========================================
        // IMPORTANT:
        // BusGo stores the JWT as "authToken"
        // =========================================

        const token =
          localStorage.getItem("authToken");

        let currentUser = null;

        try {
          currentUser = JSON.parse(
            localStorage.getItem("currentUser")
          );
        } catch {
          currentUser = null;
        }

        // =========================================
        // CHECK LOGIN SESSION
        // =========================================

        if (
          !loggedIn ||
          !token ||
          !currentUser?.id
        ) {
          navigate("/login");
          return;
        }

        // =========================================
        // GET PROFILE FROM SERVER
        // =========================================

        const response =
          await axios.get(
            `${API_URL}/api/auth/profile`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const profile =
          response.data?.user;

        if (!profile) {
          throw new Error(
            "Profile information was not returned."
          );
        }

        // =========================================
        // NORMALISE USER
        // =========================================

        const updatedUser = {
          ...profile,

          profilePicture:
            profile.profile_picture ||
            profile.profilePicture ||
            null
        };

        setUser(updatedUser);

        // =========================================
        // KEEP LOCAL USER DATA IN SYNC
        // =========================================

        localStorage.setItem(
          "currentUser",
          JSON.stringify(updatedUser)
        );

      } catch (err) {

        console.error(
          "Unable to load profile:",
          err
        );

        // =========================================
        // TOKEN EXPIRED / INVALID
        // =========================================

        if (
          err.response?.status === 401
        ) {
          localStorage.removeItem(
            "loggedIn"
          );

          localStorage.removeItem(
            "currentUser"
          );

          // IMPORTANT:
          // Remove authToken, NOT token
          localStorage.removeItem(
            "authToken"
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
          "Unable to load your profile."
        );

      } finally {

        setLoading(false);

      }
    };

    loadProfile();

  }, [navigate]);


  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="profile-loading">
        Loading profile...
      </div>
    );
  }


  // =========================================
  // NO USER
  // =========================================

  if (!user) {
    return (
      <div className="profile-loading">

        <p>
          {error ||
            "Unable to load profile."}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/login")
          }
        >
          Go to Login
        </button>

      </div>
    );
  }


  // =========================================
  // INITIALS
  // =========================================

  const initials =
    (user.name || "Traveller")
      .trim()
      .split(" ")
      .map(
        (word) =>
          word.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();


  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "loggedIn"
    );

    localStorage.removeItem(
      "currentUser"
    );

    // IMPORTANT:
    // BusGo uses authToken
    localStorage.removeItem(
      "authToken"
    );

    navigate("/login");

  };


  // =========================================
  // START EDITING
  // =========================================

  const handleStartEditing = () => {

    setMessage("");

    setError("");

    setEditing(true);

  };


  // =========================================
  // CANCEL EDITING
  // =========================================

  const handleCancelEditing = () => {

    setEditing(false);

    setMessage("");

    setError("");

  };


  // =========================================
  // SAVE PROFILE
  // =========================================

  const handleSaveProfile = async () => {

    if (saving) {
      return;
    }

    setSaving(true);

    setMessage("");

    setError("");

    try {

      // =========================================
      // IMPORTANT:
      // Get authToken, not token
      // =========================================

      const token =
        localStorage.getItem(
          "authToken"
        );

      if (!token) {

        localStorage.removeItem(
          "loggedIn"
        );

        localStorage.removeItem(
          "currentUser"
        );

        navigate("/login");

        return;
      }

      // =========================================
      // UPDATE PROFILE
      // =========================================

      const response =
        await axios.put(
          `${API_URL}/api/auth/profile`,
          {
            name:
              user.name,

            phone:
              user.phone,

            email:
              user.email
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const updatedUser =
        response.data?.user;

      if (!updatedUser) {
        throw new Error(
          "Updated profile was not returned."
        );
      }

      // =========================================
      // NORMALISE UPDATED USER
      // =========================================

      const normalizedUser = {
        ...updatedUser,

        profilePicture:
          updatedUser.profile_picture ||
          updatedUser.profilePicture ||
          null
      };

      // =========================================
      // UPDATE STATE
      // =========================================

      setUser(
        normalizedUser
      );

      // =========================================
      // UPDATE LOCAL STORAGE
      // =========================================

      localStorage.setItem(
        "currentUser",
        JSON.stringify(
          normalizedUser
        )
      );

      // =========================================
      // EXIT EDIT MODE
      // =========================================

      setEditing(false);

      setMessage(
        "Profile updated successfully."
      );

    } catch (err) {

      console.error(
        "Profile update error:",
        err
      );

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "loggedIn"
        );

        localStorage.removeItem(
          "currentUser"
        );

        localStorage.removeItem(
          "authToken"
        );

        navigate("/login");

        return;
      }

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to update your profile."
      );

    } finally {

      setSaving(false);

    }

  };


  return (
    <section className="profile-page">

      <div className="profile-container">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="profile-header">

          <div>

            <span className="profile-eyebrow">
              MY BUSGO ACCOUNT
            </span>

            <h1>
              Profile & Settings
            </h1>

            <p>
              Manage your personal information,
              appearance and BusGo account.
            </p>

          </div>

          {/* DESKTOP ONLY VIA CSS */}

          <button
            className="profile-back-btn"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

        </div>


        {/* =====================================
            ERROR MESSAGE
        ===================================== */}

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}


        {/* =====================================
            SUCCESS MESSAGE
        ===================================== */}

        {message && (
          <div className="profile-success">
            {message}
          </div>
        )}


        {/* =====================================
            PROFILE CARD
        ===================================== */}

        <div className="profile-card">

          <div className="profile-card-title">

            <span>
              ACCOUNT
            </span>

            <h2>
              Personal Information
            </h2>

          </div>


          {/* USER PREVIEW */}

          <div className="profile-user-preview">

            <div className="profile-avatar">

              {user.profilePicture ? (

                <img
                  src={
                    user.profilePicture
                  }
                  alt="Profile"
                />

              ) : (

                initials

              )}

            </div>


            <div>

              <h3>
                {user.name ||
                  "Traveller"}
              </h3>

              <p>
                {user.email ||
                  "No email available"}
              </p>

            </div>

          </div>


          {/* PROFILE FIELDS */}

          <div className="profile-form-grid">

            {/* FULL NAME */}

            <div className="profile-field">

              <label>
                Full Name
              </label>

              <input
                type="text"
                value={
                  user.name || ""
                }
                readOnly={!editing}
                onChange={(e) =>
                  setUser({
                    ...user,
                    name:
                      e.target.value
                  })
                }
              />

            </div>


            {/* PHONE */}

            <div className="profile-field">

              <label>
                Phone Number
              </label>

              <input
                type="text"
                value={
                  user.phone || ""
                }
                readOnly={!editing}
                onChange={(e) =>
                  setUser({
                    ...user,
                    phone:
                      e.target.value
                  })
                }
              />

            </div>


            {/* EMAIL */}

            <div className="profile-field profile-field-full">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={
                  user.email || ""
                }
                readOnly={!editing}
                onChange={(e) =>
                  setUser({
                    ...user,
                    email:
                      e.target.value
                  })
                }
              />

            </div>

          </div>


          {/* =====================================
              EDIT BUTTON
          ===================================== */}

          {!editing && (

            <button
              className="edit-profile-btn"
              type="button"
              onClick={
                handleStartEditing
              }
            >
              Edit Profile
            </button>

          )}


          {/* =====================================
              EDIT ACTIONS
          ===================================== */}

          {editing && (

            <div className="profile-edit-actions">

              <button
                className="edit-profile-btn"
                type="button"
                disabled={saving}
                onClick={
                  handleCancelEditing
                }
              >
                Cancel
              </button>


              <button
                className="save-profile-btn"
                type="button"
                disabled={saving}
                onClick={
                  handleSaveProfile
                }
              >

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>

          )}

        </div>


        {/* =====================================
            APPEARANCE
        ===================================== */}

        <div className="profile-card">

          <div className="profile-card-title">

            <span>
              APPEARANCE
            </span>

            <h2>
              Light & Dark Mode
            </h2>

            <p>
              Choose how BusGo looks on your device.
            </p>

          </div>


          <div className="theme-options">

            <button
              className="theme-option active"
              type="button"
            >

              <span className="theme-icon">
                ☀️
              </span>

              <div>

                <strong>
                  Light Mode
                </strong>

                <small>
                  Bright BusGo appearance
                </small>

              </div>

            </button>


            <button
              className="theme-option"
              type="button"
            >

              <span className="theme-icon">
                🌙
              </span>

              <div>

                <strong>
                  Dark Mode
                </strong>

                <small>
                  Easier on the eyes at night
                </small>

              </div>

            </button>

          </div>

        </div>


        {/* =====================================
            REPORT
        ===================================== */}

        <div className="profile-card">

          <div className="profile-card-title">

            <span>
              SUPPORT
            </span>

            <h2>
              Report to Admin
            </h2>

            <p>
              Have a problem or something you want
              the BusGo team to know about?
            </p>

          </div>


          <textarea
            className="report-textarea"
            placeholder="Write your message to the BusGo administrator..."
            rows="6"
          />


          <button
            className="report-btn"
            type="button"
          >
            Send Report
          </button>

        </div>


        {/* =====================================
            APP INFORMATION
        ===================================== */}

        <div className="profile-card">

          <div className="profile-card-title">

            <span>
              APPLICATION
            </span>

            <h2>
              App Information
            </h2>

          </div>


          <div className="app-info-row">

            <div>

              <span>
                Current Version
              </span>

              <strong>
                BusGo v1.0.0
              </strong>

            </div>


            <button
              className="update-btn"
              type="button"
            >
              Check for Updates
            </button>

          </div>

        </div>


        {/* =====================================
            LOGOUT
        ===================================== */}

        <div className="profile-logout-card">

          <div>

            <span>
              ACCOUNT
            </span>

            <h2>
              Sign out of BusGo
            </h2>

            <p>
              You can sign back in anytime using
              your BusGo account.
            </p>

          </div>


          <button
            className="logout-profile-btn"
            type="button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </div>

    </section>
  );
}

export default Profile;