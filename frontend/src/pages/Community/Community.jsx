import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FiArrowLeft,
  FiSend,
  FiUsers,
  FiWifi,
  FiWifiOff,
  FiMessageCircle,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Community.css";

// =========================================================
// API / SOCKET URL
// =========================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:10000";

// =========================================================
// COMMUNITY PAGE
// =========================================================

function Community() {
  const navigate = useNavigate();

  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // -------------------------------------------------------
  // REFS
  // -------------------------------------------------------

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // -------------------------------------------------------
  // CURRENT USER
  // -------------------------------------------------------

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Unable to read current user:", err);
    }
  }, []);

  // -------------------------------------------------------
  // TOKEN
  // -------------------------------------------------------

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt")
    );
  }, []);

  // -------------------------------------------------------
  // SCROLL
  // -------------------------------------------------------

  const scrollToBottom = useCallback((smooth = true) => {
    if (!messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  // -------------------------------------------------------
  // SOCKET LIFECYCLE
  // -------------------------------------------------------

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      setError("Please login to join the community.");
      return;
    }

    const socket = io(API_URL, {
      auth: {
        token,
      },

      transports: ["websocket", "polling"],

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // -----------------------------------------------------
    // CONNECT
    // -----------------------------------------------------

    socket.on("connect", () => {
      console.log("Community socket connected:", socket.id);

      setConnected(true);
      setLoading(false);
      setError("");

      socket.emit("community:join", {
        id:
          currentUser?.id ||
          currentUser?.userId ||
          currentUser?.user_id,

        name:
          currentUser?.name ||
          currentUser?.fullName ||
          currentUser?.username ||
          "BusGo User",
      });
    });

    // -----------------------------------------------------
    // DISCONNECT
    // -----------------------------------------------------

    socket.on("disconnect", (reason) => {
      console.log("Community socket disconnected:", reason);

      setConnected(false);
    });

    // -----------------------------------------------------
    // CONNECTION ERROR
    // -----------------------------------------------------

    socket.on("connect_error", (err) => {
      console.error("Community socket error:", err.message);

      setConnected(false);
      setLoading(false);

      setError(
        "Community connection unavailable. Reconnecting..."
      );
    });

    // -----------------------------------------------------
    // HISTORY
    // -----------------------------------------------------

    socket.on("community-history", (history) => {
      console.log("Community history received:", history);

      setMessages(Array.isArray(history) ? history : []);
      setLoading(false);

      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    });

    // -----------------------------------------------------
    // NEW MESSAGE
    // -----------------------------------------------------

    socket.on("community-new-message", (newMessage) => {
      console.log("New community message:", newMessage);

      setMessages((previousMessages) => {
        const alreadyExists = previousMessages.some(
          (item) =>
            String(item.id) === String(newMessage.id)
        );

        if (alreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });

      setSending(false);

      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    });

    // -----------------------------------------------------
    // ONLINE COUNT
    // -----------------------------------------------------

    socket.on("community-online-count", (count) => {
      setOnlineCount(Number(count) || 0);
    });

    // -----------------------------------------------------
    // MESSAGE ERROR
    // -----------------------------------------------------

    socket.on("community-message-error", (data) => {
      setSending(false);

      setError(
        data?.message || "Unable to send message."
      );
    });

    // -----------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [getToken, scrollToBottom, currentUser]);

  // -------------------------------------------------------
  // SEND MESSAGE
  // -------------------------------------------------------

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    if (trimmedMessage.length > 1000) {
      setError(
        "Message cannot exceed 1000 characters."
      );

      return;
    }

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setError(
        "You are currently offline. Please wait for reconnection."
      );

      return;
    }

    setSending(true);
    setError("");

    socket.emit(
      "community-send-message",
      {
        message: trimmedMessage,
      },
      (response) => {
        setSending(false);

        if (!response?.success) {
          setError(
            response?.message ||
              "Unable to send message."
          );
        }
      }
    );

    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    textareaRef.current?.focus();
  };

  // -------------------------------------------------------
  // KEYBOARD
  // -------------------------------------------------------

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // -------------------------------------------------------
  // TEXTAREA
  // -------------------------------------------------------

  const handleMessageChange = (event) => {
    setMessage(event.target.value);

    event.target.style.height = "auto";

    event.target.style.height = `${Math.min(
      event.target.scrollHeight,
      140
    )}px`;
  };

  // -------------------------------------------------------
  // FORMAT TIME
  // -------------------------------------------------------

  const formatTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -------------------------------------------------------
  // FORMAT DATE
  // -------------------------------------------------------

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // -------------------------------------------------------
  // OWN MESSAGE
  // -------------------------------------------------------

  const isOwnMessage = (item) => {
    const currentId =
      currentUser?.id ??
      currentUser?.userId ??
      currentUser?.user_id;

    if (!currentId) {
      return false;
    }

    return (
      String(item.user_id) ===
      String(currentId)
    );
  };

  // -------------------------------------------------------
  // DATE DIVIDER
  // -------------------------------------------------------

  const shouldShowDate = (index) => {
    if (index === 0) {
      return true;
    }

    const current = formatDate(
      messages[index]?.created_at
    );

    const previous = formatDate(
      messages[index - 1]?.created_at
    );

    return current !== previous;
  };

  // -------------------------------------------------------
  // USER INITIAL
  // -------------------------------------------------------

  const getInitial = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  // -------------------------------------------------------
  // BACK
  // -------------------------------------------------------

  const handleBack = () => {
    navigate(-1);
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="community-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="community-header">

        <button
          type="button"
          className="community-back-button"
          onClick={handleBack}
          aria-label="Go back"
        >
          <FiArrowLeft />
        </button>

        <div className="community-header-info">

          <div className="community-title-row">

            <div className="community-title-icon">
              <FiMessageCircle />
            </div>

            <div className="community-title-content">

              <div className="community-title-line">

                <h1>Community</h1>

                <span
                  className={
                    connected
                      ? "community-status-dot online"
                      : "community-status-dot offline"
                  }
                />

              </div>

              <div className="community-subtitle">

                <FiUsers />

                <span>
                  {onlineCount}{" "}
                  {onlineCount === 1
                    ? "person"
                    : "people"}{" "}
                  online
                </span>

              </div>

            </div>

          </div>

        </div>

        <div
          className={
            connected
              ? "community-connection connected"
              : "community-connection disconnected"
          }
          title={
            connected
              ? "Connected"
              : "Reconnecting..."
          }
        >
          {connected ? (
            <FiWifi />
          ) : (
            <FiWifiOff />
          )}

          <span>
            {connected
              ? "Online"
              : "Offline"}
          </span>
        </div>

      </header>

      {/* ===================================================
          OFFLINE BANNER
      =================================================== */}

      {!connected && !loading && (
        <div className="community-offline-banner">

          <div className="community-offline-icon">
            <FiWifiOff />
          </div>

          <div>
            <strong>Connection lost</strong>

            <span>
              Reconnecting to the community...
            </span>
          </div>

        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="community-error">

          <div className="community-error-icon">
            <FiWifiOff />
          </div>

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            <FiX />
          </button>

        </div>
      )}

      {/* ===================================================
          MESSAGE AREA
      =================================================== */}

      <main className="community-messages">

        {loading ? (

          <div className="community-loading">

            <div className="community-loading-card">

              <div className="community-spinner" />

              <h2>
                Connecting to Community
              </h2>

              <p>
                Getting everything ready for you...
              </p>

            </div>

          </div>

        ) : messages.length === 0 ? (

          <div className="community-empty">

            <div className="community-empty-decoration community-empty-decoration-one" />
            <div className="community-empty-decoration community-empty-decoration-two" />

            <div className="community-empty-icon">
              <FiMessageCircle />
            </div>

            <div className="community-empty-badge">
              <FiCheckCircle />
              <span>Community is ready</span>
            </div>

            <h2>
              Welcome to the Community
            </h2>

            <p>
              Connect with fellow BusGo travelers,
              share experiences, ask questions,
              and keep the conversation moving.
            </p>

            <div className="community-empty-hint">
              <FiSend />
              <span>
                Send the first message
              </span>
            </div>

          </div>

        ) : (

          <div className="community-message-list">

            {messages.map((item, index) => {

              const own = isOwnMessage(item);

              return (
                <React.Fragment
                  key={
                    item.id ||
                    `${item.user_id}-${index}`
                  }
                >

                  {/* DATE */}

                  {shouldShowDate(index) && (
                    <div className="community-date-divider">

                      <span>
                        {formatDate(
                          item.created_at
                        )}
                      </span>

                    </div>
                  )}

                  {/* MESSAGE */}

                  <div
                    className={
                      own
                        ? "community-message-row own"
                        : "community-message-row"
                    }
                  >

                    {!own && (
                      <div
                        className="community-avatar"
                        aria-hidden="true"
                      >
                        {getInitial(
                          item.user_name
                        )}
                      </div>
                    )}

                    <div
                      className={
                        own
                          ? "community-message-bubble own"
                          : "community-message-bubble"
                      }
                    >

                      {!own && (
                        <div className="community-sender-name">
                          {item.user_name ||
                            "BusGo User"}
                        </div>
                      )}

                      <div className="community-message-text">
                        {item.message}
                      </div>

                      <div className="community-message-meta">

                        <span>
                          {formatTime(
                            item.created_at
                          )}
                        </span>

                        {own && (
                          <FiCheckCircle />
                        )}

                      </div>

                    </div>

                  </div>

                </React.Fragment>
              );
            })}

            <div ref={messagesEndRef} />

          </div>

        )}

      </main>

      {/* ===================================================
          COMPOSER
      =================================================== */}

      <div className="community-composer-wrapper">

        <div className="community-composer">

          <div className="community-input-icon">
            <FiMessageCircle />
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={
              connected
                ? "Write a message to the community..."
                : "Waiting for connection..."
            }
            disabled={
              !connected || sending
            }
            maxLength={1000}
            rows={1}
            aria-label="Community message"
          />

          <button
            type="button"
            className="community-send-button"
            onClick={sendMessage}
            disabled={
              !message.trim() ||
              !connected ||
              sending
            }
            aria-label="Send message"
          >

            {sending ? (
              <span className="community-send-spinner" />
            ) : (
              <FiSend />
            )}

          </button>

        </div>

        <div className="community-composer-bottom">

          <div className="community-composer-hint">

            <span>
              Everyone in the BusGo community can see your message.
            </span>

          </div>

          <div
            className={
              message.length > 900
                ? "community-character-count warning"
                : "community-character-count"
            }
          >
            {message.length}/1000
          </div>

        </div>

        <div className="community-powered-line">
          <span className="community-powered-dot" />
          Community chat is live
        </div>

      </div>

    </div>
  );
}

export default Community;