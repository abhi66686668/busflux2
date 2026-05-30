const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },

  seatsBooked: {
    type: Number,
    required: true
  },

  totalPrice: {
    type: Number,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);