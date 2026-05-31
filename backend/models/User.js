
const mongoose =
  require("mongoose");



const userSchema =
  new mongoose.Schema(

    {

      // NAME
      name: {

        type: String,

        default: ""

      },



      // EMAIL
      email: {

        type: String,

        required: true,

        unique: true,

        default: ""

      },



      // PASSWORD
      password: {

        type: String,

        default: ""

      },



      // PHONE NUMBER
      phone: {

        type: String,

        default: ""

      },



      // AGE
      age: {

        type: Number,

        default: 0

      },



      // AGE GROUP
      ageGroup: {

        type: String,

        default: ""

      },



      // AADHAAR NUMBER
      aadhaarNumber: {

        type: String,

        default: ""

      },



      // COLLEGE ID
      collegeId: {

        type: String,

        default: ""

      },



      // PROFILE PHOTO
      userPhoto: {

        type: String,

        default: ""

      },



      // ID CARD PHOTO
      idCardPhoto: {

        type: String,

        default: ""

      },



      // EMAIL OTP
      otp: {

        type: String,

        default: ""

      },



      // EMAIL VERIFIED
      isVerified: {

        type: Boolean,

        default: false

      },



      // RESET PASSWORD OTP
      resetOtp: {

        type: String,

        default: ""

      },



      // USER ROLE
      role: {

        type: String,

        default: "user"

      },



      // WALLET BALANCE
      balance: {

        type: Number,

        default: 3000

      }

    },

    {

      timestamps: true

    }

  );



module.exports =

  mongoose.model(

    "User",

    userSchema

  );

