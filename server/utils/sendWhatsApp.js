const axios = require("axios");

// =========================================
// FORMAT CAMEROON PHONE NUMBER
// =========================================

const formatCameroonPhone = (to) => {

  if (!to) {
    throw new Error(
      "WhatsApp phone number is required."
    );
  }

  let phoneNumber =
    String(to).trim();

  // Remove spaces
  phoneNumber =
    phoneNumber.replace(/\s+/g, "");

  // Remove hyphens
  phoneNumber =
    phoneNumber.replace(/-/g, "");

  // Remove parentheses
  phoneNumber =
    phoneNumber.replace(/[()]/g, "");

  // Remove + if present
  phoneNumber =
    phoneNumber.replace(/^\+/, "");

  // =========================================
  // CAMEROON LOCAL FORMAT
  //
  // 690000000
  // becomes
  // 237690000000
  // =========================================

  if (
    phoneNumber.startsWith("0") &&
    phoneNumber.length === 9
  ) {

    phoneNumber =
      "237" +
      phoneNumber.substring(1);

  }

  // =========================================
  // CAMEROON INTERNATIONAL FORMAT
  //
  // 690000000
  // becomes
  // 237690000000
  // =========================================

  if (
    phoneNumber.length === 9 &&
    phoneNumber.startsWith("6")
  ) {

    phoneNumber =
      "237" +
      phoneNumber;

  }

  // =========================================
  // VALIDATE FINAL NUMBER
  // =========================================

  if (
    !/^2376\d{8}$/.test(
      phoneNumber
    )
  ) {

    throw new Error(
      "Invalid Cameroon WhatsApp phone number."
    );

  }

  return phoneNumber;
};


// =========================================
// GET ULTRAMSG CONFIGURATION
// =========================================

const getUltraMsgConfig = () => {

  const instanceId =
    process.env.ULTRAMSG_INSTANCE_ID;

  const token =
    process.env.ULTRAMSG_TOKEN;

  if (
    !instanceId ||
    !token
  ) {

    throw new Error(
      "UltraMsg configuration is missing. Check ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN in your .env file."
    );

  }

  return {
    instanceId,
    token
  };

};


// =========================================
// CHECK IF NUMBER HAS WHATSAPP
//
// UltraMsg endpoint:
//
// /contacts/check
//
// Response:
//
// {
//   status: "valid"
// }
//
// OR
//
// {
//   status: "invalid"
// }
//
// =========================================

const checkWhatsApp = async ({
  to
}) => {

  const phoneNumber =
    formatCameroonPhone(to);

  const {
    instanceId,
    token
  } =
    getUltraMsgConfig();


  const url =
    `https://api.ultramsg.com/${instanceId}/contacts/check`;


  const chatId =
    `${phoneNumber}@c.us`;


  try {

    const response =
      await axios.get(
        url,
        {
          params: {

            token,

            chatId,

            // Force UltraMsg to perform
            // a fresh check instead of relying
            // only on its cached result.
            nocache: true

          },

          timeout: 15000

        }
      );


    console.log(
      "========================================="
    );

    console.log(
      "ULTRAMSG WHATSAPP NUMBER CHECK"
    );

    console.log(
      "Phone:",
      phoneNumber
    );

    console.log(
      "Chat ID:",
      chatId
    );

    console.log(
      "UltraMsg response:",
      response.data
    );

    console.log(
      "========================================="
    );


    const status =
      String(
        response.data?.status || ""
      ).toLowerCase();


    // =========================================
    // WHATSAPP AVAILABLE
    // =========================================

    if (
      status === "valid"
    ) {

      return {

        available: true,

        phoneNumber,

        chatId,

        status: "valid",

        response:
          response.data

      };

    }


    // =========================================
    // WHATSAPP NOT AVAILABLE
    // =========================================

    if (
      status === "invalid"
    ) {

      return {

        available: false,

        phoneNumber,

        chatId,

        status: "invalid",

        response:
          response.data

      };

    }


    // =========================================
    // UNKNOWN RESPONSE
    // =========================================

    console.warn(
      "UNKNOWN ULTRAMSG CONTACT CHECK RESPONSE:",
      response.data
    );


    return {

      available: false,

      phoneNumber,

      chatId,

      status: "unknown",

      response:
        response.data

    };


  } catch (error) {

    console.error(
      "========================================="
    );

    console.error(
      "ULTRAMSG WHATSAPP CHECK ERROR"
    );

    console.error(
      "Phone:",
      phoneNumber
    );

    console.error(
      "Error:",
      error.response?.data ||
      error.message
    );

    console.error(
      "========================================="
    );


    throw new Error(
      error.response?.data?.message ||
      "Unable to check whether this phone number has WhatsApp."
    );

  }

};


