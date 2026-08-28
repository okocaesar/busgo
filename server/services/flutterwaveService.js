const axios = require("axios");
const crypto = require("crypto");

// ============================================================
// FLUTTERWAVE V4 SERVICE - BUSGO
// ============================================================
//
// Authentication:
//   FLW_CLIENT_ID
//   FLW_CLIENT_SECRET
//
// Optional:
//   FLW_BASE_URL
//   FLW_TOKEN_URL
//
// Sandbox:
//   https://developersandbox-api.flutterwave.com
//
// Production:
//   https://f4bexperience.flutterwave.com
//
// OAuth:
//   https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token
//
// IMPORTANT:
// - Never expose FLW_CLIENT_SECRET to the frontend.
// - Never expose Flutterwave credentials in React/Vite code.
// - All Flutterwave requests must happen from the backend.
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const FLW_CLIENT_ID =
  process.env.FLW_CLIENT_ID;

const FLW_CLIENT_SECRET =
  process.env.FLW_CLIENT_SECRET;

const FLW_BASE_URL =
  process.env.FLW_BASE_URL ||
  "https://developersandbox-api.flutterwave.com";

const FLW_TOKEN_URL =
  process.env.FLW_TOKEN_URL ||
  "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";


// ============================================================
// VALIDATE CONFIGURATION
// ============================================================

function validateCredentials() {
  if (!FLW_CLIENT_ID) {
    throw new Error(
      "FLW_CLIENT_ID is not configured."
    );
  }

  if (!FLW_CLIENT_SECRET) {
    throw new Error(
      "FLW_CLIENT_SECRET is not configured."
    );
  }
}


// ============================================================
// ACCESS TOKEN CACHE
// ============================================================

let accessToken = null;
let accessTokenExpiresAt = 0;


// ============================================================
// CREATE TRACE ID
// ============================================================

function createTraceId() {
  return crypto.randomUUID();
}


// ============================================================
// CREATE IDEMPOTENCY KEY
// ============================================================

function createIdempotencyKey(
  prefix = "BUSGO"
) {
  return (
    `${prefix}-${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}`
  ).replace(
    /[^a-zA-Z0-9-]/g,
    ""
  );
}


// ============================================================
// GET ACCESS TOKEN
// ============================================================
//
// Flutterwave V4 uses OAuth 2.0 client credentials.
//
// Token request:
//   client_id
//   client_secret
//   grant_type=client_credentials
//
// Tokens are cached and refreshed shortly before expiration.
// ============================================================

async function getAccessToken() {
  validateCredentials();

  const now = Date.now();

  // ----------------------------------------------------------
  // USE CACHED TOKEN
  // ----------------------------------------------------------

  if (
    accessToken &&
    accessTokenExpiresAt >
      now + 60 * 1000
  ) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      FLW_TOKEN_URL,
      new URLSearchParams({
        client_id: FLW_CLIENT_ID,
        client_secret: FLW_CLIENT_SECRET,
        grant_type: "client_credentials"
      }).toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Accept:
            "application/json"
        },

        timeout: 30000
      }
    );

    const data =
      response?.data || {};

    if (!data.access_token) {
      console.error(
        "FLUTTERWAVE TOKEN RESPONSE:",
        data
      );

      throw new Error(
        "Flutterwave did not return an access token."
      );
    }

    accessToken =
      data.access_token;

    const expiresIn =
      Number(
        data.expires_in
      ) || 600;

    accessTokenExpiresAt =
      Date.now() +
      expiresIn * 1000;

    return accessToken;
  } catch (error) {
    console.error(
      "FLUTTERWAVE ACCESS TOKEN ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    accessToken = null;
    accessTokenExpiresAt = 0;

    throw error;
  }
}


// ============================================================
// GET AUTHENTICATED HEADERS
// ============================================================

async function getHeaders({
  idempotency = false,
  idempotencyKey = null,
  idempotencyPrefix = "BUSGO"
} = {}) {
  const token =
    await getAccessToken();

  const headers = {
    Authorization:
      `Bearer ${token}`,

    "Content-Type":
      "application/json",

    Accept:
      "application/json",

    "X-Trace-Id":
      createTraceId()
  };

  if (idempotency) {
    headers[
      "X-Idempotency-Key"
    ] =
      idempotencyKey ||
      createIdempotencyKey(
        idempotencyPrefix
      );
  }

  return headers;
}


// ============================================================
// NORMALIZE CAMEROON PHONE
// ============================================================
//
// Accepted examples:
//
//   681234567
//   237681234567
//   +237681234567
//
// Returns:
//
//   {
//     country_code: "237",
//     number: "681234567"
//   }
//
// ============================================================

