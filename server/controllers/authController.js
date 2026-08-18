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
//
// IMPORTANT:
//
// Registration NO LONGER automatically
// sends OTP through WhatsApp.
//
// The frontend will ask the user to choose:
//
// 1. WhatsApp
// 2. Email
//
// The OTP is generated and saved first.
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
          // DO NOT SEND IT YET.
          // =========================================

          const otp =
            generateOTP();

          const otpExpiresAt =
            getOTPExpiration();


          User.updateOTP(

            existingUser.id,

            otp,

            otpExpiresAt,

            (updateError) => {

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
              // WAIT FOR USER METHOD SELECTION
              // =========================================

              return res.status(200).json({

                message:
                  "Please choose how you would like to receive your verification code.",

                requiresVerification:
                  true,

                chooseVerificationMethod:
                  true,

                userId:
                  existingUser.id,

                email:
                  existingUser.email,

                phone:
                  existingUser.phone ||
                  phone,

                verificationMethods: [

                  "whatsapp",

                  "email"

                ]

              });

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

          (err, result) => {

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
            // DO NOT SEND OTP AUTOMATICALLY.
            //
            // The frontend will now ask the user
            // whether they want WhatsApp or Email.
            // =========================================

            return res.status(201).json({

              message:
                "Registration successful. Please choose how you would like to receive your verification code.",

              userId:
                result.insertId,

              requiresVerification:
                true,

              chooseVerificationMethod:
                true,

              email,

              phone,

              verificationMethods: [

                "whatsapp",

                "email"

              ]

            });

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
// SEND OTP TO WHATSAPP
//
// POST /api/auth/send-whatsapp-otp
//
// Called ONLY after the user chooses
// WhatsApp as their verification method.
// =========================================

exports.sendWhatsAppOTP = (req, res) => {

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
          "SEND WHATSAPP OTP DATABASE ERROR:",
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
      // CHECK OTP EXISTS
      // =========================================

      if (
        !user.otp_code ||
        !user.otp_expires_at
      ) {

        return res.status(400).json({

          message:
            "Your verification code is no longer available. Please request a new code."

        });

      }


      // =========================================
      // CHECK OTP EXPIRATION
      // =========================================

      if (
        new Date(user.otp_expires_at) < new Date()
      ) {

        return res.status(400).json({

          message:
            "Your verification code has expired. Please request a new code."

        });

      }


      // =========================================
      // SEND EXISTING OTP TO WHATSAPP
      // =========================================

      try {

        const whatsappResult =
          await checkAndSendWhatsAppOTP({

            to:
              user.phone,

            otp:
              user.otp_code,

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

          console.log(
            "OTP SENT THROUGH USER-SELECTED WHATSAPP METHOD:",
            user.phone
          );


          return res.status(200).json({

            message:
              "Your verification code has been sent to WhatsApp.",

            requiresVerification:
              true,

            otpChannel:
              "whatsapp",

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

          return res.status(400).json({

            message:
              "This phone number does not appear to have WhatsApp. Please choose email instead.",

            whatsappAvailable:
              false,

            canUseEmail:
              true

          });

        }


        // =========================================
        // UNKNOWN RESULT
        // =========================================

        return res.status(503).json({

          message:
            "We could not send the verification code through WhatsApp. Please choose email instead."

        });

      } catch (whatsappError) {

        console.error(
          "USER-SELECTED WHATSAPP OTP ERROR:",
          whatsappError
        );

        return res.status(503).json({

          message:
            "Unable to send the verification code through WhatsApp. Please try again or choose email."

        });

      }

    }

  );

};


// =========================================
// SEND OTP TO EMAIL
//
// POST /api/auth/send-email-otp
//
// Called ONLY after the user chooses
// Email as their verification method.
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
      // CHECK OTP
      // =========================================

      if (
        !user.otp_code ||
        !user.otp_expires_at
      ) {

        return res.status(400).json({

          message:
            "Your verification code is no longer available. Please request a new code."

        });

      }


      // =========================================
      // CHECK EXPIRATION
      // =========================================

      if (
        new Date(user.otp_expires_at) < new Date()
      ) {

        return res.status(400).json({

          message:
            "Your verification code has expired. Please request a new code."

        });

      }


      // =========================================
      // SEND EXISTING OTP BY EMAIL
      // =========================================

      try {

        await sendOTPEmail({

          email:
            user.email,

          name:
            user.name,

          otp:
            user.otp_code,

          subject:
            "BusGo - Email Verification Code"

        });


        console.log(
          "OTP SENT THROUGH USER-SELECTED EMAIL METHOD:",
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
          "EMAIL OTP SEND ERROR:",
          emailError
        );

        return res.status(500).json({

          message:
            "Unable to send the verification email."

        });

      }

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
// Resend now DOES NOT automatically send
// through WhatsApp.
//
// It generates a new OTP and asks the
// frontend to let the user choose:
//
// WhatsApp OR Email
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

    (err, results) => {

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

        (updateError) => {

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
          // DO NOT SEND OTP YET
          //
          // ASK USER TO CHOOSE METHOD AGAIN.
          // =========================================

          return res.status(200).json({

            message:
              "A new verification code is ready. Please choose how you would like to receive it.",

            requiresVerification:
              true,

            chooseVerificationMethod:
              true,

            email:
              user.email,

            phone:
              user.phone,

            verificationMethods: [

              "whatsapp",

              "email"

            ]

          });

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
            user.phone,

          chooseVerificationMethod:
            true,

          verificationMethods: [

            "whatsapp",

            "email"

          ]

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
// GET PROFILE
//
// GET /api/auth/profile
// Requires authentication
// =========================================

exports.getProfile = (req, res) => {

  const userId =
    req.user.id;


  if (!userId) {

    return res.status(401).json({

      message:
        "User authentication information is missing."

    });

  }


  User.findById(

    userId,

    (err, results) => {

      if (err) {

        console.error(
          "GET PROFILE DATABASE ERROR:",
          err
        );

        return res.status(500).json({

          message:
            "Unable to load your profile."

        });

      }


      if (
        !results ||
        results.length === 0
      ) {

        return res.status(404).json({

          message:
            "User profile not found."

        });

      }


      const user =
        results[0];


      return res.status(200).json({

        user: {

          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone,

          role:
            user.role,

          email_verified:
            user.email_verified,

          profile_picture:
            user.profile_picture,

          created_at:
            user.created_at

        }

      });

    }

  );

};


// =========================================
// UPDATE PROFILE
//
// PUT /api/auth/profile
// Requires authentication
//
// Updates:
// - Name
// - Email
// - Phone
// - Profile picture
// =========================================

exports.updateProfile = (req, res) => {

  const userId =
    req.user.id;


  const {
    name,
    email,
    phone,
    profilePicture
  } = req.body;


  // =========================================
  // VALIDATION
  // =========================================

  if (
    !name ||
    !email ||
    !phone
  ) {

    return res.status(400).json({

      message:
        "Name, email and phone are required."

    });

  }


  // =========================================
  // CHECK IF EMAIL BELONGS TO ANOTHER USER
  // =========================================

  User.findByEmail(

    email,

    (findError, users) => {

      if (findError) {

        console.error(
          "PROFILE EMAIL CHECK ERROR:",
          findError
        );

        return res.status(500).json({

          message:
            "Unable to verify your email address."

        });

      }


      // =========================================
      // EMAIL ALREADY USED BY ANOTHER ACCOUNT
      // =========================================

      if (
        users &&
        users.length > 0 &&
        Number(users[0].id) !== Number(userId)
      ) {

        return res.status(409).json({

          message:
            "This email address is already being used by another account."

        });

      }


      // =========================================
      // UPDATE PROFILE
      // =========================================

      User.updateProfile(

        userId,

        name.trim(),

        email.trim(),

        phone.trim(),

        profilePicture,

        (updateError) => {

          if (updateError) {

            console.error(
              "UPDATE PROFILE DATABASE ERROR:",
              updateError
            );

            return res.status(500).json({

              message:
                "Unable to update your profile."

            });

          }


          // =========================================
          // GET UPDATED PROFILE
          // =========================================

          User.findById(

            userId,

            (profileError, results) => {

              if (profileError) {

                console.error(
                  "UPDATED PROFILE FETCH ERROR:",
                  profileError
                );

                return res.status(500).json({

                  message:
                    "Profile was updated, but we could not reload it."

                });

              }


              if (
                !results ||
                results.length === 0
              ) {

                return res.status(404).json({

                  message:
                    "Profile updated, but user account could not be found."

                });

              }


              const user =
                results[0];


              return res.status(200).json({

                message:
                  "Profile updated successfully.",

                user: {

                  id:
                    user.id,

                  name:
                    user.name,

                  email:
                    user.email,

                  phone:
                    user.phone,

                  role:
                    user.role,

                  email_verified:
                    user.email_verified,

                  profile_picture:
                    user.profile_picture,

                  created_at:
                    user.created_at

                }

              });

            }

          );

        }

      );

    }

  );

};
