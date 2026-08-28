const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

// =========================================
// CONVERT VAPID PUBLIC KEY
// =========================================

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0)
    )
  );
}

// =========================================
// GET AUTH TOKEN
// =========================================

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("busgo_token") ||
    null
  );
}

// =========================================
// REGISTER SERVICE WORKER
// =========================================

export async function registerPushServiceWorker() {
  if (
    !("serviceWorker" in navigator)
  ) {
    console.warn(
      "Service workers are not supported."
    );

    return null;
  }

  try {
    const registration =
      await navigator.serviceWorker.register(
        "/service-worker.js"
      );

    console.log(
      "BusGo service worker registered:",
      registration
    );

    return registration;

  } catch (error) {

    console.error(
      "SERVICE WORKER REGISTRATION ERROR:",
      error
    );

    return null;
  }
}

// =========================================
// REQUEST NOTIFICATION PERMISSION
// =========================================

export async function requestNotificationPermission() {

  if (
    !("Notification" in window)
  ) {
    console.warn(
      "Browser notifications are not supported."
    );

    return "unsupported";
  }

  // Already allowed
  if (
    Notification.permission ===
    "granted"
  ) {
    return "granted";
  }

  // Already denied
  if (
    Notification.permission ===
    "denied"
  ) {
    console.warn(
      "Notification permission has been denied."
    );

    return "denied";
  }

  try {

    const permission =
      await Notification.requestPermission();

    console.log(
      "Notification permission:",
      permission
    );

    return permission;

  } catch (error) {

    console.error(
      "NOTIFICATION PERMISSION ERROR:",
      error
    );

    return "denied";
  }
}

// =========================================
// CREATE PUSH SUBSCRIPTION
// =========================================

export async function subscribeToPush() {

  try {

    // ---------------------------------------
    // CHECK SERVICE WORKER SUPPORT
    // ---------------------------------------

    if (
      !("serviceWorker" in navigator)
    ) {
      throw new Error(
        "Service workers are not supported."
      );
    }

    // ---------------------------------------
    // CHECK PUSH SUPPORT
    // ---------------------------------------

    if (
      !("PushManager" in window)
    ) {
      throw new Error(
        "Push notifications are not supported."
      );
    }

    // ---------------------------------------
    // GET TOKEN
    // ---------------------------------------

    const token =
      getToken();

    if (!token) {

      console.warn(
        "No authentication token found. Push subscription skipped."
      );

      return null;
    }

    // ---------------------------------------
    // REGISTER SERVICE WORKER
    // ---------------------------------------

    const registration =
      await registerPushServiceWorker();

    if (!registration) {
      return null;
    }

    // ---------------------------------------
    // REQUEST PERMISSION
    // ---------------------------------------

    const permission =
      await requestNotificationPermission();

    if (
      permission !== "granted"
    ) {

      console.warn(
        "Push notification permission was not granted."
      );

      return null;
    }

    // ---------------------------------------
    // YOUR VAPID PUBLIC KEY
    // ---------------------------------------
    //
    // IMPORTANT:
    //
    // PUT ONLY YOUR PUBLIC VAPID KEY HERE.
    //
    // NEVER PUT YOUR PRIVATE VAPID KEY
    // IN THE FRONTEND.
    //
    // ---------------------------------------

    const vapidPublicKey =
      "BB7QeTPr5YXQ_E6ojoatahq0gO_RBLdQlRHOIbd7eEiUB6p5LRUs-Gl1hRTOiD38SjOpSCyEhhJBrt8JjAUL1gQ";

    if (
      !vapidPublicKey ||
      vapidPublicKey ===
        "PASTE_YOUR_VAPID_PUBLIC_KEY_HERE"
    ) {

      throw new Error(
        "VAPID public key has not been configured."
      );
    }

    // ---------------------------------------
    // CHECK EXISTING SUBSCRIPTION
    // ---------------------------------------

    let subscription =
      await registration.pushManager.getSubscription();

    // ---------------------------------------
    // CREATE SUBSCRIPTION IF NEEDED
    // ---------------------------------------

    if (!subscription) {

      subscription =
        await registration.pushManager.subscribe({

          userVisibleOnly: true,

          applicationServerKey:
            urlBase64ToUint8Array(
              vapidPublicKey
            )
        });
    }

    console.log(
      "BUSGO PUSH SUBSCRIPTION:",
      subscription
    );

    // ---------------------------------------
    // SEND SUBSCRIPTION TO BACKEND
    // ---------------------------------------

    const response =
      await fetch(
        `${API_URL}/api/notifications/subscribe`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify(
            subscription
          )
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Unable to save push subscription."
      );
    }

    console.log(
      "PUSH SUBSCRIPTION SAVED:",
      data
    );

    return subscription;

  } catch (error) {

    console.error(
      "PUSH SUBSCRIPTION ERROR:",
      error
    );

    return null;
  }
}

// =========================================
// UNSUBSCRIBE FROM PUSH
// =========================================

export async function unsubscribeFromPush() {

  try {

    if (
      !("serviceWorker" in navigator)
    ) {
      return false;
    }

    const registration =
      await navigator.serviceWorker.getRegistration(
        "/"
      );

    if (!registration) {
      return false;
    }

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      return true;
    }

    const token =
      getToken();

    // ---------------------------------------
    // TELL BACKEND
    // ---------------------------------------

    if (token) {

      try {

        await fetch(
          `${API_URL}/api/notifications/unsubscribe`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              endpoint:
                subscription.endpoint
            })
          }
        );

      } catch (error) {

        console.warn(
          "Unable to notify server about unsubscribe:",
          error
        );
      }
    }

    // ---------------------------------------
    // UNSUBSCRIBE BROWSER
    // ---------------------------------------

    const result =
      await subscription.unsubscribe();

    console.log(
      "PUSH UNSUBSCRIBED:",
      result
    );

    return result;

  } catch (error) {

    console.error(
      "PUSH UNSUBSCRIBE ERROR:",
      error
    );

    return false;
  }
}