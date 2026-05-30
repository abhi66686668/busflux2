// ================= REGISTER =================

const registerForm = document.getElementById("registerForm");

if(registerForm){

  registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      const data = await response.json();

      document.getElementById("message").innerText = data.message;

    } catch (error) {

      console.log(error);

    }

  });

}



// ================= LOGIN =================

const loginForm = document.getElementById("loginForm");

if(loginForm){

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if(data.token){

        // SAVE TOKEN
        localStorage.setItem("token", data.token);

        document.getElementById("loginMessage").innerText =
          data.message;

        // REDIRECT
        window.location.href = "buses.html";

      } else {

        document.getElementById("loginMessage").innerText =
          data.message;

      }

    } catch (error) {

      console.log(error);

    }

  });

}



// ================= LOAD BUSES =================

const busList = document.getElementById("busList");

if(busList){

  async function loadBuses(){

    try {

      const response = await fetch(
        "http://localhost:5000/api/buses"
      );

      const buses = await response.json();

      busList.innerHTML = "";

      buses.forEach(bus => {

        busList.innerHTML += `

          <div class="bus-card">

            <h3>${bus.busName}</h3>

            <p>${bus.from} → ${bus.to}</p>

            <p>Price: ₹${bus.price}</p>

            <p>Seats Available: ${bus.availableSeats}</p>

            <button onclick="bookBus('${bus._id}')">
              Book Now
            </button>

          </div>

        `;

      });

    } catch (error) {

      console.log(error);

    }

  }

  loadBuses();

}



// ================= BOOK BUS =================

async function bookBus(busId){

  const token = localStorage.getItem("token");

  if(!token){

    alert("Please login first");

    window.location.href = "login.html";

    return;
  }

  try {

    const response = await fetch(
      `http://localhost:5000/api/bookings/book/${busId}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          seatsBooked: 1
        })
      }
    );

    const data = await response.json();

    alert(data.message);

    // RELOAD PAGE
    location.reload();

  } catch (error) {

    console.log(error);

  }

}



// ================= LOAD BOOKINGS =================

const bookingList = document.getElementById("bookingList");

if(bookingList){

  async function loadBookings(){

    const token = localStorage.getItem("token");

    // CHECK LOGIN
    if(!token){

      alert("Before booking you should register/login");

      window.location.href = "register.html";

      return;
    }

    try {

      const response = await fetch(
        "http://localhost:5000/api/bookings/my-bookings",
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const bookings = await response.json();

      bookingList.innerHTML = "";

      bookings.forEach(booking => {

        bookingList.innerHTML += `

          <div class="bus-card">

            <h3>${booking.busId.busName}</h3>

            <p>${booking.busId.from} → ${booking.busId.to}</p>

            <p>Seats Booked: ${booking.seatsBooked}</p>

            <p>Total Price: ₹${booking.totalPrice}</p>

          </div>

        `;

      });

    } catch (error) {

      console.log(error);

    }

  }

  loadBookings();

}



// ================= LOGOUT =================

function logout(){

  localStorage.removeItem("token");

  alert("Logged out successfully");

  window.location.href = "login.html";

}



// ================= CHECK BOOKING ACCESS =================

function checkBookingAccess(){

  const token = localStorage.getItem("token");

  if(!token){

    alert("Before booking you should register/login");

    window.location.href = "register.html";

  } else {

    window.location.href = "bookings.html";

  }

}