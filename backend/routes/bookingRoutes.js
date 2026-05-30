const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Bus = require("../models/Bus");
const auth = require("../middleware/auth");


// ================= BOOK TICKET =================
router.post("/book/:busId", auth, async (req, res) => {

  try {

    const { seatsBooked } = req.body;

    const bus = await Bus.findById(req.params.busId);

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found"
      });
    }

    // CHECK AVAILABLE SEATS
    if (bus.availableSeats < seatsBooked) {
      return res.status(400).json({
        message: "Not enough seats available"
      });
    }

    // CALCULATE PRICE
    const totalPrice = bus.price * seatsBooked;

    // CREATE BOOKING
    const booking = await Booking.create({
      userId: req.user.id,
      busId: bus._id,
      seatsBooked,
      totalPrice
    });

    // REDUCE SEATS
    bus.availableSeats -= seatsBooked;

    await bus.save();

    res.status(201).json({
      message: "Ticket booked successfully",
      booking
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


// ================= USER BOOKINGS =================
router.get("/my-bookings", auth, async (req, res) => {

  try {

    const bookings = await Booking.find({
      userId: req.user.id
    }).populate("busId");

    res.status(200).json(bookings);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

module.exports = router;