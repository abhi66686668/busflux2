
const express =
  require("express");

const cors =
  require("cors");

const dotenv =
  require("dotenv");



// ================= ENV =================

dotenv.config();



// ================= DATABASE =================

const connectDB =
  require("./config/db");



// ================= ROUTES =================

const authRoutes =
  require("./routes/authRoutes");

const busRoutes =
  require("./routes/busRoutes");

const bookingRoutes =
  require("./routes/bookingRoutes");



// ================= CONNECT DATABASE =================

connectDB();



// ================= EXPRESS APP =================

const app =
  express();



// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());



// ================= STATIC UPLOADS =================

app.use(

  "/uploads",

  express.static("uploads")

);



// ================= API ROUTES =================

// AUTH
app.use(

  "/api/auth",

  authRoutes

);


// BUSES
app.use(

  "/api/buses",

  busRoutes

);


// BOOKINGS
app.use(

  "/api/bookings",

  bookingRoutes

);



// ================= HOME ROUTE =================

app.get(

  "/",

  (req, res) => {

    res.send(

      "BusFlux Backend Running 🚍"

    );

});



// ================= SERVER =================

const PORT =

  process.env.PORT ||

  5000;



app.listen(

  PORT,

  () => {

    console.log(

      `Server running on port ${PORT}`

    );

});