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
// - All Flutterwave requests happen from the backend.
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

function getConfig() {
  return {
    clientId:
      String(process.env.FLW_CLIENT_ID || "").trim(),

    clientSecret:
      String(process.env.FLW_CLIENT_SECRET || "").trim(),

    baseUrl:
      String(
        process.env.FLW_BASE_URL ||
          "https://developersandbox-api.flutterwave.com"
      ).replace(/\/+$/, ""),

    tokenUrl:
      String(
        process.env.FLW_TOKEN_URL ||
          "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token"
      ).trim()
  };
}


// ============================================================
// VALIDATE CONFIGURATION
// ============================================================

function validateCredentials() {
  const {
    clientId,
    clientSecret,
    baseUrl,
    tokenUrl
  } = getConfig();

  if (!clientId) {
    throw new Error(
      "FLW_CLIENT_ID is not configured."
    );
  }

  if (!clientSecret) {
    throw new Error(
      "FLW_CLIENT_SECRET is not configured."
    );
  }

  return {
    clientId,
    clientSecret,
    baseUrl,
    tokenUrl
  };
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
// Flutterwave V4 uses OAuth 2.0 client credentials:
//
// client_id
// client_secret
// grant_type=client_credentials
//
// Access tokens are cached and refreshed before expiry.
// ============================================================

async function getAccessToken() {
  const {
    clientId,
    clientSecret,
    tokenUrl
  } = validateCredentials();

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
      tokenUrl,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type:
          "client_credentials"
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

  if (
    normalized.startsWith("+")
  ) {
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
      String(email).trim()
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
    const {
      baseUrl
    } = validateCredentials();

    const response =
      await axios.post(
        `${baseUrl}/customers`,
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
// Supported BusGo methods:
//
//   mobile_money
//   card
//
// Flutterwave V4:
//
// POST /payment-methods
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
          mobilePhone.country_code ||
          "237",

        network:
          String(
            mobileMoney.network
          )
            .trim()
            .toUpperCase(),

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

    if (
      !cardDetails.encrypted_card_number ||
      !cardDetails.encrypted_expiry_month ||
      !cardDetails.encrypted_expiry_year ||
      !cardDetails.encrypted_cvv ||
      !cardDetails.nonce
    ) {
      throw new Error(
        "Encrypted card details are required."
      );
    }

    payload = {
      type:
        "card",

      customer_id:
        customerId,

      card: {
        encrypted_card_number:
          cardDetails.encrypted_card_number,

        encrypted_expiry_month:
          cardDetails.encrypted_expiry_month,

        encrypted_expiry_year:
          cardDetails.encrypted_expiry_year,

        encrypted_cvv:
          cardDetails.encrypted_cvv,

        nonce:
          cardDetails.nonce
      }
    };
  }


  // ==========================================================
  // OTHER PAYMENT METHODS
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
    const {
      baseUrl
    } = validateCredentials();

    const response =
      await axios.post(
        `${baseUrl}/payment-methods`,
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

async function createCharge({
  amount,
  currency,
  reference,
  customerId,
  paymentMethodId,
  redirectUrl,
  meta,
  idempotencyKey,
  scenarioKey
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

  // ----------------------------------------------------------
  // OPTIONAL SANDBOX SCENARIO
  // ----------------------------------------------------------

  if (scenarioKey) {
    headers[
      "X-Scenario-Key"
    ] = scenarioKey;
  }

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
    const {
      baseUrl
    } = validateCredentials();

    const response =
      await axios.post(
        `${baseUrl}/charges`,
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
    const {
      baseUrl
    } = validateCredentials();

    const response =
      await axios.get(
        `${baseUrl}/charges/${encodeURIComponent(
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
    const {
      baseUrl
    } = validateCredentials();

    const response =
      await axios.get(
        `${baseUrl}/charges`,
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
// CHECK WHETHER CHARGE IS SUCCESSFUL
// ============================================================

function isChargeSuccessful(
  response
) {
  const data =
    extractResponseData(
      response
    );

  return (
    String(
      data?.status || ""
    ).toLowerCase() ===
    "succeeded"
  );
}


// ============================================================
// CHECK WHETHER CHARGE IS PENDING
// ============================================================

function isChargePending(
  response
) {
  const data =
    extractResponseData(
      response
    );

  return (
    String(
      data?.status || ""
    ).toLowerCase() ===
    "pending"
  );
}


// ============================================================
// GET BASE URL
// ============================================================

function getBaseUrl() {
  return getConfig().baseUrl;
}


// ============================================================
// GET CONFIGURATION STATUS
// ============================================================
//
// Does NOT expose secrets.
// Useful for debugging the backend.
// ============================================================

function getConfigurationStatus() {
  const {
    clientId,
    clientSecret,
    baseUrl,
    tokenUrl
  } = getConfig();

  return {
    clientIdConfigured:
      Boolean(clientId),

    clientSecretConfigured:
      Boolean(clientSecret),

    baseUrl,

    tokenUrl
  };
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

  getConfigurationStatus,

  createIdempotencyKey
};