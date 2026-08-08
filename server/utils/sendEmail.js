const nodemailer = require("nodemailer");

// =========================================
// CHECK EMAIL CONFIGURATION
// =========================================

console.log("=========================================");
console.log("EMAIL CONFIGURATION");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST ? "YES" : "NO");
console.log("EMAIL_PORT:", process.env.EMAIL_PORT ? "YES" : "NO");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "YES" : "NO");
console.log(
  "EMAIL_PASSWORD:",
  process.env.EMAIL_PASSWORD ? "YES" : "NO"
);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM ? "YES" : "NO");
console.log("=========================================");


// =========================================
// CREATE SMTP TRANSPORTER
// =========================================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,

  port: Number(process.env.EMAIL_PORT),

  secure:
    Number(process.env.EMAIL_PORT) === 465,

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

    console.error(
      "❌ EMAIL SMTP CONNECTION FAILED:"
    );

    console.error(error);

  } else {

    console.log(
      "✅ EMAIL SMTP SERVER IS READY"
    );

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

  console.log("=========================================");
  console.log("📧 ATTEMPTING TO SEND EMAIL");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log(
    "From configured:",
    process.env.EMAIL_FROM ? "YES" : "NO"
  );
  console.log("=========================================");

  try {

    const info = await transporter.sendMail({

      from: process.env.EMAIL_FROM,

      to,

      subject,

      html

    });

    console.log("=========================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("=========================================");

    return info;

  } catch (error) {

    console.error("=========================================");
    console.error("❌ EMAIL SENDING FAILED");
    console.error("Error:", error);
    console.error("=========================================");

    throw error;

  }

}


module.exports = sendEmail;