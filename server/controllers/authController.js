const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


// =========================================
// GENERATE OTP
// =========================================

const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};


// =========================================
// REGISTER
// =========================================

exports.register = async (req, res) => {

  const {
    name,
    email,
    phone,
    password
  } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      message:
        "Please provide name, email, phone and password."
    });
  }

  try {

    // Check if user already exists
    User.findByEmail(email, async (findError, users) => {

      if (findError) {
        console.error(
          "Registration lookup error:",
          findError
        );

        return res.status(500).json({
          message: "Unable to check existing account."
        });
      }

      // =========================================
      // EXISTING USER
      // =========================================

      if (users && users.length > 0) {

        const existingUser = users[0];

        if (existingUser.email_verified) {
          return res.status(409).json({
            message:
              "An account with this email already exists."
          });
        }

        // Existing but not verified
        const otp = generateOTP();

        const otpExpiresAt = new Date(
          Date.now() + 10 * 60 * 1000
        );

        User.updateOTP(
          existingUser.id,
          otp,
          otpExpiresAt,
          async (updateError) => {

            if (updateError) {
              console.error(
                "OTP update error:",
                updateError
              );

              return res.status(500).json({
                message:
                  "Unable to generate verification code."
              });
            }

            try {

              await sendEmail({
                to: email,
                subject: "BusGo Email Verification",
                html: `
                  <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                  ">

                    <h1 style="color:#0b7d45;">
                      BUSGO
                    </h1>

                    <h2>
                      Verify your email
                    </h2>

                    <p>
                      Hello ${name},
                    </p>

                    <p>
                      Your BusGo verification code is:
                    </p>

                    <div style="
                      font-size:32px;
                      font-weight:bold;
                      letter-spacing:8px;
                      padding:20px;
                      background:#f3f8f5;
                      text-align:center;
                      margin:20px 0;
                    ">
                      ${otp}
                    </div>

                    <p>
                      This code expires in
                      <strong>10 minutes</strong>.
                    </p>

                    <p>
                      If you did not request this,
                      you can safely ignore this email.
                    </p>

                  </div>
                `
              });

              return res.status(200).json({
                message:
                  "A new verification code has been sent to your email.",
                requiresVerification: true,
                email
              });

            } catch (emailError) {

              console.error(
                "OTP email error:",
                emailError
              );

              return res.status(500).json({
                message:
                  "Unable to send verification email."
              });
            }
          }
        );

        return;
      }


      // =========================================
      // NEW USER
      // =========================================

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const otp = generateOTP();

      const otpExpiresAt = new Date(
        Date.now() + 10 * 60 * 1000
      );

      User.create(
        {
          name,
          email,
          phone,
          password: hashedPassword,
          emailVerified: 0,
          otpCode: otp,
          otpExpiresAt
        },

        async (err, result) => {

          if (err) {

            console.error(
              "Registration database error:",
              err
            );

            return res.status(500).json({
              message: err.message
            });
          }

          try {

            await sendEmail({
              to: email,
              subject: "BusGo Email Verification",
              html: `
                <div style="
                  font-family: Arial, sans-serif;
                  max-width: 600px;
                  margin: auto;
                  padding: 30px;
                ">

                  <h1 style="color:#0b7d45;">
                    BUSGO
                  </h1>

                  <h2>
                    Welcome to BusGo!
                  </h2>

                  <p>
                    Hello ${name},
                  </p>

                  <p>
                    Thank you for creating a BusGo account.
                  </p>

                  <p>
                    Your email verification code is:
                  </p>

                  <div style="
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:8px;
                    padding:20px;
                    background:#f3f8f5;
                    text-align:center;
                    margin:20px 0;
                  ">
                    ${otp}
                  </div>

                  <p>
                    This code expires in
                    <strong>10 minutes</strong>.
                  </p>

                  <p>
                    Please enter this code in BusGo
                    to activate your account.
                  </p>

                </div>
              `
            });

            return res.status(201).json({
              message:
                "Registration successful. Please check your email for the verification code.",
              userId: result.insertId,
              requiresVerification: true,
              email
            });

          } catch (emailError) {

            console.error(
              "Email sending error:",
              emailError
            );

            return res.status(500).json({
              message:
                "Account created, but we could not send the verification email."
            });
          }
        }
      );

    });

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      message: error.message
    });
  }
};


// =========================================
// VERIFY EMAIL OTP
// =========================================

