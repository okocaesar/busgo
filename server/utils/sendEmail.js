const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),

  secure: Number(process.env.EMAIL_PORT) === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// =========================================
// VERIFY SMTP CONNECTION
// =========================================

transporter.verify((error, success) => {
  if (error) {
    console.error("=========================================");
    console.error("❌ SMTP CONNECTION FAILED");
    console.error(error);
    console.error("=========================================");
  } else {
    console.log("=========================================");
    console.log("✅ EMAIL SMTP SERVER IS READY");
    console.log("=========================================");
  }
});

// =========================================
// SEND EMAIL
// =========================================

async function sendEmail({
  to,
  subject,
  html
}) {
  try {

    console.log("=========================================");
    console.log("📧 ATTEMPTING TO SEND EMAIL");
    console.log("TO:", to);
    console.log("FROM:", process.env.EMAIL_FROM);
    console.log("HOST:", process.env.EMAIL_HOST);
    console.log("PORT:", process.env.EMAIL_PORT);
    console.log("=========================================");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });

    console.log("=========================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("=========================================");

    return info;

  } catch (error) {

    console.error("=========================================");
    console.error("❌ EMAIL SENDING FAILED");
    console.error("NAME:", error.name);
    console.error("MESSAGE:", error.message);
    console.error("CODE:", error.code);
    console.error("COMMAND:", error.command);
    console.error("RESPONSE:", error.response);
    console.error("RESPONSE CODE:", error.responseCode);
    console.error("=========================================");

    throw error;
  }
}

module.exports = sendEmail;