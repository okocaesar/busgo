const webPush = require("web-push");

// =========================================
// BUSGO WEB PUSH CONFIGURATION
// =========================================
//
// VAPID credentials come from .env
//
// IMPORTANT:
// Never hard-code your private VAPID key here.
// Never send the private key to the frontend.
//
// =========================================

const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY;

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY;

const vapidEmail =
  process.env.VAPID_EMAIL;

// =========================================
// VALIDATE VAPID CONFIGURATION
// =========================================

if (!vapidPublicKey) {
  console.error(
    "WEB PUSH ERROR: VAPID_PUBLIC_KEY is missing."
  );
}

if (!vapidPrivateKey) {
  console.error(
    "WEB PUSH ERROR: VAPID_PRIVATE_KEY is missing."
  );
}

if (!vapidEmail) {
  console.error(
    "WEB PUSH ERROR: VAPID_EMAIL is missing."
  );
}

// =========================================
// CONFIGURE WEB PUSH
// =========================================

if (
  vapidPublicKey &&
  vapidPrivateKey &&
  vapidEmail
) {
  webPush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );

  console.log(
    "========================================="
  );

  console.log(
    "WEB PUSH VAPID CONFIGURATION LOADED"
  );

  console.log(
    "VAPID public key: configured"
  );

  console.log(
    "VAPID private key: configured"
  );

  console.log(
    "VAPID email:",
    vapidEmail
  );

  console.log(
    "========================================="
  );
}

// =========================================
// EXPORT
// =========================================

module.exports = {
  webPush,
  vapidPublicKey
};