exports.verifyOTP = (req, res) => {

  const {
    email,
    otp
  } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message:
        "Email and verification code are required."
    });
  }

  User.verifyOTP(
    email,
    otp,
    (err, results) => {

      if (err) {

        console.error(
          "OTP verification database error:",
          err
        );

        return res.status(500).json({
          message:
            "Unable to verify your code."
        });
      }

      if (!results || results.length === 0) {
        return res.status(400).json({
          message:
            "Invalid or expired verification code."
        });
      }

      const user = results[0];

      User.markEmailVerified(
        user.id,
        (updateError) => {

          if (updateError) {

            console.error(
              "Email verification update error:",
              updateError
            );

            return res.status(500).json({
              message:
                "Unable to verify your email."
            });
          }

          return res.status(200).json({
            message:
              "Email verified successfully. You can now login.",
            verified: true
          });

        }
      );

    }
  );
};


// =========================================
// RESEND OTP
// =========================================

exports.resendOTP = (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required."
    });
  }

  User.findByEmail(
    email,
    async (err, results) => {

      if (err) {
        console.error(
          "Resend OTP database error:",
          err
        );

        return res.status(500).json({
          message: "Unable to find your account."
        });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({
          message: "No account was found with this email."
        });
      }

      const user = results[0];

      // Already verified
      if (user.email_verified) {
        return res.status(400).json({
          message: "This email is already verified."
        });
      }

      // Generate new OTP
      const otp = generateOTP();

      // OTP expires in 10 minutes
      const otpExpiresAt = new Date(
        Date.now() + 10 * 60 * 1000
      );

      User.updateOTP(
        user.id,
        otp,
        otpExpiresAt,
        async (updateError) => {

          if (updateError) {
            console.error(
              "Resend OTP update error:",
              updateError
            );

            return res.status(500).json({
              message:
                "Unable to generate a new verification code."
            });
          }

          try {

            await sendEmail({
              to: user.email,

              subject:
                "BusGo - Your New Verification Code",

              html: `
                <div style="
                  font-family: Arial, sans-serif;
                  max-width: 600px;
                  margin: auto;
                  padding: 30px;
                  color: #222;
                ">

                  <h1 style="
                    color: #0b7d45;
                    margin-bottom: 10px;
                  ">
                    BUSGO
                  </h1>

                  <h2>
                    Your new verification code
                  </h2>

                  <p>
                    Hello ${user.name},
                  </p>

                  <p>
                    You requested a new BusGo
                    email verification code.
                  </p>

                  <p>
                    Your new verification code is:
                  </p>

                  <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    padding: 20px;
                    background: #f3f8f5;
                    text-align: center;
                    margin: 20px 0;
                    border-radius: 10px;
                    color: #0b7d45;
                  ">
                    ${otp}
                  </div>

                  <p>
                    This code will expire in
                    <strong>10 minutes</strong>.
                  </p>

                  <p>
                    If you did not request this code,
                    you can safely ignore this email.
                  </p>

                  <hr style="
                    margin: 30px 0;
                    border: none;
                    border-top: 1px solid #ddd;
                  " />

                  <p style="
                    color: #777;
                    font-size: 13px;
                    text-align: center;
                  ">
                    BusGo Bus Transport Reservation
                  </p>

                </div>
              `
            });

            return res.status(200).json({
              message:
                "A new verification code has been sent to your email."
            });

          } catch (emailError) {

            console.error(
              "Resend OTP email error:",
              emailError
            );

            return res.status(500).json({
              message:
                "Unable to send the verification email."
            });
          }
        }
      );
    }
  );
};

// =========================================
// LOGIN
// =========================================

exports.login = (req, res) => {

  const {
    email,
    password
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message:
        "Email and password are required."
    });
  }

  User.findByEmail(
    email,
    async (err, result) => {

      if (err) {

        console.error(
          "Login database error:",
          err
        );

        return res.status(500).json({
          message:
            "Database error during login."
        });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({
          message:
            "User not found."
        });
      }

      try {

        const user = result[0];

        // =========================================
        // CHECK EMAIL VERIFICATION
        // =========================================

        if (!user.email_verified) {

          return res.status(403).json({
            message:
              "Please verify your email before logging in.",
            requiresVerification: true,
            email: user.email
          });
        }


        // =========================================
        // CHECK PASSWORD
        // =========================================

        const match =
          await bcrypt.compare(
            password,
            user.password
          );

        if (!match) {
          return res.status(401).json({
            message:
              "Wrong password."
          });
        }


        // =========================================
        // JWT SECRET
        // =========================================

        if (!process.env.JWT_SECRET) {

          console.error(
            "JWT_SECRET is missing."
          );

          return res.status(500).json({
            message:
              "Server authentication configuration is missing."
          });
        }


        // =========================================
        // CREATE JWT
        // =========================================

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "24h"
          }
        );


        // =========================================
        // SUCCESS
        // =========================================

        return res.status(200).json({

          message:
            "Login successful",

          token,

          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }

        });

      } catch (error) {

        console.error(
          "Login authentication error:",
          error
        );

        return res.status(500).json({
          message:
            "Authentication error during login."
        });
      }

    }
  );
};