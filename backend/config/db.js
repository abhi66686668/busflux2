const mongoose = require("mongoose");
const dns = require("dns");

// Set public DNS servers to resolve MongoDB SRV connection string correctly on local networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("DNS setServers warning:", dnsErr.message);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB Error:", error.message);
  }
};

module.exports = connectDB;
