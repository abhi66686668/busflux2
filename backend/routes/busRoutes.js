const express = require("express");
const router = express.Router();

const Bus = require("../models/Bus");


// ================= ADD BUS =================
router.post("/add", async (req, res) => {

  try {

    const bus = await Bus.create(req.body);

    res.status(201).json({
      message: "Bus added successfully",
      bus
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


// ================= GET ALL BUSES =================
router.get("/", async (req, res) => {

  try {

    const buses = await Bus.find();

    res.status(200).json(buses);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

module.exports = router;