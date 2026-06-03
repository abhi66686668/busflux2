const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const Bus = require("../models/Bus");
const User = require("../models/User");
const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper: get age-group price
function getAgeGroupPrice(bus, ageGroup) {
  const map = {
    "Children": bus.childPrice,
    "Youth": bus.youthPrice,
    "Young Adults": bus.youngAdultPrice,
    "Middle Age": bus.middleAgePrice,
    "Elderly": bus.elderlyPrice,
    "Seniors": bus.seniorPrice,
  };
  const p = map[ageGroup];
  return p && p > 0 ? p : bus.price;
}

function getStopRatio(bus, boardingPoint, droppingPoint) {
  const allStops = [bus.from, ...(bus.stops || []), bus.to];
  const total = allStops.length - 1;
  if (total === 0) return 1;
  const bIdx = allStops.findIndex(s => s.toLowerCase() === boardingPoint.toLowerCase());
  const dIdx = allStops.findIndex(s => s.toLowerCase() === droppingPoint.toLowerCase());
  if (bIdx === -1 || dIdx === -1 || dIdx <= bIdx) return 1;
  return (dIdx - bIdx) / total;
}


// ================= CREATE ORDER (for ticket booking) =================
router.post("/create-order", auth, async (req, res) => {
  try {
    const { busId, seatsBooked, boardingPoint, droppingPoint } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    if (bus.availableSeats < seatsBooked)
      return res.status(400).json({ message: "Not enough seats available" });

    const user = await User.findById(req.user.id);
    const ageGroup = user?.ageGroup || "";
    const basePrice = getAgeGroupPrice(bus, ageGroup);
    const ratio = getStopRatio(bus, boardingPoint || bus.from, droppingPoint || bus.to);
    const pricePerSeat = Math.round(basePrice * ratio);
    const totalPrice = pricePerSeat * seatsBooked;

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: totalPrice * 100,
      currency: "INR",
      receipt: `b_${Date.now()}`,
      notes: {
        busId,
        userId: req.user.id,
        seatsBooked: String(seatsBooked),
        boardingPoint: boardingPoint || bus.from,
        droppingPoint: droppingPoint || bus.to
      }
    });

    res.status(200).json({
      orderId: order.id,
      amount: totalPrice,
      amountPaise: totalPrice * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      busName: bus.busName,
      userName: user?.name || "",
      userEmail: user?.email || "",
      userPhone: user?.phone || ""
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: error.message });
  }
});


// ================= VERIFY PAYMENT =================
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      busId,
      seatsBooked,
      boardingPoint,
      droppingPoint
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Payment verified — create booking
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const user = await User.findById(req.user.id);
    const ageGroup = user?.ageGroup || "";
    const basePrice = getAgeGroupPrice(bus, ageGroup);
    const ratio = getStopRatio(bus, boardingPoint || bus.from, droppingPoint || bus.to);
    const pricePerSeat = Math.round(basePrice * ratio);
    const totalPrice = pricePerSeat * seatsBooked;

    const booking = await Booking.create({
      userId: req.user.id,
      busId: bus._id,
      seatsBooked,
      totalPrice,
      boardingPoint: boardingPoint || bus.from,
      droppingPoint: droppingPoint || bus.to,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentMethod: "razorpay",
      paymentStatus: "paid"
    });

    // Reduce seats
    bus.availableSeats -= seatsBooked;
    await bus.save();

    // Generate QR Code first
    const ticketId = booking._id.toString().slice(-8).toUpperCase();
    const qrcode = require("qrcode");
    const qrDataUrl = await qrcode.toDataURL(ticketId);

    // Send email (fire-and-forget)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `BusFlux Ticket Confirmed - #${ticketId} ✅`,
        html: `Hello ${user.name},<br><br>Your payment of ₹${totalPrice} was successful!<br><br>Ticket: #${ticketId}<br>Bus: ${bus.busName}<br>Route: ${booking.boardingPoint} → ${booking.droppingPoint}<br>Seats: ${seatsBooked}<br>Payment ID: ${razorpay_payment_id}<br><br><img src="cid:qrCodeImage" /><br><br>Have a safe journey! 🚍`,
        attachments: [{ filename: "ticket-qr.png", path: qrDataUrl, cid: "qrCodeImage" }]
      }).catch(err => console.error("Email failed:", err.message));
    } catch (e) {}

    res.status(201).json({
      message: "Payment successful! Ticket booked.",
      booking,
      totalPrice,
      paymentId: razorpay_payment_id,
      qrCode: qrDataUrl
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: error.message });
  }
});


// ================= WALLET RECHARGE ORDER =================
router.post("/wallet-recharge", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(req.user.id);

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `w_${Date.now()}`,
      notes: { userId: req.user.id, type: "wallet_recharge" }
    });

    res.status(200).json({
      orderId: order.id,
      amount,
      amountPaise: amount * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      userName: user?.name || "",
      userEmail: user?.email || "",
      userPhone: user?.phone || ""
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= VERIFY WALLET RECHARGE =================
router.post("/wallet-verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const user = await User.findById(req.user.id);
    user.balance = (user.balance || 0) + amount;
    await user.save();

    res.status(200).json({
      message: `₹${amount} added to wallet successfully!`,
      newBalance: user.balance,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= GET WALLET BALANCE =================
router.get("/wallet-balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ balance: user?.balance || 0, name: user?.name || "" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