// =========================================
// SEND WHATSAPP MESSAGE
// =========================================

const sendWhatsApp = async ({
  to,
  message
}) => {

  if (!to) {

    throw new Error(
      "WhatsApp phone number is required."
    );

  }

  if (!message) {

    throw new Error(
      "WhatsApp message is required."
    );

  }


  const phoneNumber =
    formatCameroonPhone(to);


  const {
    instanceId,
    token
  } =
    getUltraMsgConfig();


  // =========================================
  // ULTRAMSG SEND URL
  // =========================================

  const url =
    `https://api.ultramsg.com/${instanceId}/messages/chat`;


  // =========================================
  // SEND MESSAGE
  // =========================================

  try {

    const response =
      await axios.post(

        url,

        new URLSearchParams({

          token,

          to: phoneNumber,

          body: message

        }),

        {
          headers: {

            "Content-Type":
              "application/x-www-form-urlencoded"

          },

          timeout: 15000

        }

      );


    console.log(
      "========================================="
    );

    console.log(
      "ULTRAMSG WHATSAPP MESSAGE SENT"
    );

    console.log(
      "WhatsApp:",
      phoneNumber
    );

    console.log(
      "UltraMsg response:",
      response.data
    );

    console.log(
      "========================================="
    );


    return response.data;


  } catch (error) {

    console.error(
      "========================================="
    );

    console.error(
      "ULTRAMSG WHATSAPP SEND ERROR"
    );

    console.error(
      "WhatsApp:",
      phoneNumber
    );

    console.error(
      "Error:",
      error.response?.data ||
      error.message
    );

    console.error(
      "========================================="
    );


    throw new Error(
      error.response?.data?.message ||
      "Unable to send WhatsApp message through UltraMsg."
    );

  }

};


// =========================================
// CHECK THEN SEND OTP
//
// This function:
//
// 1. Checks WhatsApp availability.
// 2. If available, sends the OTP.
// 3. If unavailable, DOES NOT send email.
// 4. Returns a response telling the
//    controller/frontend that email fallback
//    is required.
//
// =========================================

const checkAndSendWhatsAppOTP = async ({
  to,
  otp,
  name
}) => {

  if (!otp) {

    throw new Error(
      "OTP is required."
    );

  }


  // =========================================
  // CHECK WHATSAPP
  // =========================================

  const whatsappCheck =
    await checkWhatsApp({
      to
    });


  // =========================================
  // WHATSAPP AVAILABLE
  // =========================================

  if (
    whatsappCheck.available
  ) {

    const message =

      `Hello ${name || "BusGo customer"} 👋

Your BusGo verification code is:

🔐 ${otp}

This code expires in 10 minutes.

Do not share this code with anyone.

Thank you for using BusGo 🚌`;


    const sendResult =
      await sendWhatsApp({

        to:
          whatsappCheck.phoneNumber,

        message

      });


    return {

      sent: true,

      channel: "whatsapp",

      requiresEmailFallback: false,

      phoneNumber:
        whatsappCheck.phoneNumber,

      response:
        sendResult

    };

  }


  // =========================================
  // WHATSAPP NOT AVAILABLE
  //
  // IMPORTANT:
  //
  // DO NOT SEND EMAIL HERE.
  //
  // The frontend must ask the user first.
  // =========================================

  return {

    sent: false,

    channel: null,

    requiresEmailFallback: true,

    phoneNumber:
      whatsappCheck.phoneNumber,

    message:
      "This phone number does not appear to have WhatsApp. Would you like us to send your verification code to your email?"

  };

};


// =========================================
// EXPORT
// =========================================

module.exports = {

  sendWhatsApp,

  checkWhatsApp,

  checkAndSendWhatsAppOTP

};