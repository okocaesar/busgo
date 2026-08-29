const db = require("../config/database");
const crypto = require("crypto");

const {
  createCustomer,
  createPaymentMethod,
  createCharge,
  getCharge,
  getAccessToken
} = require("../services/flutterwaveService");

const axios = require("axios");

// ============================================================
// BUSGO PAYMENT CONTROLLER
// ============================================================
//
// Flutterwave V4 General Payment Flow:
//
// 1. Authenticate BusGo user
// 2. Validate booking
// 3. Validate amount
// 4. Prevent duplicate payment
// 5. Create Flutterwave customer
// 6. Create Flutterwave payment method
// 7. Create Flutterwave charge
// 8. Save BusGo payment as Pending
// 9. Return next_action to frontend
//
// Final payment status is determined by Flutterwave.
// The frontend MUST NOT be trusted to mark a payment
// successful.
// ============================================================


// ============================================================
// NORMALIZE CAMEROON PHONE NUMBER
// ============================================================

function normalizeCameroonPhone(phone) {
  if (!phone) {
    return "";
  }

  let value = String(phone)
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  // +237681234567
  if (value.startsWith("+")) {
    value = value.substring(1);
  }

  // 681234567
  if (/^6\d{8}$/.test(value)) {
    value = `237${value}`;
  }

  return value;
}


// ============================================================
// GET AUTHENTICATED USER DETAILS
// ============================================================

