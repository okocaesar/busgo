
const crypto = require("crypto");
const db = require("../config/database");

const {
  getCharge
} = require("../services/flutterwaveService");

// ============================================================
// FLUTTERWAVE V4 WEBHOOK CONTROLLER
// ============================================================
//
// Webhook flow:
//
// Flutterwave
//      ↓
// POST /api/flutterwave/webhook
//      ↓
// Verify flutterwave-signature
//      ↓
// Read charge.completed event
//      ↓
// Find BusGo payment using transaction reference
//      ↓
// Re-query Flutterwave using charge ID
//      ↓
// Verify:
//   - status
//   - amount
//   - currency
//   - reference
//      ↓
// Update payment
//      ↓
// Confirm booking
//      ↓
// Notify frontend through Socket.IO
//
// IMPORTANT:
// The webhook payload itself is NOT trusted.
// We always verify the charge with Flutterwave first.
// ============================================================


// ============================================================
// VERIFY FLUTTERWAVE WEBHOOK SIGNATURE
// ============================================================

function verifyFlutterwaveSignature(
  rawBody,
  signature
) {
  const secretHash =
    process.env.FLW_SECRET_HASH;

  if (
    !secretHash ||
    !signature ||
    !rawBody
  ) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secretHash
      )
      .update(
        rawBody
      )
      .digest("base64");

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      String(signature),
      "utf8"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}


// ============================================================
// UPDATE PAYMENT + BOOKING
// ============================================================

function finalizeSuccessfulPayment({
  payment,
  flutterwaveCharge,
  res
}) {
  return new Promise(
    (resolve, reject) => {
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
          paymentError,
          paymentResult
        ) => {
          if (paymentError) {
            console.error(
              "WEBHOOK UPDATE PAYMENT ERROR:",
              paymentError
            );

            return reject(
              paymentError
            );
          }

          // --------------------------------------------------
          // Payment was already successful.
          // This makes repeated webhooks safe.
          // --------------------------------------------------

          const paymentAlreadySuccessful =
            paymentResult.affectedRows ===
              0 &&
            payment.status ===
              "Successful";

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
              if (
                bookingError
              ) {
                console.error(
                  "WEBHOOK UPDATE BOOKING ERROR:",
                  bookingError
                );

                return reject(
                  bookingError
                );
              }

              // ------------------------------------------------
              // SOCKET.IO NOTIFICATION
              // ------------------------------------------------

              try {
                const io =
                  res.app.get(
                    "io"
                  );

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
                  "WEBHOOK SOCKET ERROR:",
                  socketError
                );
              }

              resolve({
                paymentAlreadySuccessful,
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
  );
}


// ============================================================
// UPDATE FAILED PAYMENT
// ============================================================

function markPaymentFailed(
  payment
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const sql = `
        UPDATE payments
        SET
          status = 'Failed',
          updated_at = NOW()
        WHERE id = ?
        AND user_id = ?
        AND status = 'Pending'
      `;

      db.query(
        sql,
        [
          payment.id,
          payment.user_id
        ],
        (
          error,
          result
        ) => {
          if (error) {
            return reject(
              error
            );
          }

          resolve(
            result
          );
        }
      );
    }
  );
}


// ============================================================
// FIND BUSGO PAYMENT
// ============================================================

function findPaymentByReference(
  reference
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const sql = `
        SELECT
          id,
          user_id,
          booking_id,
          transaction_id,
          amount,
          currency,
          payment_method,
          status,
          payment_date
        FROM payments
        WHERE transaction_id = ?
        LIMIT 1
      `;

      db.query(
        sql,
        [reference],
        (
          error,
          results
        ) => {
          if (error) {
            return reject(
              error
            );
          }

          resolve(
            results &&
            results.length > 0
              ? results[0]
              : null
          );
        }
      );
    }
  );
}


// ============================================================
// MAIN WEBHOOK
// POST /api/flutterwave/webhook
// ============================================================

