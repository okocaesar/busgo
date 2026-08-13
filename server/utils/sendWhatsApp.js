const axios = require("axios");

// =========================================
// SEND WHATSAPP MESSAGE USING ULTRAMSG
// =========================================

const sendWhatsApp = async ({
  to,
  message
}) => {

  // =========================================
  // VALIDATION
  // =========================================

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


  // =========================================
  // ULTRAMSG CONFIGURATION
  // =========================================

  const instanceId =
    process.env.ULTRAMSG_INSTANCE_ID;

  const token =
    process.env.ULTRAMSG_TOKEN;


  if (!instanceId || !token) {

    throw new Error(
      "UltraMsg configuration is missing. Check ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN in your .env file."
    );

  }


  // =========================================
  // FORMAT CAMEROON PHONE NUMBER
  // =========================================
  //
  // Database:
  //
  // 690000000
  //
  // UltraMsg:
  //
  // 237690000000
  //
  // =========================================

  let phoneNumber =
    String(to).trim();


  // Remove spaces
  phoneNumber =
    phoneNumber.replace(
      /\s+/g,
      ""
    );


  // Remove hyphens
  phoneNumber =
    phoneNumber.replace(
      /-/g,
      ""
    );


  // Remove parentheses
  phoneNumber =
    phoneNumber.replace(
      /[()]/g,
      ""
    );


  // Remove + if present
  phoneNumber =
    phoneNumber.replace(
      /^\+/,
      ""
    );


  // =========================================
  // CAMEROON NUMBER
  // =========================================

  if (
    phoneNumber.startsWith("0") &&
    phoneNumber.length === 9
  ) {

    phoneNumber =
      "237" +
      phoneNumber.substring(1);

  }


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


  // =========================================
  // ULTRAMSG API URL
  // =========================================

  const url =
    `https://api.ultramsg.com/${instanceId}/messages/chat`;


  // =========================================
  // SEND WHATSAPP MESSAGE
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


    // =========================================
    // SUCCESS LOG
    // =========================================

    console.log(
      "========================================="
    );

    console.log(
      "ULTRAMSG WHATSAPP OTP SENT"
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

    // =========================================
    // ERROR LOG
    // =========================================

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
// EXPORT
// =========================================

module.exports =
  sendWhatsApp;