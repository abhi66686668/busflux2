const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({

  busName: {
    type: String,
    required: true
  },

  from: {
    type: String,
    required: true
  },

  to: {
    type: String,
    required: true
  },

  departureTime: {
    type: String,
    required: true
  },

  arrivalTime: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  totalSeats: {
    type: Number,
    default: 40
  },

  availableSeats: {
    type: Number,
    default: 40
  }

}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);