exports.handleFlutterwaveWebhook =
  async (
    req,
    res
  ) => {
    try {
      // ======================================================
      // SIGNATURE
      // ======================================================

      const signature =
        req.headers[
          "flutterwave-signature"
        ];

      // Express must provide req.rawBody.
      //
      // We intentionally do NOT use JSON.stringify(req.body)
      // because the signature is generated from the exact raw
      // request body.
      const rawBody =
        req.rawBody;

      if (
        !rawBody ||
        !signature
      ) {
        console.error(
          "FLUTTERWAVE WEBHOOK: Missing raw body or signature."
        );

        return res
          .status(401)
          .send("Unauthorized");
      }

      // ======================================================
      // VERIFY SIGNATURE
      // ======================================================

      const validSignature =
        verifyFlutterwaveSignature(
          rawBody,
          signature
        );

      if (!validSignature) {
        console.error(
          "FLUTTERWAVE WEBHOOK: Invalid signature."
        );

        return res
          .status(401)
          .send("Unauthorized");
      }

      // ======================================================
      // PAYLOAD
      // ======================================================

      const payload =
        req.body || {};

      console.log(
        "FLUTTERWAVE WEBHOOK RECEIVED:",
        {
          id:
            payload.id ||
            payload.webhook_id,

          type:
            payload.type,

          timestamp:
            payload.timestamp
        }
      );

      // ======================================================
      // EVENT TYPE
      // ======================================================

      const eventType =
        String(
          payload.type ||
            ""
        ).toLowerCase();

      // ======================================================
      // ONLY PROCESS CHARGE EVENTS
      // ======================================================

      if (
        eventType !==
        "charge.completed"
      ) {
        // We acknowledge other valid Flutterwave events.
        return res
          .status(200)
          .json({
            received: true,
            processed: false,
            message:
              "Webhook event acknowledged."
          });
      }

      // ======================================================
      // WEBHOOK DATA
      // ======================================================

      const webhookData =
        payload.data || {};

      const chargeId =
        webhookData.id;

      const reference =
        webhookData.reference;

      if (
        !chargeId ||
        !reference
      ) {
        console.error(
          "FLUTTERWAVE WEBHOOK: Missing charge ID or reference."
        );

        return res
          .status(400)
          .json({
            received: false,
            message:
              "Invalid webhook payload."
          });
      }

      // ======================================================
      // FIND BUSGO PAYMENT
      // ======================================================

      const payment =
        await findPaymentByReference(
          reference
        );

      if (!payment) {
        console.warn(
          "FLUTTERWAVE WEBHOOK: BusGo payment not found:",
          reference
        );

        // Acknowledge the webhook so Flutterwave does not
        // repeatedly retry an event belonging to another
        // transaction/reference.
        return res
          .status(200)
          .json({
            received: true,
            processed: false,
            message:
              "Payment reference not found in BusGo."
          });
      }

      // ======================================================
      // ALREADY SUCCESSFUL
      // ======================================================

      if (
        payment.status ===
        "Successful"
      ) {
        return res
          .status(200)
          .json({
            received: true,
            processed: false,
            message:
              "Payment was already processed.",
            status:
              "Successful",
            transactionId:
              payment.transaction_id
          });
      }

      // ======================================================
      // RE-QUERY FLUTTERWAVE
      // ======================================================
      //
      // NEVER trust the webhook payload alone.
      //
      // We retrieve the charge directly from Flutterwave.
      // ======================================================

      const flutterwaveResponse =
        await getCharge(
          chargeId
        );

      const flutterwaveCharge =
        flutterwaveResponse?.data ||
        flutterwaveResponse;

      if (
        !flutterwaveCharge
      ) {
        console.error(
          "FLUTTERWAVE WEBHOOK: Charge verification returned no data."
        );

        return res
          .status(502)
          .json({
            received: false,
            message:
              "Unable to verify Flutterwave charge."
          });
      }

      // ======================================================
      // VERIFY REFERENCE
      // ======================================================

      const flutterwaveReference =
        String(
          flutterwaveCharge.reference ||
            ""
        );

      if (
        flutterwaveReference !==
        String(
          payment.transaction_id
        )
      ) {
        console.error(
          "FLUTTERWAVE WEBHOOK: Reference mismatch."
        );

        return res
          .status(400)
          .json({
            received: false,
            message:
              "Payment reference mismatch."
          });
      }

      // ======================================================
      // VERIFY AMOUNT
      // ======================================================

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
        console.error(
          "FLUTTERWAVE WEBHOOK: Amount mismatch.",
          {
            flutterwaveAmount,
            busgoAmount
          }
        );

        return res
          .status(400)
          .json({
            received: false,
            message:
              "Payment amount mismatch."
          });
      }

      // ======================================================
      // VERIFY CURRENCY
      // ======================================================

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
        console.error(
          "FLUTTERWAVE WEBHOOK: Currency mismatch.",
          {
            flutterwaveCurrency,
            busgoCurrency
          }
        );

        return res
          .status(400)
          .json({
            received: false,
            message:
              "Payment currency mismatch."
          });
      }

      // ======================================================
      // VERIFY STATUS
      // ======================================================

      const flutterwaveStatus =
        String(
          flutterwaveCharge.status ||
            ""
        ).toLowerCase();

      // ======================================================
      // SUCCESS
      // ======================================================

      if (
        flutterwaveStatus ===
          "succeeded" ||
        flutterwaveStatus ===
          "successful" ||
        flutterwaveStatus ===
          "completed"
      ) {
        const result =
          await finalizeSuccessfulPayment(
            {
              payment,
              flutterwaveCharge,
              res
            }
          );

        return res
          .status(200)
          .json({
            received: true,
            processed: true,
            message:
              result.paymentAlreadySuccessful
                ? "Payment was already successful."
                : "Payment processed successfully.",

            status:
              "Successful",

            paymentId:
              result.paymentId,

            bookingId:
              result.bookingId,

            transactionId:
              result.transactionId
          });
      }

      // ======================================================
      // FAILED
      // ======================================================

      if (
        flutterwaveStatus ===
          "failed" ||
        flutterwaveStatus ===
          "cancelled" ||
        flutterwaveStatus ===
          "canceled"
      ) {
        await markPaymentFailed(
          payment
        );

        return res
          .status(200)
          .json({
            received: true,
            processed: true,
            message:
              "Payment marked as failed.",

            status:
              "Failed",

            transactionId:
              payment.transaction_id
          });
      }

      // ======================================================
      // PENDING / OTHER
      // ======================================================

      return res
        .status(200)
        .json({
          received: true,
          processed: false,

          message:
            "Payment is still pending.",

          status:
            "Pending",

          flutterwaveStatus,

          transactionId:
            payment.transaction_id
        });
    } catch (error) {
      console.error(
        "FLUTTERWAVE WEBHOOK ERROR:",
        error.response?.data ||
          error.message ||
          error
      );

      // Returning a non-200 allows Flutterwave to retry the
      // webhook when the failure is temporary.
      return res
        .status(500)
        .json({
          received: false,
          message:
            "Webhook processing failed."
        });
    }
  };
