import axios from "axios";
import { API_URL } from "../api";

// =========================================
// BUSGO WEB PUSH SERVICE
// =========================================
//
// Handles:
// 1. Service worker registration
// 2. Browser notification permission
// 3. Push subscription creation
// 4. Sending subscription to BusGo backend
// 5. Removing subscription
//
// IMPORTANT
// -----------------------------------------
// The VAPID PRIVATE KEY NEVER belongs here.
//
// Only the VAPID PUBLIC KEY is used by the
// browser.
//
// The PRIVATE KEY stays on the backend.
// =========================================


// =========================================
// VAPID PUBLIC KEY
// =========================================
//
// IMPORTANT:
// Replace the value below with your EXISTING
// VAPID PUBLIC KEY.
//
// NEVER put the VAPID PRIVATE KEY here.
//
// =========================================

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY || "";


// =========================================
// CONVERT VAPID KEY
// =========================================

const urlBase64ToUint8Array = (base64String) => {

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
      (char) =>
        char.charCodeAt(0)
    )
  );
};


// =========================================
// GET AUTH TOKEN
// =========================================

const getAuthToken = () => {

  return localStorage.getItem(
    "authToken"
  );

};


// =========================================
// REGISTER SERVICE WORKER
// =========================================

export const registerBusGoServiceWorker =
  async () => {

    if (
      !("serviceWorker" in navigator)
    ) {

      console.warn(
        "BusGo: Service workers are not supported."
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
        registration.scope
      );


      await navigator.serviceWorker.ready;


      return registration;

    } catch (error) {

      console.error(
        "BusGo service worker registration failed:",
        error
      );

      return null;
    }

  };


// =========================================
// GET EXISTING PUSH SUBSCRIPTION
// =========================================

export const getExistingPushSubscription =
  async () => {

    try {

      const registration =
        await navigator.serviceWorker.ready;


      const subscription =
        await registration.pushManager.getSubscription();


      return subscription;

    } catch (error) {

      console.error(
        "BusGo: Unable to get push subscription:",
        error
      );

      return null;
    }

  };


// =========================================
// REQUEST NOTIFICATION PERMISSION
// =========================================

export const requestNotificationPermission =
  async () => {

    if (
      !("Notification" in window)
    ) {

      console.warn(
        "BusGo: Browser notifications are not supported."
      );

      return "unsupported";
    }


    if (
      Notification.permission ===
      "granted"
    ) {

      return "granted";
    }


    if (
      Notification.permission ===
      "denied"
    ) {

      console.warn(
        "BusGo: Notification permission was denied."
      );

      return "denied";
    }


    try {

      const permission =
        await Notification.requestPermission();


      console.log(
        "BusGo notification permission:",
        permission
      );


      return permission;

    } catch (error) {

      console.error(
        "BusGo notification permission error:",
        error
      );

      return "denied";
    }

  };


// =========================================
// CREATE PUSH SUBSCRIPTION
// =========================================

export const createPushSubscription =
  async () => {

    if (
      !VAPID_PUBLIC_KEY
    ) {

      console.error(
        "BusGo: VITE_VAPID_PUBLIC_KEY is missing."
      );

      return null;
    }


    if (
      !("serviceWorker" in navigator)
    ) {

      console.warn(
        "BusGo: Service workers are not supported."
      );

      return null;
    }


    if (
      !("PushManager" in window)
    ) {

      console.warn(
        "BusGo: Web Push is not supported."
      );

      return null;
    }


    // ---------------------------------------
    // AUTHENTICATION
    // ---------------------------------------

    const token =
      getAuthToken();


    if (!token) {

      console.warn(
        "BusGo: Cannot create push subscription without login."
      );

      return null;
    }


    // ---------------------------------------
    // REGISTER SERVICE WORKER
    // ---------------------------------------

    const registration =
      await registerBusGoServiceWorker();


    if (!registration) {

      return null;
    }


    // ---------------------------------------
    // PERMISSION
    // ---------------------------------------

    const permission =
      await requestNotificationPermission();


    if (
      permission !==
      "granted"
    ) {

      console.warn(
        "BusGo: Push notification permission was not granted."
      );

      return null;
    }


    // ---------------------------------------
    // CHECK EXISTING SUBSCRIPTION
    // ---------------------------------------

    let subscription =
      await registration.pushManager.getSubscription();


    // ---------------------------------------
    // CREATE NEW SUBSCRIPTION
    // ---------------------------------------

    if (!subscription) {

      try {

        subscription =
          await registration.pushManager.subscribe({

            userVisibleOnly: true,

            applicationServerKey:
              urlBase64ToUint8Array(
                VAPID_PUBLIC_KEY
              )

          });

      } catch (error) {

        console.error(
          "BusGo: Unable to create push subscription:",
          error
        );

        return null;
      }

    }


    // ---------------------------------------
    // SEND TO BACKEND
    // ---------------------------------------

    try {

      const response =
        await axios.post(

          `${API_URL}/api/notifications/subscribe`,

          {
            subscription:
              subscription.toJSON()
          },

          {
            headers: {

              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json"

            }

          }

        );


      console.log(
        "BusGo push subscription saved:",
        response.data
      );


      return subscription;

    } catch (error) {

      console.error(
        "BusGo: Unable to save push subscription:",
        error.response?.data ||
        error.message ||
        error
      );

      return null;
    }

  };


// =========================================
// REMOVE PUSH SUBSCRIPTION
// =========================================

export const removePushSubscription =
  async () => {

    const token =
      getAuthToken();


    if (!token) {

      return false;
    }


    try {

      const subscription =
        await getExistingPushSubscription();


      if (!subscription) {

        return true;
      }


      await axios.delete(

        `${API_URL}/api/notifications/subscribe`,

        {

          headers: {

            Authorization:
              `Bearer ${token}`

          },

          data: {

            endpoint:
              subscription.endpoint

          }

        }

      );


      await subscription.unsubscribe();


      console.log(
        "BusGo push subscription removed."
      );


      return true;

    } catch (error) {

      console.error(
        "BusGo: Unable to remove push subscription:",
        error.response?.data ||
        error.message ||
        error
      );

      return false;
    }

  };


// =========================================
// INITIALIZE BUSGO PUSH NOTIFICATIONS
// =========================================
//
// Call this AFTER the user has logged in.
//
// =========================================

export const initializePushNotifications =
  async () => {

    try {

      if (
        !getAuthToken()
      ) {

        console.log(
          "BusGo push notifications skipped: user is not logged in."
        );

        return null;
      }


      const subscription =
        await createPushSubscription();


      if (subscription) {

        console.log(
          "========================================="
        );

        console.log(
          "BUSGO PUSH NOTIFICATIONS READY"
        );

        console.log(
          "Endpoint:",
          subscription.endpoint
        );

        console.log(
          "========================================="
        );

      }


      return subscription;

    } catch (error) {

      console.error(
        "BusGo push notification initialization failed:",
        error
      );

      return null;
    }

  };