function normalizeCameroonPhone(phone) {
  if (!phone) {
    return null;
  }

  let normalized =
    String(phone)
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");

  if (normalized.startsWith("+")) {
    normalized =
      normalized.substring(1);
  }

  // 681234567
  if (
    /^6\d{8}$/.test(
      normalized
    )
  ) {
    return {
      country_code: "237",
      number: normalized
    };
  }

  // 237681234567
  if (
    /^2376\d{8}$/.test(
      normalized
    )
  ) {
    return {
      country_code: "237",
      number:
        normalized.substring(3)
    };
  }

  return null;
}


// ============================================================
// CREATE CUSTOMER
// ============================================================
//
// POST /customers
//
// Creates a Flutterwave customer.
//
// ============================================================

async function createCustomer({
  email,
  name,
  phone,
  idempotencyKey
}) {
  if (!email) {
    throw new Error(
      "Customer email is required."
    );
  }

  const headers =
    await getHeaders({
      idempotency: true,

      idempotencyKey,

      idempotencyPrefix:
        "BUSGOCUSTOMER"
    });

  const payload = {
    email:
      String(email)
        .trim()
  };

  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  if (name) {
    const nameParts =
      String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    payload.name = {
      first:
        nameParts[0] ||
        "BusGo",

      last:
        nameParts.length > 1
          ? nameParts[
              nameParts.length - 1
            ]
          : "Customer"
    };

    if (
      nameParts.length > 2
    ) {
      payload.name.middle =
        nameParts
          .slice(1, -1)
          .join(" ");
    }
  }

  // ----------------------------------------------------------
  // PHONE
  // ----------------------------------------------------------

  const normalizedPhone =
    normalizeCameroonPhone(
      phone
    );

  if (normalizedPhone) {
    payload.phone =
      normalizedPhone;
  }

  try {
    const response =
      await axios.post(
        `${FLW_BASE_URL}/customers`,
        payload,
        {
          headers,
          timeout: 30000
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      "FLUTTERWAVE CREATE CUSTOMER ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    throw error;
  }
}


// ============================================================
// CREATE PAYMENT METHOD
// ============================================================
//
// POST /payment-methods
//
// Supported BusGo methods:
//
//   mobile_money
//   card
//
// ============================================================

async function createPaymentMethod({
  type,
  details,
  customerId,
  idempotencyKey
}) {
  if (!type) {
    throw new Error(
      "Payment method type is required."
    );
  }

  if (!customerId) {
    throw new Error(
      "Flutterwave customer ID is required for payment method creation."
    );
  }

  const headers =
    await getHeaders({
      idempotency: true,

      idempotencyKey,

      idempotencyPrefix:
        "BUSGOPAYMENTMETHOD"
    });

  const normalizedType =
    String(type)
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");

  let payload = {
    type:
      normalizedType,

    customer_id:
      customerId
  };


  // ==========================================================
  // MOBILE MONEY
  // ==========================================================

  if (
    normalizedType ===
    "mobile_money"
  ) {
    const mobileMoney =
      details?.mobile_money ||
      details?.mobileMoney ||
      details;

    if (!mobileMoney) {
      throw new Error(
        "Mobile money details are required."
      );
    }

    if (
      !mobileMoney.network
    ) {
      throw new Error(
        "Mobile money network is required."
      );
    }

    if (
      !mobileMoney.phone_number
    ) {
      throw new Error(
        "Mobile money phone number is required."
      );
    }

    const mobilePhone =
      normalizeCameroonPhone(
        mobileMoney.phone_number
      );

    if (!mobilePhone) {
      throw new Error(
        "Invalid Cameroon mobile money phone number."
      );
    }

    payload = {
      type:
        "mobile_money",

      customer_id:
        customerId,

      mobile_money: {
        country_code:
          mobileMoney.country_code ||
          "237",

        network:
          String(
            mobileMoney.network
          ).trim().toUpperCase(),

        phone_number:
          mobilePhone.number
      }
    };
  }


  // ==========================================================
  // CARD
  // ==========================================================

  else if (
    normalizedType ===
    "card"
  ) {
    const cardDetails =
      details?.card ||
      details ||
      {};

    payload = {
      type:
        "card",

      customer_id:
        customerId,

      card:
        cardDetails
    };
  }


  // ==========================================================
  // OTHER METHODS
  // ==========================================================

  else {
    payload = {
      type:
        normalizedType,

      customer_id:
        customerId,

      ...(details || {})
    };
  }


  try {
    const response =
      await axios.post(
        `${FLW_BASE_URL}/payment-methods`,
        payload,
        {
          headers,
          timeout: 30000
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      "FLUTTERWAVE CREATE PAYMENT METHOD ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    throw error;
  }
}


// ============================================================
// CREATE CHARGE
// ============================================================
//
// POST /charges
//
// Required:
//
//   amount
//   currency
//   reference
//   customer_id
//   payment_method_id
//
// ============================================================

async function createCharge({
  amount,
  currency,
  reference,
  customerId,
  paymentMethodId,
  redirectUrl,
  meta,
  idempotencyKey
}) {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount < 0.01
  ) {
    throw new Error(
      "A valid charge amount is required."
    );
  }

  if (!currency) {
    throw new Error(
      "Charge currency is required."
    );
  }

  if (!reference) {
    throw new Error(
      "Charge reference is required."
    );
  }

  const cleanReference =
    String(reference)
      .trim();

  // Flutterwave V4 reference:
  // 6 - 42 characters
  // letters, numbers and hyphens only
  if (
    cleanReference.length < 6 ||
    cleanReference.length > 42
  ) {
    throw new Error(
      "Charge reference must be between 6 and 42 characters."
    );
  }

  if (
    !/^[a-zA-Z0-9-]+$/.test(
      cleanReference
    )
  ) {
    throw new Error(
      "Charge reference can only contain letters, numbers and hyphens."
    );
  }

  if (!customerId) {
    throw new Error(
      "Flutterwave customer ID is required."
    );
  }

  if (!paymentMethodId) {
    throw new Error(
      "Flutterwave payment method ID is required."
    );
  }

  const headers =
    await getHeaders({
      idempotency: true,

      idempotencyKey,

      idempotencyPrefix:
        "BUSGOCHARGE"
    });

  const payload = {
    amount:
      numericAmount,

    currency:
      String(currency)
        .trim()
        .toUpperCase(),

    reference:
      cleanReference,

    customer_id:
      customerId,

    payment_method_id:
      paymentMethodId
  };


  // ----------------------------------------------------------
  // REDIRECT URL
  // ----------------------------------------------------------

  if (redirectUrl) {
    payload.redirect_url =
      String(redirectUrl)
        .trim();
  }


  // ----------------------------------------------------------
  // METADATA
  // ----------------------------------------------------------

  if (
    meta &&
    typeof meta ===
      "object" &&
    !Array.isArray(meta)
  ) {
    payload.meta =
      meta;
  }


  try {
    const response =
      await axios.post(
        `${FLW_BASE_URL}/charges`,
        payload,
        {
          headers,
          timeout: 30000
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      "FLUTTERWAVE CREATE CHARGE ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    throw error;
  }
}


// ============================================================
// GET CHARGE BY ID
// ============================================================
//
// GET /charges/:id
//
// ============================================================

async function getCharge(
  chargeId
) {
  if (!chargeId) {
    throw new Error(
      "Flutterwave charge ID is required."
    );
  }

  const headers =
    await getHeaders();

  try {
    const response =
      await axios.get(
        `${FLW_BASE_URL}/charges/${encodeURIComponent(
          chargeId
        )}`,
        {
          headers,
          timeout: 30000
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      "FLUTTERWAVE GET CHARGE ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    throw error;
  }
}


// ============================================================
// GET CHARGES BY REFERENCE
// ============================================================
//
// GET /charges?reference=...
//
// Flutterwave V4 supports filtering charges by reference.
//
// ============================================================

async function getChargesByReference(
  reference
) {
  if (!reference) {
    throw new Error(
      "Transaction reference is required."
    );
  }

  const headers =
    await getHeaders();

  try {
    const response =
      await axios.get(
        `${FLW_BASE_URL}/charges`,
        {
          params: {
            reference:
              String(reference)
                .trim()
          },

          headers,

          timeout: 30000
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      "FLUTTERWAVE GET CHARGES BY REFERENCE ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    throw error;
  }
}


// ============================================================
// NORMALIZE FLUTTERWAVE RESPONSE
// ============================================================
//
// Flutterwave responses normally look like:
//
// {
//   status: "success",
//   message: "...",
//   data: {...}
// }
//
// ============================================================

function extractResponseData(
  response
) {
  if (
    response &&
    Object.prototype.hasOwnProperty.call(
      response,
      "data"
    )
  ) {
    return response.data;
  }

  return response;
}


// ============================================================
// CHECK WHETHER A CHARGE IS SUCCESSFUL
// ============================================================
//
// Flutterwave V4 charge statuses include:
//
//   succeeded
//   pending
//   failed
//   voided
//
// ============================================================

function isChargeSuccessful(
  response
) {
  const data =
    extractResponseData(
      response
    );

  return (
    data?.status ===
    "succeeded"
  );
}


// ============================================================
// CHECK WHETHER A CHARGE IS PENDING
// ============================================================

function isChargePending(
  response
) {
  const data =
    extractResponseData(
      response
    );

  return (
    data?.status ===
    "pending"
  );
}


// ============================================================
// GET BASE URL
// ============================================================

function getBaseUrl() {
  return FLW_BASE_URL;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getAccessToken,

  createCustomer,

  createPaymentMethod,

  createCharge,

  getCharge,

  getChargesByReference,

  extractResponseData,

  isChargeSuccessful,

  isChargePending,

  getBaseUrl,

  createIdempotencyKey
};
