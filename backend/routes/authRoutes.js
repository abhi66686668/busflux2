
const express = require("express");

const router = express.Router();

const User =
  require("../models/User");

const Transaction = require("../models/Transaction");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const nodemailer =
  require("nodemailer");

const upload =
  require("../middleware/upload");

const auth = require("../middleware/auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SwpXpk7KNwdCU7",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dAW3H935TAk4XwTHo0x7fs0a"
});



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

      console.log(`[OTP Service] Generated OTP for ${email}: ${otp}`);



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
      let emailSent = true;
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "BusFlux OTP Verification",
          text: `Your BusFlux OTP is ${otp}`
        });
      } catch (mailError) {
        console.error("[OTP Service] Nodemailer failed to send email:", mailError.message);
        emailSent = false;
      }

      return res.status(200).json({
        message: emailSent ? "OTP sent successfully" : `OTP simulated! (Dev Fallback: Code is ${otp})`
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



      // LOGIN EMAIL (asynchronous, non-blocking)
      transporter.sendMail({

        from:
          process.env.EMAIL_USER,

        to:
          email,

        subject:
          "BusFlux Login Alert",

        text:

`Hello ${user.name},

You have successfully logged into BusFlux 🚍`

      }).catch(err => console.error("Login email alert failed to send:", err.message));



      // JWT TOKEN
      const token =
        jwt.sign(
          {
            id: user._id,
            role: user.role
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
      let emailSent = true;
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "BusFlux Password Reset OTP",
          text: `Your password reset OTP is ${otp}`
        });
      } catch (mailError) {
        console.error("[OTP Service] Nodemailer failed to send reset email:", mailError.message);
        emailSent = false;
      }

      return res.status(200).json({
        message: emailSent ? "Reset OTP sent" : `Reset OTP simulated! (Dev Fallback: Code is ${otp})`
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



// ================= GET PROFILE (/me) =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -resetOtp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate permanent profile QR code (based on email)
    const qrcode = require("qrcode");
    const qrDataUrl = await qrcode.toDataURL(user.email);
    
    const userObj = user.toObject();
    userObj.profileQr = qrDataUrl;

    return res.status(200).json(userObj);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


// ================= UPDATE PROFILE (/me) =================
router.put("/me", auth, upload.fields([{ name: "userPhoto", maxCount: 1 }]), async (req, res) => {
  try {
    console.log("PUT /me headers:", req.headers["content-type"]);
    console.log("PUT /me body:", req.body);
    const { name, phone, age, experience } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) {
      user.age = Number(age) || 0;
      if(user.age >= 5 && user.age <= 14) user.ageGroup = "Children";
      else if(user.age >= 15 && user.age <= 24) user.ageGroup = "Youth";
      else if(user.age >= 25 && user.age <= 44) user.ageGroup = "Young Adults";
      else if(user.age >= 45 && user.age <= 59) user.ageGroup = "Middle Age";
      else if(user.age >= 60 && user.age <= 74) user.ageGroup = "Elderly";
      else user.ageGroup = "Seniors";
    }
    if (experience !== undefined) {
      user.experience = Number(experience) || 0;
    }

    if (req.files && req.files.userPhoto) {
      user.userPhoto = req.files.userPhoto[0].path.replace(/\\/g, "/");
    }

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});




// ================= RAZORPAY CREATE ORDER =================
router.post("/wallet/create-order", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const rechargeAmount = Number(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({ message: "Invalid recharge amount" });
    }

    const options = {
      amount: rechargeAmount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);
    if (!order) return res.status(500).json({ message: "Error creating order" });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= RAZORPAY VERIFY PAYMENT =================
router.post("/wallet/verify-payment", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, method } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dAW3H935TAk4XwTHo0x7fs0a")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const rechargeAmount = Number(amount);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let bonusPercent = 0.05;
    let passName = "Standard Pass";
    const age = user.age;
    if ((age >= 5 && age <= 14) || age >= 60) {
      bonusPercent = 0.30;
      passName = "Golden Pass";
    } else if (age >= 15 && age <= 24) {
      bonusPercent = 0.20;
      passName = "Youth Express Pass";
    }

    const bonus = Math.round(rechargeAmount * bonusPercent);
    const totalCredit = rechargeAmount + bonus;

    user.balance = (user.balance || 0) + totalCredit;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount: rechargeAmount,
      bonus: bonus,
      totalCredit: totalCredit,
      method: method || "Razorpay",
      status: "Completed"
    });

    return res.status(200).json({
      message: "Payment successful and wallet recharged!",
      rechargeAmount,
      bonus,
      totalCredit,
      newBalance: user.balance,
      passName,
      bonusPercent: bonusPercent * 100
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});



module.exports = router;

