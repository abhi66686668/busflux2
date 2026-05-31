
const express = require("express");

const router = express.Router();

const User =
  require("../models/User");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const nodemailer =
  require("nodemailer");

const upload =
  require("../middleware/upload");



// ================= NODEMAILER =================

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS

    }

});



// ================= SEND OTP =================

router.post(

  "/send-otp",

  async (req, res) => {

    try {

      const { email } =
        req.body;

      const otp =
        Math.floor(
          100000 +
          Math.random() * 900000
        ).toString();



      let user =
        await User.findOne({

          email

        });



      if(!user){

        user =
          new User({

            email

          });

      }



      user.otp = otp;

      await user.save();



      // SEND EMAIL
      await transporter.sendMail({

        from:
          process.env.EMAIL_USER,

        to:
          email,

        subject:
          "BusFlux OTP Verification",

        text:
          `Your BusFlux OTP is ${otp}`

      });



      return res.status(200).json({

        message:
          "OTP sent successfully"

      });

    } catch (error) {

      return res.status(500).json({

        message:
          error.message

      });

    }

});



// ================= VERIFY OTP =================

router.post(

  "/verify-otp",

  async (req, res) => {

    try {

      const {

        email,
        otp

      } = req.body;



      const user =
        await User.findOne({

          email

        });



      if(!user){

        return res.status(400).json({

          message:
            "User not found"

        });

      }



      if(user.otp !== otp){

        return res.status(400).json({

          message:
            "Invalid OTP"

        });

      }



      user.isVerified = true;

      user.otp = "";

      await user.save();



      return res.status(200).json({

        message:
          "Email verified successfully"

      });

    } catch (error) {

      return res.status(500).json({

        message:
          error.message

      });

    }

});



// ================= REGISTER =================

router.post(

  "/register",

  upload.fields([

    {

      name: "userPhoto",

      maxCount: 1

    },

    {

      name: "idCardPhoto",

      maxCount: 1

    }

  ]),

  async (req, res) => {

  console.log("BODY:", req.body);

  console.log("FILES:", req.files);

  try {

    const {
      name,
      email,
      password,
      phone,
      age,
      aadhaarNumber,
      collegeId
    } = req.body;


      const user =
        await User.findOne({

          email

        });



      if(!user){

        return res.status(400).json({

          message:
            "Please send OTP first"

        });

      }



      if(!user.isVerified){

        return res.status(400).json({

          message:
            "Please verify OTP first"

        });

      }



      // ================= AGE GROUP =================

      let ageGroup = "";

      if(age >= 5 && age <= 14){

        ageGroup = "Children";

      }

      else if(age >= 15 && age <= 24){

        ageGroup = "Youth";

      }

      else if(age >= 25 && age <= 44){

        ageGroup = "Young Adults";

      }

      else if(age >= 45 && age <= 59){

        ageGroup = "Middle Age";

      }

      else if(age >= 60 && age <= 74){

        ageGroup = "Elderly";

      }

      else {

        ageGroup = "Seniors";

      }



      // HASH PASSWORD
      const hashedPassword =
        await bcrypt.hash(

          password,

          10

        );



      // SAVE DATA
      user.name = name;

      user.phone = phone;

      user.age = age;

      user.ageGroup = ageGroup;

      user.aadhaarNumber =
        aadhaarNumber;

      user.collegeId =
        collegeId;

      user.password =
        hashedPassword;



      // PROFILE PHOTO
      if(
        req.files &&
        req.files.userPhoto
      ){

        user.userPhoto =

          req.files.userPhoto[0].path;

      }



      // ID CARD PHOTO
      if(
        req.files &&
        req.files.idCardPhoto
      ){

        user.idCardPhoto =

          req.files.idCardPhoto[0].path;

      }



await user.save();

console.log("Registration completed");



// WELCOME EMAIL (fire-and-forget — do NOT await so registration always succeeds)
transporter.sendMail({

  from: process.env.EMAIL_USER,

  to: email,

  subject: "Welcome to BusFlux 🚍",

  text: `Hello ${name},

Your registration was successful 🚍`

}).catch(err => console.error("Welcome email failed:", err.message));



return res.status(200).json({

  success: true,

  message: "Registration successful"

});




    } catch (error) {

      return res.status(500).json({

        message:
          error.message

      });

    }

});



// ================= LOGIN =================

router.post(

  "/login",

  async (req, res) => {

    try {

      const {

        email,
        password

      } = req.body;



      const user =
        await User.findOne({

          email

        });



      if(!user){

        return res.status(400).json({

          message:
            "User not found"

        });

      }



      const isMatch =
        await bcrypt.compare(

          password,

          user.password

        );



      if(!isMatch){

        return res.status(400).json({

          message:
            "Invalid password"

        });

      }



      // LOGIN EMAIL
      await transporter.sendMail({

        from:
          process.env.EMAIL_USER,

        to:
          email,

        subject:
          "BusFlux Login Alert",

        text:

`Hello ${user.name},

You have successfully logged into BusFlux 🚍`

      });



      // JWT TOKEN
      const token =
        jwt.sign(

          {

            id: user._id

          },

          process.env.JWT_SECRET,

          {

            expiresIn: "1d"

          }

        );



      return res.status(200).json({

        message:
          "Login successful",

        token,

        role:
          user.role

      });

    } catch (error) {

      return res.status(500).json({

        message:
          error.message

      });

    }

});



// ================= FORGOT PASSWORD =================

router.post(

  "/forgot-password",

  async (req, res) => {

    try {

      const { email } =
        req.body;



      const user =
        await User.findOne({

          email

        });



      if(!user){

        return res.status(400).json({

          message:
            "User not found"

        });

      }



      const otp =
        Math.floor(
          100000 +
          Math.random() * 900000
        ).toString();



      user.resetOtp = otp;

      await user.save();



      // SEND RESET EMAIL
      await transporter.sendMail({

        from:
          process.env.EMAIL_USER,

        to:
          email,

        subject:
          "BusFlux Password Reset OTP",

        text:
          `Your password reset OTP is ${otp}`

      });



      return res.status(200).json({

        message:
          "Reset OTP sent"

      });

    } catch (error) {

      return res.status(500).json({

        message:
          error.message

      });

    }

});



// ================= RESET PASSWORD =================

router.post(

  "/reset-password",

  async (req, res) => {

    try {

      const {

        email,
        otp,
        newPassword

      } = req.body;



      const user =
        await User.findOne({

          email

        });



      if(!user){

        return res.status(400).json({

          message:
            "User not found"

        });

      }



      if(user.resetOtp !== otp){

        return res.status(400).json({

          message:
            "Invalid OTP"

        });

      }



      // HASH NEW PASSWORD
      const hashedPassword =
        await bcrypt.hash(

          newPassword,

          10

        );



      user.password =
        hashedPassword;

      user.resetOtp = "";

      await user.save();



      return res.status(200).json({

        message:
          "Password reset successful"

      });

    } catch (error) {

      return res.status(500).json({

        message:
          error.message

      });

    }

});



module.exports = router;

