const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const {
  checkAndSendWhatsAppOTP
} = require("../utils/sendWhatsApp");


// =========================================
// GENERATE OTP
// =========================================

const generateOTP = () => {

  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();

};


// =========================================
// OTP EXPIRATION
// =========================================

const getOTPExpiration = () => {

  return new Date(
    Date.now() + 10 * 60 * 1000
  );

};


// =========================================
// SEND OTP EMAIL
//
// Kept as a separate function because email
// is now a FALLBACK only.
// =========================================

const sendOTPEmail = async ({
  email,
  name,
  otp,
  subject = "BusGo Email Verification"
}) => {

  await sendEmail({

    to: email,

    subject,

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
          Verify your BusGo account
        </h2>

        <p>
          Hello ${name || "BusGo customer"},
        </p>

        <p>
          Your BusGo verification code is:
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
          This code expires in
          <strong>10 minutes</strong>.
        </p>

        <p>
          Please enter this code in BusGo
          to activate your account.
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


  // =========================================
  // VALIDATION
  // =========================================

  if (
    !name ||
    !email ||
    !phone ||
    !password
  ) {

    return res.status(400).json({

      message:
        "Please provide name, email, phone and password."

    });

  }


  try {

    // =========================================
    // CHECK EXISTING USER
    // =========================================

    User.findByEmail(
      email,
      async (findError, users) => {

        if (findError) {

          console.error(
            "Registration lookup error:",
            findError
          );

          return res.status(500).json({

            message:
              "Unable to check existing account."

          });

        }


        // =========================================
        // EXISTING USER
        // =========================================

        if (
          users &&
          users.length > 0
        ) {

          const existingUser =
            users[0];


          // =========================================
          // ALREADY VERIFIED
          // =========================================

          if (
            existingUser.email_verified
          ) {

            return res.status(409).json({

              message:
                "An account with this email already exists."

            });

          }


          // =========================================
          // EXISTING BUT NOT VERIFIED
          //
          // Generate fresh OTP.
          // =========================================

          const otp =
            generateOTP();

          const otpExpiresAt =
            getOTPExpiration();


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


              // =========================================
              // TRY WHATSAPP FIRST
              // =========================================

              try {

                const whatsappResult =
                  await checkAndSendWhatsAppOTP({

                    to:
                      existingUser.phone ||
                      phone,

                    otp,

                    name:
                      existingUser.name ||
                      name

                  });


                // =========================================
                // WHATSAPP SUCCESS
                // =========================================

                if (
                  whatsappResult.sent &&
                  whatsappResult.channel === "whatsapp"
                ) {

                  console.log(
                    "REGISTRATION OTP SENT THROUGH WHATSAPP:",
                    existingUser.phone ||
                    phone
                  );


                  return res.status(200).json({

                    message:
                      "Your verification code has been sent to WhatsApp.",

                    requiresVerification:
                      true,

                    otpChannel:
                      "whatsapp",

                    whatsappAvailable:
                      true,

                    email:
                      existingUser.email,

                    phone:
                      existingUser.phone ||
                      phone

                  });

                }


                // =========================================
                // WHATSAPP NOT AVAILABLE
                //
                // IMPORTANT:
                //
                // DO NOT SEND EMAIL.
                //
                // The frontend will ask the user.
                // =========================================

                if (
                  whatsappResult.requiresEmailFallback
                ) {

                  console.log(
                    "WHATSAPP NOT AVAILABLE. WAITING FOR USER EMAIL FALLBACK APPROVAL."
                  );


                  return res.status(200).json({

                    message:
                      "This phone number does not appear to have WhatsApp.",

                    requiresVerification:
                      true,

                    otpChannel:
                      "none",

                    whatsappAvailable:
                      false,

                    requiresEmailPermission:
                      true,

                    email:
                      existingUser.email,

                    phone:
                      existingUser.phone ||
                      phone,

                    fallbackMessage:
                      "This phone number does not appear to have WhatsApp. Would you like us to send the verification code to your email?"

                  });

                }


                // =========================================
                // UNKNOWN RESULT
                // =========================================

                return res.status(503).json({

                  message:
                    "We could not determine whether this phone number has WhatsApp. Please try again."

                });

              } catch (whatsappError) {

                console.error(
                  "WHATSAPP OTP ERROR:",
                  whatsappError
                );


                return res.status(503).json({

                  message:
                    "We could not send the verification code through WhatsApp. Please try again.",

                  whatsappError:
                    true

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
          await bcrypt.hash(
            password,
            10
          );


        const otp =
          generateOTP();


        const otpExpiresAt =
          getOTPExpiration();


        // =========================================
        // CREATE USER
        // =========================================

        User.create(

          {

            name,

            email,

            phone,

            password:
              hashedPassword,

            emailVerified:
              0,

            otpCode:
              otp,

            otpExpiresAt

          },

          async (err, result) => {

            if (err) {

              console.error(
                "Registration database error:",
                err
              );

              return res.status(500).json({

                message:
                  err.message

              });

            }


            // =========================================
            // USER CREATED
            //
            // NOW TRY WHATSAPP FIRST
            // =========================================

            try {

              const whatsappResult =
                await checkAndSendWhatsAppOTP({

                  to:
                    phone,

                  otp,

                  name

                });


              // =========================================
              // WHATSAPP OTP SENT
              // =========================================

              if (
                whatsappResult.sent &&
                whatsappResult.channel === "whatsapp"
              ) {

                console.log(
                  "NEW USER OTP SENT THROUGH WHATSAPP:",
                  phone
                );


                return res.status(201).json({

                  message:
                    "Registration successful. Your verification code has been sent to WhatsApp.",

                  userId:
                    result.insertId,

                  requiresVerification:
                    true,

                  otpChannel:
                    "whatsapp",

                  whatsappAvailable:
                    true,

                  email,

                  phone

                });

              }


              // =========================================
              // WHATSAPP NOT AVAILABLE
              //
              // DO NOT SEND EMAIL.
              // =========================================

              if (
                whatsappResult.requiresEmailFallback
              ) {

                console.log(
                  "NEW USER WHATSAPP UNAVAILABLE. WAITING FOR EMAIL PERMISSION."
                );


                return res.status(201).json({

                  message:
                    "Registration successful, but this phone number does not appear to have WhatsApp.",

                  userId:
                    result.insertId,

                  requiresVerification:
                    true,

                  otpChannel:
                    "none",

                  whatsappAvailable:
                    false,

                  requiresEmailPermission:
                    true,

                  email,

                  phone,

                  fallbackMessage:
                    "This phone number does not appear to have WhatsApp. Would you like us to send the verification code to your email?"

                });

              }


              // =========================================
              // UNKNOWN RESULT
              // =========================================

              return res.status(503).json({

                message:
                  "Your account was created, but we could not determine whether your phone number has WhatsApp. Please try again.",

                userId:
                  result.insertId,

                requiresVerification:
                  true

              });


            } catch (whatsappError) {

              console.error(
                "NEW USER WHATSAPP OTP ERROR:",
                whatsappError
              );


              return res.status(503).json({

                message:
                  "Your account was created, but we could not send the verification code through WhatsApp. Please try again.",

                userId:
                  result.insertId,

                requiresVerification:
                  true,

                whatsappError:
                  true

              });

            }

          }

        );

      }
    );

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({

      message:
        error.message

    });

  }

};


// =========================================
// SEND OTP TO EMAIL AFTER USER APPROVES
//
// POST /api/auth/send-email-otp
//
// IMPORTANT:
//
// This endpoint is what the frontend will call
// ONLY after the user clicks:
//
// "Send OTP to Email"
// =========================================

exports.sendEmailOTP = (req, res) => {

  const {
    email
  } = req.body;


  // =========================================
  // VALIDATION
  // =========================================

  if (!email) {

    return res.status(400).json({

      message:
        "Email is required."

    });

  }


  // =========================================
  // FIND USER
  // =========================================

  User.findByEmail(

    email,

    async (err, results) => {

      if (err) {

        console.error(
          "SEND EMAIL OTP DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to find your account."

        });

      }


      if (
        !results ||
        results.length === 0
      ) {

        return res.status(404).json({

          message:
            "No account was found with this email."

        });

      }


      const user =
        results[0];


      // =========================================
      // ALREADY VERIFIED
      // =========================================

      if (
        user.email_verified
      ) {

        return res.status(400).json({

          message:
            "This account is already verified."

        });

      }


      // =========================================
      // GENERATE NEW OTP
      // =========================================

      const otp =
        generateOTP();


      const otpExpiresAt =
        getOTPExpiration();


      // =========================================
      // UPDATE OTP
      // =========================================

      User.updateOTP(

        user.id,

        otp,

        otpExpiresAt,

        async (updateError) => {

          if (updateError) {

            console.error(
              "EMAIL FALLBACK OTP UPDATE ERROR:",
              updateError
            );

            return res.status(500).json({

              message:
                "Unable to generate a new verification code."

            });

          }


          // =========================================
          // SEND EMAIL
          // =========================================

          try {

            await sendOTPEmail({

              email:
                user.email,

              name:
                user.name,

              otp,

              subject:
                "BusGo - Email Verification Code"

            });


            console.log(
              "EMAIL FALLBACK OTP SENT:",
              user.email
            );


            return res.status(200).json({

              message:
                "Your verification code has been sent to your email.",

              requiresVerification:
                true,

              otpChannel:
                "email",

              email:
                user.email

            });


          } catch (emailError) {

            console.error(
              "EMAIL FALLBACK SEND ERROR:",
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
// VERIFY OTP
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


      if (
        !results ||
        results.length === 0
      ) {

        return res.status(400).json({

          message:
            "Invalid or expired verification code."

        });

      }


      const user =
        results[0];


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
              "Account verified successfully. You can now login.",

            verified:
              true

          });

        }

      );

    }

  );

};


// =========================================
// RESEND OTP
//
// IMPORTANT:
//
// Resend now follows the same priority:
//
// WhatsApp first.
//
// If WhatsApp is unavailable,
// frontend must ask before email.
// =========================================

exports.resendOTP = (req, res) => {

  const {
    email
  } = req.body;


  if (!email) {

    return res.status(400).json({

      message:
        "Email is required."

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

          message:
            "Unable to find your account."

        });

      }


      if (
        !results ||
        results.length === 0
      ) {

        return res.status(404).json({

          message:
            "No account was found with this email."

        });

      }


      const user =
        results[0];


      // =========================================
      // ALREADY VERIFIED
      // =========================================

      if (
        user.email_verified
      ) {

        return res.status(400).json({

          message:
            "This account is already verified."

        });

      }


      // =========================================
      // GENERATE NEW OTP
      // =========================================

      const otp =
        generateOTP();


      const otpExpiresAt =
        getOTPExpiration();


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


          // =========================================
          // TRY WHATSAPP FIRST
          // =========================================

          try {

            const whatsappResult =
              await checkAndSendWhatsAppOTP({

                to:
                  user.phone,

                otp,

                name:
                  user.name

              });


            // =========================================
            // WHATSAPP SENT
            // =========================================

            if (
              whatsappResult.sent &&
              whatsappResult.channel === "whatsapp"
            ) {

              return res.status(200).json({

                message:
                  "A new verification code has been sent to your WhatsApp.",

                requiresVerification:
                  true,

                otpChannel:
                  "whatsapp",

                whatsappAvailable:
                  true,

                email:
                  user.email

              });

            }


            // =========================================
            // WHATSAPP NOT AVAILABLE
            // =========================================

            if (
              whatsappResult.requiresEmailFallback
            ) {

              return res.status(200).json({

                message:
                  "Your phone number does not appear to have WhatsApp.",

                requiresVerification:
                  true,

                otpChannel:
                  "none",

                whatsappAvailable:
                  false,

                requiresEmailPermission:
                  true,

                email:
                  user.email,

                fallbackMessage:
                  "WhatsApp is unavailable for this number. Would you like us to send your verification code to your email?"

              });

            }


            return res.status(503).json({

              message:
                "Unable to determine WhatsApp availability."

            });


          } catch (whatsappError) {

            console.error(
              "RESEND WHATSAPP OTP ERROR:",
              whatsappError
            );

            return res.status(503).json({

              message:
                "Unable to send the verification code through WhatsApp."

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


  // =========================================
  // VALIDATION
  // =========================================

  if (
    !email ||
    !password
  ) {

    return res.status(400).json({

      message:
        "Email and password are required."

    });

  }


  User.findByEmail(

    email,

    async (err, result) => {

      // =========================================
      // DATABASE ERROR
      // =========================================

      if (err) {

        console.error(
          "LOGIN DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Database error."

        });

      }


      // =========================================
      // USER NOT FOUND
      // =========================================

      if (
        !result ||
        result.length === 0
      ) {

        return res.status(404).json({

          message:
            "Account does not exist."

        });

      }


      const user =
        result[0];


      console.log(
        "LOGIN USER:",
        {

          email:
            user.email,

          storedPassword:
            user.password,

          verified:
            user.email_verified

        }
      );


      // =========================================
      // CHECK PASSWORD
      // =========================================

      const passwordMatch =
        await bcrypt.compare(

          password.trim(),

          user.password

        );


      console.log(
        "PASSWORD MATCH:",
        passwordMatch
      );


      if (!passwordMatch) {

        return res.status(401).json({

          message:
            "Wrong password."

        });

      }


      // =========================================
      // CHECK VERIFICATION
      // =========================================

      if (
        !user.email_verified
      ) {

        return res.status(403).json({

          message:
            "Please verify your account first.",

          requiresVerification:
            true,

          email:
            user.email,

          phone:
            user.phone

        });

      }


      // =========================================
      // CREATE JWT
      // =========================================

      const token =
        jwt.sign(

          {

            id:
              user.id,

            email:
              user.email,

            role:
              user.role

          },

          process.env.JWT_SECRET,

          {

            expiresIn:
              "24h"

          }

        );


      // =========================================
      // LOGIN SUCCESS
      // =========================================

      return res.json({

        message:
          "Login successful",

        token,

        user: {

          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role

        }

      });

    }

  );

};


// =========================================
// EXPORT
// =========================================
//
// This is optional depending on how your
// auth routes currently reference the
// controller functions.
//
// The functions are already attached to
// exports above.
// =========================================