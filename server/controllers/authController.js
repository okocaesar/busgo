const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const sendWhatsApp = require("../utils/sendWhatsApp");


// =========================================
// GENERATE OTP
// =========================================

const generateOTP = () => {

  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();

};


// =========================================
// SEND OTP
//
// PRIMARY:
// WhatsApp
//
// FALLBACK:
// Email
//
// OTP VALIDITY:
// 10 MINUTES
// =========================================

const sendOTP = async ({
  user,
  otp
}) => {

  // =========================================
  // WHATSAPP MESSAGE
  // =========================================

  const whatsappMessage = `
BusGo Verification Code

Hello ${user.name},

Your BusGo verification code is:

${otp}

This code expires in 10 minutes.

If you did not request this code, please ignore this message.

BusGo Bus Transport Reservation
  `.trim();


  // =========================================
  // TRY WHATSAPP FIRST
  // =========================================

  try {

    if (user.phone) {

      await sendWhatsApp({

        to: user.phone,

        message:
          whatsappMessage

      });


      console.log(
        "OTP SENT VIA WHATSAPP:",
        user.phone
      );


      return {
        channel: "whatsapp"
      };

    }

  } catch (whatsappError) {

    console.error(
      "WHATSAPP OTP FAILED:"
    );

    console.error(
      whatsappError.message
    );

    console.log(
      "FALLING BACK TO EMAIL..."
    );

  }


  // =========================================
  // WHATSAPP FAILED
  //
  // SEND EMAIL
  // =========================================

  try {

    await sendEmail({

      to: user.email,

      subject:
        "BusGo - Your Verification Code",

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
            Hello ${user.name},
          </p>

          <p>
            We were unable to deliver your
            verification code through WhatsApp.
          </p>

          <p>
            Therefore, we have sent your
            verification code to this email.
          </p>

          <p>
            Your verification code is:
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


    console.log(
      "OTP SENT VIA EMAIL:",
      user.email
    );


    return {
      channel: "email"
    };


  } catch (emailError) {

    console.error(
      "EMAIL OTP FAILED:",
      emailError
    );


    throw new Error(
      "Unable to send verification code through WhatsApp or email."
    );

  }

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
      async (
        findError,
        users
      ) => {

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
          // =========================================

          const otp =
            generateOTP();


          const otpExpiresAt =
            new Date(
              Date.now() +
              10 * 60 * 1000
            );


          User.updateOTP(

            existingUser.id,

            otp,

            otpExpiresAt,

            async (
              updateError
            ) => {

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

                const delivery =
                  await sendOTP({

                    user: {
                      id:
                        existingUser.id,

                      name:
                        name ||

                        existingUser.name,

                      email:
                        existingUser.email,

                      phone:
                        phone ||

                        existingUser.phone

                    },

                    otp

                  });


                return res.status(200).json({

                  message:
                    delivery.channel ===
                    "whatsapp"

                      ? "A verification code has been sent to your WhatsApp."

                      : "WhatsApp delivery was unavailable. A verification code has been sent to your email.",

                  requiresVerification:
                    true,

                  email:
                    existingUser.email,

                  otpChannel:
                    delivery.channel

                });


              } catch (deliveryError) {

                console.error(
                  "OTP delivery error:",
                  deliveryError
                );

                return res.status(500).json({

                  message:
                    "Unable to send verification code."

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
          new Date(
            Date.now() +
            10 * 60 * 1000
          );


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

          async (
            err,
            result
          ) => {

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
            // SEND OTP
            // =========================================

            try {

              const delivery =
                await sendOTP({

                  user: {

                    id:
                      result.insertId,

                    name,

                    email,

                    phone

                  },

                  otp

                });


              return res.status(201).json({

                message:
                  delivery.channel ===
                  "whatsapp"

                    ? "Registration successful. Please check your WhatsApp for the verification code."

                    : "Registration successful. WhatsApp delivery was unavailable, so the verification code was sent to your email.",

                userId:
                  result.insertId,

                requiresVerification:
                  true,

                email,

                otpChannel:
                  delivery.channel

              });


            } catch (deliveryError) {

              console.error(
                "OTP sending error:",
                deliveryError
              );

              return res.status(500).json({

                message:
                  "Account created, but we could not send the verification code."

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
// VERIFY OTP
//
// OTP CAN COME FROM:
// WhatsApp OR EMAIL
//
// SAME OTP
// =========================================

exports.verifyOTP = (
  req,
  res
) => {

  const {
    email,
    otp
  } = req.body;


  if (
    !email ||
    !otp
  ) {

    return res.status(400).json({

      message:
        "Email and verification code are required."

    });

  }


  User.verifyOTP(

    email,

    otp,

    (
      err,
      results
    ) => {

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

        (
          updateError
        ) => {

          if (updateError) {

            console.error(
              "Email verification update error:",
              updateError
            );

            return res.status(500).json({

              message:
                "Unable to verify your account."

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
// =========================================

exports.resendOTP = (
  req,
  res
) => {

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

    async (
      err,
      results
    ) => {

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


      // =========================================
      // OTP EXPIRES IN 10 MINUTES
      // =========================================

      const otpExpiresAt =
        new Date(

          Date.now() +
          10 * 60 * 1000

        );


      User.updateOTP(

        user.id,

        otp,

        otpExpiresAt,

        async (
          updateError
        ) => {

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

            const delivery =
              await sendOTP({

                user,

                otp

              });


            return res.status(200).json({

              message:
                delivery.channel ===
                "whatsapp"

                  ? "A new verification code has been sent to your WhatsApp."

                  : "WhatsApp delivery was unavailable. A new verification code has been sent to your email.",

              otpChannel:
                delivery.channel

            });


          } catch (deliveryError) {

            console.error(
              "Resend OTP delivery error:",
              deliveryError
            );

            return res.status(500).json({

              message:
                "Unable to send the verification code."

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

exports.login = (
  req,
  res
) => {

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

    async (
      err,
      result
    ) => {

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
      // ACCOUNT NOT FOUND
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


      // =========================================
      // PASSWORD CHECK
      // =========================================

      const passwordMatch =
        await bcrypt.compare(

          password.trim(),

          user.password

        );


      if (!passwordMatch) {

        return res.status(401).json({

          message:
            "Wrong password."

        });

      }


      // =========================================
      // ACCOUNT VERIFICATION
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
            user.email

        });

      }


      // =========================================
      // GENERATE JWT
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
      // LOGIN RESPONSE
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