function getAuthenticatedUserDetails(
  userId,
  callback
) {
  const sql = `
    SELECT
      id,
      name,
      email,
      phone
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [userId],
    (error, results) => {
      if (error) {
        console.error(
          "GET USER FOR PAYMENT ERROR:",
          error
        );

        return callback(
          error,
          null
        );
      }

      if (
        !results ||
        results.length === 0
      ) {
        return callback(
          null,
          null
        );
      }

      callback(
        null,
        results[0]
      );
    }
  );
}


// ============================================================
// CREATE BUSGO TRANSACTION REFERENCE
// ============================================================
//
// Flutterwave V4 requires a unique reference.
// The reference must be 6-42 characters and contain
// alphanumeric characters and hyphens.
//
// Example:
// BUSGO-1756382345678-A4F82C1D
// ============================================================

function createTransactionReference() {
  return (
    "BUSGO-" +
    Date.now() +
    "-" +
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
  );
}


// ============================================================
// DETERMINE FLUTTERWAVE NETWORK
// ============================================================

function getFlutterwaveNetwork(
  paymentMethod
) {
  const method =
    String(
      paymentMethod || ""
    )
      .trim()
      .toLowerCase();

  if (
    method.includes("mtn")
  ) {
    return "MTN";
  }

  if (
    method.includes("orange")
  ) {
    return "ORANGEMONEY";
  }

  return null;
}


// ============================================================
// BUILD PAYMENT METHOD
// ============================================================

function buildPaymentMethod({
  paymentMethod,
  phoneNumber,
  card
}) {
  const method =
    String(
      paymentMethod || ""
    )
      .trim()
      .toLowerCase();

  // ==========================================================
  // MTN MOBILE MONEY
  // ==========================================================

  if (
    method ===
      "mtn mobile money" ||
    method === "mtn" ||
    method.includes("mtn")
  ) {
    return {
      type: "mobile_money",

      mobile_money: {
        country_code: "237",

        network: "MTN",

        phone_number:
          normalizeCameroonPhone(
            phoneNumber
          )
      }
    };
  }


  // ==========================================================
  // ORANGE MONEY
  // ==========================================================

  if (
    method === "orange money" ||
    method === "orange" ||
    method.includes("orange")
  ) {
    return {
      type: "mobile_money",

      mobile_money: {
        country_code: "237",

        network: "ORANGEMONEY",

        phone_number:
          normalizeCameroonPhone(
            phoneNumber
          )
      }
    };
  }


  // ==========================================================
  // BANK CARD
  // ==========================================================

  if (
    method === "bank card" ||
    method === "card" ||
    method.includes("card")
  ) {
    return {
      type: "card",

      card:
        card || null
    };
  }


  return null;
}


// ============================================================
// CREATE PAYMENT
// POST /api/payments
// ============================================================

exports.createPayment = async (
  req,
  res
) => {
  try {
    const {
      userId,
      bookingId,
      amount,
      currency,
      paymentMethod,
      phoneNumber,
      card
    } = req.body || {};


    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const authenticatedUserId =
      req.user?.id;

    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Please login first."
      });
    }


    // ========================================================
    // USER OWNERSHIP
    // ========================================================

    const finalUserId =
      userId ||
      authenticatedUserId;

    if (
      Number(finalUserId) !==
      Number(authenticatedUserId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to create a payment for another user."
      });
    }


    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required."
      });
    }

    if (
      !amount ||
      !Number.isFinite(
        Number(amount)
      ) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid payment amount is required."
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Payment method is required."
      });
    }


    const paymentAmount =
      Number(amount);

    const paymentCurrency =
      String(
        currency || "XAF"
      ).toUpperCase();


    // ========================================================
    // BUSGO CURRENCY
    // ========================================================

    if (
      paymentCurrency !== "XAF"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "BusGo payments currently use XAF currency."
      });
    }


    // ========================================================
    // BUILD PAYMENT METHOD
    // ========================================================

    const paymentMethodObject =
      buildPaymentMethod({
        paymentMethod,
        phoneNumber,
        card
      });

    if (!paymentMethodObject) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported payment method."
      });
    }


    // ========================================================
    // CARD VALIDATION
    // ========================================================

    if (
      paymentMethodObject.type ===
      "card"
    ) {
      const cardDetails =
        paymentMethodObject.card;

      if (
        !cardDetails ||
        typeof cardDetails !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Card details are required."
        });
      }

      const requiredCardFields = [
        "encrypted_card_number",
        "encrypted_expiry_month",
        "encrypted_expiry_year",
        "encrypted_cvv",
        "nonce"
      ];

      const missingCardField =
        requiredCardFields.find(
          (field) =>
            !cardDetails[field]
        );

      if (missingCardField) {
        return res.status(400).json({
          success: false,
          message:
            "Incomplete card payment information."
        });
      }
    }


    // ========================================================
    // MOBILE MONEY VALIDATION
    // ========================================================

    if (
      paymentMethodObject.type ===
      "mobile_money"
    ) {
      const normalizedPhone =
        normalizeCameroonPhone(
          phoneNumber
        );

      if (
        !/^2376\d{8}$/.test(
          normalizedPhone
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid Cameroon mobile money number."
        });
      }

      paymentMethodObject
        .mobile_money
        .phone_number =
        normalizedPhone;
    }


    // ========================================================
    // VERIFY BOOKING
    // ========================================================

    const bookingSql = `
      SELECT
        id,
        user_id,
        ticket_number,
        total_payment,
        booking_status
      FROM bookings
      WHERE id = ?
      AND user_id = ?
      LIMIT 1
    `;

    db.query(
      bookingSql,
      [
        bookingId,
        authenticatedUserId
      ],
      async (
        bookingError,
        bookings
      ) => {

        if (bookingError) {
          console.error(
            "VERIFY BOOKING FOR PAYMENT ERROR:",
            bookingError
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to verify the booking."
          });
        }


        if (
          !bookings ||
          bookings.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Booking not found."
          });
        }


        const booking =
          bookings[0];


        // ====================================================
        // CHECK BOOKING AMOUNT
        // ====================================================

        const bookingAmount =
          Number(
            booking.total_payment
          );

        if (
          !Number.isFinite(
            bookingAmount
          ) ||
          Math.abs(
            bookingAmount -
              paymentAmount
          ) > 0.01
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Payment amount does not match the booking total."
          });
        }


        // ====================================================
        // CHECK BOOKING STATUS
        // ====================================================

        if (
          booking.booking_status ===
            "Cancelled" ||
          booking.booking_status ===
            "Completed"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This booking cannot receive a payment."
          });
        }


        // ====================================================
        // PREVENT DUPLICATE PAYMENTS
        // ====================================================

        const existingPaymentSql = `
          SELECT
            id,
            transaction_id,
            amount,
            currency,
            payment_method,
            status,
            payment_date,
            created_at
          FROM payments
          WHERE booking_id = ?
          AND user_id = ?
          ORDER BY id DESC
          LIMIT 1
        `;

        db.query(
          existingPaymentSql,
          [
            bookingId,
            authenticatedUserId
          ],
          async (
            existingError,
            existingPayments
          ) => {

            if (existingError) {
              console.error(
                "CHECK EXISTING PAYMENT ERROR:",
                existingError
              );

              return res.status(500).json({
                success: false,
                message:
                  "Unable to check existing payment."
              });
            }


            if (
              existingPayments &&
              existingPayments.length > 0
            ) {

              const existingPayment =
                existingPayments[0];


              if (
                existingPayment.status ===
                "Successful"
              ) {
                return res.status(409).json({
                  success: false,
                  message:
                    "This booking has already been paid for.",
                  payment:
                    existingPayment
                });
              }


              if (
                existingPayment.status ===
                "Pending"
              ) {
                return res.status(409).json({
                  success: false,
                  message:
                    "A payment is already pending for this booking.",
                  payment:
                    existingPayment
                });
              }
            }


            // ==================================================
            // GET USER
            // ==================================================

            getAuthenticatedUserDetails(
              authenticatedUserId,
              async (
                userError,
                user
              ) => {

                if (userError) {
                  return res.status(500).json({
                    success: false,
                    message:
                      "Unable to load your account information."
                  });
                }


                if (!user) {
                  return res.status(404).json({
                    success: false,
                    message:
                      "User account not found."
                  });
                }


                // ==================================================
                // CUSTOMER DETAILS
                // ==================================================

                const customerEmail =
                  user.email ||
                  req.user?.email;

                if (!customerEmail) {
                  return res.status(400).json({
                    success: false,
                    message:
                      "Your account must have an email address before payment."
                  });
                }


                const customerName =
                  user.name ||
                  req.user?.name ||
                  "BusGo Customer";


                const customerPhone =
                  normalizeCameroonPhone(
                    phoneNumber ||
                      user.phone ||
                      req.user?.phone
                  );


                // ==================================================
                // TRANSACTION REFERENCE
                // ==================================================

                const transactionId =
                  createTransactionReference();


                try {

                  // ==============================================
                  // CREATE FLUTTERWAVE CUSTOMER
                  // ==============================================

                  const customerResponse =
                    await createCustomer({
                      email:
                        customerEmail,

                      name:
                        customerName,

                      phone:
                        customerPhone ||
                        undefined,

                      idempotencyKey:
                        `BUSGO-CUSTOMER-${transactionId}`
                    });


                  const customer =
                    customerResponse?.data ||
                    customerResponse;


                  const customerId =
                    customer?.id;


                  if (!customerId) {
                    throw new Error(
                      "Flutterwave customer creation did not return a customer ID."
                    );
                  }


                  // ==============================================
                  // CREATE PAYMENT METHOD
                  // ==============================================

                  const paymentMethodResponse =
                    await createPaymentMethod({
                      type:
                        paymentMethodObject.type,

                      details:
                        paymentMethodObject,

                      customerId,

                      idempotencyKey:
                        `BUSGO-PM-${transactionId}`
                    });


                  const createdPaymentMethod =
                    paymentMethodResponse?.data ||
                    paymentMethodResponse;


                  const paymentMethodId =
                    createdPaymentMethod?.id;


                  if (!paymentMethodId) {
                    throw new Error(
                      "Flutterwave payment method creation did not return an ID."
                    );
                  }


                  // ==============================================
                  // REDIRECT URL
                  // ==============================================

                  const frontendUrl =
                    String(
                      process.env.FRONTEND_URL ||
                        ""
                    ).replace(
                      /\/+$/,
                      ""
                    );


                  const redirectUrl =
                    process.env.FLW_REDIRECT_URL ||
                    (
                      frontendUrl
                        ? `${frontendUrl}/payment/callback`
                        : undefined
                    );


                  // ==============================================
                  // CREATE CHARGE
                  // ==============================================

                  const chargeResponse =
                    await createCharge({
                      amount:
                        paymentAmount,

                      currency:
                        paymentCurrency,

                      reference:
                        transactionId,

                      customerId,

                      paymentMethodId,

                      redirectUrl,

                      idempotencyKey:
                        `BUSGO-CHARGE-${transactionId}`,

                      meta: {
                        busgo_booking_id:
                          String(
                            bookingId
                          ),

                        busgo_user_id:
                          String(
                            authenticatedUserId
                          ),

                        ticket_number:
                          booking.ticket_number ||
                          null
                      }
                    });


                  const charge =
                    chargeResponse?.data ||
                    chargeResponse;


                  const chargeId =
                    charge?.id ||
                    null;


                  const chargeStatus =
                    String(
                      charge?.status ||
                        chargeResponse?.status ||
                        "pending"
                    ).toLowerCase();


                  // ==================================================
                  // SAVE PAYMENT AS PENDING
                  // ==================================================

                  const insertPaymentSql = `
                    INSERT INTO payments (
                      user_id,
                      booking_id,
                      transaction_id,
                      amount,
                      currency,
                      payment_method,
                      status,
                      phone_number,
                      payment_date,
                      created_at,
                      updated_at
                    )
                    VALUES (
                      ?,
                      ?,
                      ?,
                      ?,
                      ?,
                      ?,
                      'Pending',
                      ?,
                      NULL,
                      NOW(),
                      NOW()
                    )
                  `;


                  db.query(
                    insertPaymentSql,
                    [
                      authenticatedUserId,

                      bookingId,

                      transactionId,

                      paymentAmount,

                      paymentCurrency,

                      paymentMethod,

                      customerPhone ||
                        null
                    ],
                    (
                      insertError,
                      result
                    ) => {

                      if (insertError) {
                        console.error(
                          "SAVE PENDING PAYMENT ERROR:",
                          insertError
                        );

                        return res.status(500).json({
                          success: false,
                          message:
                            "Flutterwave payment was created, but BusGo could not save the payment."
                        });
                      }


                      // ==========================================
                      // RESPONSE
                      // ==========================================

                      return res.status(201).json({
                        success: true,

                        message:
                          "Payment initialized. Please complete the payment.",

                        paymentId:
                          result.insertId,

                        transactionId,

                        bookingId,

                        amount:
                          paymentAmount,

                        currency:
                          paymentCurrency,

                        paymentMethod,

                        status:
                          "Pending",

                        flutterwave: {
                          customerId,

                          paymentMethodId,

                          chargeId,

                          status:
                            chargeStatus,

                          nextAction:
                            charge?.next_action ||
                            charge?.nextAction ||
                            null,

                          data:
                            charge
                        }
                      });
                    }
                  );

                } catch (
                  flutterwaveError
                ) {

                  console.error(
                    "FLUTTERWAVE PAYMENT ERROR:",
                    flutterwaveError.response?.data ||
                      flutterwaveError.message ||
                      flutterwaveError
                  );


                  const flutterwaveMessage =
                    flutterwaveError
                      ?.response
                      ?.data
                      ?.message ||
                    flutterwaveError?.message ||
                    "Unable to initialize Flutterwave payment.";


                  return res.status(502).json({
                    success: false,

                    message:
                      "Unable to initialize Flutterwave payment.",

                    error:
                      flutterwaveMessage,

                    flutterwave:
                      flutterwaveError
                        ?.response
                        ?.data ||
                      null
                  });
                }
              }
            );
          }
        );
      }
    );

  } catch (error) {

    console.error(
      "CREATE PAYMENT UNEXPECTED ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to initialize payment."
    });
  }
};


// ============================================================
// VERIFY FLUTTERWAVE PAYMENT
// POST /api/payments/verify
// ============================================================
//
// The frontend sends the BusGo transaction reference.
//
// BusGo then:
//
// 1. Finds its own Pending payment
// 2. Finds the matching Flutterwave charge
// 3. Checks reference
// 4. Checks amount
// 5. Checks currency
// 6. Checks Flutterwave status
// 7. Marks BusGo payment Successful only when
//    Flutterwave reports "succeeded"
// 8. Confirms the booking
//
// Flutterwave V4 uses "succeeded" as the successful
// charge status.
// ============================================================

exports.verifyPayment = async (
  req,
  res
) => {

  try {

    const {
      transactionId
    } = req.body || {};


    const userId =
      req.user?.id;


    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Please login first."
      });
    }


    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID is required."
      });
    }


    // ========================================================
    // FIND BUSGO PAYMENT
    // ========================================================

    const findPaymentSql = `
      SELECT
        id,
        user_id,
        booking_id,
        transaction_id,
        amount,
        currency,
        payment_method,
        status,
        phone_number
      FROM payments
      WHERE transaction_id = ?
      AND user_id = ?
      LIMIT 1
    `;


    db.query(
      findPaymentSql,
      [
        transactionId,
        userId
      ],
      async (
        findError,
        payments
      ) => {

        if (findError) {
          console.error(
            "FIND PAYMENT FOR VERIFICATION ERROR:",
            findError
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to find payment."
          });
        }


        if (
          !payments ||
          payments.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Payment not found."
          });
        }


        const payment =
          payments[0];


        // ======================================================
        // ALREADY SUCCESSFUL
        // ======================================================

        if (
          payment.status ===
          "Successful"
        ) {
          return res.status(200).json({
            success: true,

            message:
              "Payment has already been verified successfully.",

            status:
              "Successful",

            paymentId:
              payment.id,

            bookingId:
              payment.booking_id,

            transactionId:
              payment.transaction_id,

            amount:
              payment.amount,

            currency:
              payment.currency
          });
        }


        try {

          // ====================================================
          // GET FLUTTERWAVE CHARGE BY REFERENCE
          // ====================================================

          const verifyResponse =
            await getChargeByReference(
              transactionId
            );


          const flutterwaveData =
            verifyResponse?.data;


          let flutterwaveCharge =
            null;


          // ----------------------------------------------------
          // API returns an array
          // ----------------------------------------------------

          if (
            Array.isArray(
              flutterwaveData
            )
          ) {

            if (
              flutterwaveData.length >
              0
            ) {
              flutterwaveCharge =
                flutterwaveData[0];
            }
          }


          // ----------------------------------------------------
          // API returns an object
          // ----------------------------------------------------

          else if (
            flutterwaveData &&
            typeof flutterwaveData ===
              "object"
          ) {

            flutterwaveCharge =
              flutterwaveData;
          }


          // ----------------------------------------------------
          // Fallback
          // ----------------------------------------------------

          if (
            !flutterwaveCharge &&
            verifyResponse &&
            verifyResponse.id
          ) {
            flutterwaveCharge =
              verifyResponse;
          }


          if (
            !flutterwaveCharge
          ) {
            return res.status(404).json({
              success: false,

              message:
                "Flutterwave charge could not be found yet.",

              status:
                "Pending",

              transactionId
            });
          }


          // ====================================================
          // VERIFY REFERENCE
          // ====================================================

          const flutterwaveReference =
            String(
              flutterwaveCharge.reference ||
                ""
            );


          if (
            flutterwaveReference !==
            String(transactionId)
          ) {

            console.error(
              "FLUTTERWAVE REFERENCE MISMATCH:",
              {
                expected:
                  transactionId,

                received:
                  flutterwaveReference
              }
            );

            return res.status(400).json({
              success: false,

              message:
                "Flutterwave transaction reference does not match the BusGo payment."
            });
          }


          // ====================================================
          // VERIFY AMOUNT
          // ====================================================

          const flutterwaveAmount =
            Number(
              flutterwaveCharge.amount
            );


          const busgoAmount =
            Number(
              payment.amount
            );


          if (
            !Number.isFinite(
              flutterwaveAmount
            ) ||
            Math.abs(
              flutterwaveAmount -
                busgoAmount
            ) > 0.01
          ) {
            return res.status(400).json({
              success: false,

              message:
                "Flutterwave payment amount does not match the BusGo payment amount."
            });
          }


          // ====================================================
          // VERIFY CURRENCY
          // ====================================================

          const flutterwaveCurrency =
            String(
              flutterwaveCharge.currency ||
                ""
            ).toUpperCase();


          const busgoCurrency =
            String(
              payment.currency ||
                "XAF"
            ).toUpperCase();


          if (
            flutterwaveCurrency !==
            busgoCurrency
          ) {
            return res.status(400).json({
              success: false,

              message:
                "Flutterwave payment currency does not match the BusGo payment."
            });
          }


          // ====================================================
          // GET FLUTTERWAVE STATUS
          // ====================================================

          const flutterwaveStatus =
            String(
              flutterwaveCharge.status ||
                ""
            ).toLowerCase();


          // ====================================================
          // SUCCESS
          // ====================================================

          if (
            flutterwaveStatus ===
              "succeeded" ||
            flutterwaveStatus ===
              "successful" ||
            flutterwaveStatus ===
              "completed"
          ) {

            return markPaymentSuccessful({
              payment,

              flutterwaveCharge,

              res
            });
          }


          // ====================================================
          // FAILED
          // ====================================================

          if (
            flutterwaveStatus ===
              "failed" ||
            flutterwaveStatus ===
              "cancelled" ||
            flutterwaveStatus ===
              "voided"
          ) {

            const updateSql = `
              UPDATE payments
              SET
                status = 'Failed',
                updated_at = NOW()
              WHERE id = ?
              AND user_id = ?
              AND status = 'Pending'
            `;


            db.query(
              updateSql,
              [
                payment.id,
                userId
              ],
              (
                updateError
              ) => {

                if (updateError) {
                  console.error(
                    "UPDATE FAILED PAYMENT ERROR:",
                    updateError
                  );

                  return res.status(500).json({
                    success: false,

                    message:
                      "Flutterwave payment failed, but BusGo could not update the payment."
                  });
                }


                return res.status(200).json({
                  success: false,

                  message:
                    "Flutterwave payment failed.",

                  status:
                    "Failed",

                  transactionId
                });
              }
            );

            return;
          }


          // ====================================================
          // STILL PROCESSING
          // ====================================================

          return res.status(200).json({
            success: false,

            message:
              "Payment is still pending.",

            status:
              "Pending",

            transactionId,

            flutterwaveStatus,

            nextAction:
              flutterwaveCharge.next_action ||
              flutterwaveCharge.nextAction ||
              null
          });

        } catch (
          verificationError
        ) {

          console.error(
            "FLUTTERWAVE VERIFICATION ERROR:",
            verificationError.response?.data ||
              verificationError.message ||
              verificationError
          );

          return res.status(502).json({
            success: false,

            message:
              "Unable to verify the Flutterwave payment.",

            error:
              verificationError
                ?.response
                ?.data ||
              null
          });
        }
      }
    );

  } catch (error) {

    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to verify payment."
    });
  }
};


// ============================================================
// FIND CHARGE BY REFERENCE
// ============================================================
//
// Flutterwave V4:
//
// GET /charges?reference=<reference>
//
// BusGo stores the Flutterwave reference in
// payments.transaction_id.
// ============================================================

async function getChargeByReference(
  reference
) {

  const token =
    await getAccessToken();


  const baseUrl =
    String(
      process.env.FLW_BASE_URL ||
        "https://developersandbox-api.flutterwave.com"
    ).replace(
      /\/+$/,
      ""
    );


  const response =
    await axios.get(
      `${baseUrl}/charges`,
      {
        params: {
          reference
        },

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "X-Trace-Id":
            crypto.randomUUID()
        },

        timeout: 30000
      }
    );


  return response.data;
}


// ============================================================
// MARK PAYMENT SUCCESSFUL
// ============================================================
//
// Only called after Flutterwave has been independently
// verified.
// ============================================================

function markPaymentSuccessful({
  payment,
  flutterwaveCharge,
  res
}) {

  const updatePaymentSql = `
    UPDATE payments
    SET
      status = 'Successful',
      payment_date = NOW(),
      updated_at = NOW()
    WHERE id = ?
    AND user_id = ?
    AND status <> 'Successful'
  `;


  db.query(
    updatePaymentSql,
    [
      payment.id,
      payment.user_id
    ],
    (
      updateError,
      updateResult
    ) => {

      if (updateError) {
        console.error(
          "MARK PAYMENT SUCCESSFUL ERROR:",
          updateError
        );

        return res.status(500).json({
          success: false,

          message:
            "Payment was verified but BusGo could not update the payment."
        });
      }


      // ======================================================
      // UPDATE BOOKING
      // ======================================================

      const updateBookingSql = `
        UPDATE bookings
        SET
          booking_status = 'Confirmed'
        WHERE id = ?
        AND user_id = ?
      `;


      db.query(
        updateBookingSql,
        [
          payment.booking_id,
          payment.user_id
        ],
        (
          bookingError
        ) => {

          if (bookingError) {
            console.error(
              "UPDATE BOOKING AFTER PAYMENT ERROR:",
              bookingError
            );
          }


          // ==================================================
          // SOCKET NOTIFICATION
          // ==================================================

          try {

            const io =
              res.app.get("io");


            if (io) {

              io.to(
                `user_${payment.user_id}`
              ).emit(
                "payment-success",
                {
                  paymentId:
                    payment.id,

                  bookingId:
                    payment.booking_id,

                  transactionId:
                    payment.transaction_id,

                  amount:
                    payment.amount,

                  currency:
                    payment.currency,

                  status:
                    "Successful"
                }
              );
            }

          } catch (
            socketError
          ) {

            console.error(
              "PAYMENT SOCKET NOTIFICATION ERROR:",
              socketError
            );
          }


          return res.status(200).json({

            success: true,

            message:
              "Payment verified successfully.",

            status:
              "Successful",

            paymentId:
              payment.id,

            bookingId:
              payment.booking_id,

            transactionId:
              payment.transaction_id,

            amount:
              payment.amount,

            currency:
              payment.currency,

            flutterwave:
              flutterwaveCharge
          });
        }
      );
    }
  );
}


// ============================================================
// GET MY PAYMENTS
// GET /api/payments/my-payments
// ============================================================

exports.getMyPayments = (
  req,
  res
) => {

  const userId =
    req.user?.id;


  if (!userId) {
    return res.status(401).json({
      success: false,

      message:
        "Please login first."
    });
  }


  const sql = `
    SELECT
      payments.id,
      payments.user_id,
      payments.booking_id,
      payments.transaction_id,
      payments.amount,
      payments.currency,
      payments.payment_method,
      payments.status,
      payments.phone_number,
      payments.payment_date,
      payments.created_at,
      payments.updated_at,
      payments.reversal_requested_at,
      payments.reversed_at,
      payments.reversal_reason,
      payments.reversal_processed_by,

      bookings.ticket_number,
      bookings.booking_status,

      routes.departure,
      routes.destination,
      routes.departure_date

    FROM payments

    LEFT JOIN bookings
      ON payments.booking_id =
        bookings.id

    LEFT JOIN routes
      ON bookings.route_id =
        routes.id

    WHERE payments.user_id = ?

    ORDER BY
      payments.created_at DESC
  `;


  db.query(
    sql,
    [userId],
    (
      err,
      results
    ) => {

      if (err) {
        console.error(
          "GET MY PAYMENTS ERROR:",
          err
        );

        return res.status(500).json({
          success: false,

          message:
            "Unable to load your payment history."
        });
      }


      return res.status(200).json({
        success: true,

        payments:
          results || []
      });
    }
  );
};


// ============================================================
// REQUEST PAYMENT REVERSAL
// PATCH /api/payments/:paymentId/request-reversal
// ============================================================

exports.requestPaymentReversal = (
  req,
  res
) => {

  const {
    paymentId
  } = req.params;


  const userId =
    req.user?.id;


  if (!userId) {
    return res.status(401).json({
      success: false,

      message:
        "Please login first."
    });
  }


  if (!paymentId) {
    return res.status(400).json({
      success: false,

      message:
        "Payment ID is required."
    });
  }


  const findPaymentSql = `
    SELECT
      id,
      user_id,
      booking_id,
      transaction_id,
      amount,
      currency,
      payment_method,
      status,
      payment_date,
      reversal_requested_at,
      reversed_at
    FROM payments
    WHERE id = ?
    AND user_id = ?
    LIMIT 1
  `;


  db.query(
    findPaymentSql,
    [
      paymentId,
      userId
    ],
    (
      findError,
      payments
    ) => {

      if (findError) {
        console.error(
          "FIND PAYMENT FOR REVERSAL ERROR:",
          findError
        );

        return res.status(500).json({
          success: false,

          message:
            "Unable to find the payment."
        });
      }


      if (
        !payments ||
        payments.length === 0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Payment not found."
        });
      }


      const payment =
        payments[0];


      // ======================================================
      // ALREADY REVERSED
      // ======================================================

      if (
        payment.status ===
        "Reversed"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "This payment has already been reversed."
        });
      }


      // ======================================================
      // ALREADY REQUESTED
      // ======================================================

      if (
        payment.status ===
        "Requested Reversal"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A reversal request has already been submitted for this payment."
        });
      }


      // ======================================================
      // ONLY SUCCESSFUL PAYMENTS
      // ======================================================

      if (
        payment.status !==
        "Successful"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only successful payments can be submitted for reversal."
        });
      }


      // ======================================================
      // REQUEST REVERSAL
      // ======================================================

      const reversalSql = `
        UPDATE payments
        SET
          status =
            'Requested Reversal',

          reversal_requested_at =
            NOW(),

          updated_at =
            NOW()

        WHERE id = ?
        AND user_id = ?
        AND status = 'Successful'
      `;


      db.query(
        reversalSql,
        [
          paymentId,
          userId
        ],
        (
          updateError,
          result
        ) => {

          if (updateError) {
            console.error(
              "REQUEST PAYMENT REVERSAL ERROR:",
              updateError
            );

            return res.status(500).json({
              success: false,

              message:
                "Unable to submit the reversal request."
            });
          }


          if (
            result.affectedRows ===
            0
          ) {
            return res.status(400).json({
              success: false,

              message:
                "The payment could not be submitted for reversal. It may have already been processed."
            });
          }


          return res.status(200).json({

            success: true,

            message:
              "Payment reversal request submitted successfully.",

            paymentId,

            status:
              "Requested Reversal"
          });
        }
      );
    }
  );
};