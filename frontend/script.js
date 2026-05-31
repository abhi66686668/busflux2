// ================= UTILITIES & GLOBAL SETTINGS =================

// Base URL for backend API
const API_BASE_URL = "http://localhost:5000/api";

// Custom Toast Notification System
function showToast(message, type = 'info') {
  let container = document.getElementById("toastContainer");
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';
  
  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4000);
}

// Dynamic Navbar State Updater
function updateNavbar() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  
  const token = localStorage.getItem("token");
  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";
  
  let html = `
    <li><a href="index.html" class="${page === 'index.html' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a></li>
    <li><a href="buses.html" class="${page === 'buses.html' ? 'active' : ''}"><i class="fas fa-bus"></i> Buses</a></li>
  `;
  
  if (token) {
    html += `
      <li><a href="bookings.html" class="${page === 'bookings.html' ? 'active' : ''}"><i class="fas fa-ticket"></i> My Bookings</a></li>
      <li><button class="logout-btn-nav" onclick="logout()"><i class="fas fa-right-from-bracket"></i> Logout</button></li>
    `;
  } else {
    html += `
      <li><a href="register.html" class="${page === 'register.html' ? 'active' : ''}">Register</a></li>
      <li><a href="login.html" class="nav-btn ${page === 'login.html' ? 'active' : ''}">Login</a></li>
    `;
  }
  
  navLinks.innerHTML = html;
}

// Run navbar setup when DOM loads
document.addEventListener("DOMContentLoaded", updateNavbar);



// ================= REGISTER =================

const registerForm =
  document.getElementById(
    "registerForm"
  );

if(registerForm){

  registerForm.addEventListener(

    "submit",

    async (e) => {

      e.preventDefault();

      if(!isOtpVerified){

        showToast(
          "Please verify OTP first",
          "warning"
        );

        return;

      }

      const submitBtn =
        registerForm.querySelector(
          "button[type='submit']"
        );

      const originalBtnText =
        submitBtn.innerHTML;

      submitBtn.disabled = true;

      submitBtn.innerHTML =
        `<i class="fas fa-spinner fa-spin"></i> Registering...`;

      try {

        const formData =
          new FormData();

        formData.append(
          "name",
          document.getElementById("name").value
        );

        formData.append(
          "email",
          document.getElementById("email").value
        );

        formData.append(
          "phone",
          document.getElementById("phone").value
        );

        formData.append(
          "age",
          document.getElementById("age").value
        );

        formData.append(
          "aadhaarNumber",
          document.getElementById("aadhaarNumber").value
        );

        formData.append(
          "collegeId",
          document.getElementById("collegeId").value
        );

        formData.append(
          "password",
          document.getElementById("password").value
        );

        formData.append(
          "userPhoto",
          document.getElementById("userPhoto").files[0]
        );

        formData.append(
          "idCardPhoto",
          document.getElementById("idCardPhoto").files[0]
        );



        const response =
          await fetch(

            `${API_BASE_URL}/auth/register`,

            {

              method: "POST",

              body: formData

            }

          );

        const data =
          await response.json();

        showToast(
          data.message,
          response.ok ? "success" : "error"
        );



    
if(response.ok){

  registerForm.reset();

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);

}



      } catch (error) {

        console.log(error);

        showToast(
          "Registration failed",
          "error"
        );

      } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
          originalBtnText;

      }

  });

}



// ================= OTP VERIFICATION =================

let isOtpVerified = false;



// SEND OTP
async function sendOtp(){

  try {

    const email =
      document.getElementById(
        "email"
      ).value;

    if(!email){

      showToast(
        "Please enter email first",
        "warning"
      );

      return;

    }

    const response =
      await fetch(

        `${API_BASE_URL}/auth/send-otp`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );



    // SHOW OTP SECTION
    if(response.ok){

      document.getElementById(
        "otpSection"
      ).style.display =
        "block";

    }

  } catch (error) {

    console.log(error);

    showToast(
      "Failed to send OTP",
      "error"
    );

  }

}



// VERIFY OTP
async function verifyOtp(){

  try {

    const email =
      document.getElementById(
        "email"
      ).value;

    const otp =
      document.getElementById(
        "otp"
      ).value;

    const response =
      await fetch(

        `${API_BASE_URL}/auth/verify-otp`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email,
            otp

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );



    if(response.ok){

      isOtpVerified = true;

    }

  } catch (error) {

    console.log(error);

  }

}



// ================= LOGIN =================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    // UI Loading state
    const submitBtn = loginForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Logging in...`;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // SAVE TOKEN
        localStorage.setItem("token", data.token);

        showToast("Logged in successfully!", "success");
        document.getElementById("loginMessage").innerText = "";

        // REDIRECT
        setTimeout(() => {
          window.location.href = "buses.html";
        }, 1500);
      } else {
        showToast(data.message || "Invalid credentials.", "error");
        document.getElementById("loginMessage").innerText = data.message || "Login failed.";
        document.getElementById("loginMessage").style.color = "var(--danger)";
      }
    } catch (error) {
      console.error(error);
      showToast("Network error. Please check your connection.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}


// ================= LOAD BUSES =================

const busList = document.getElementById("busList");

if (busList) {
  async function loadBuses() {
    try {
      const response = await fetch(`${API_BASE_URL}/buses`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch buses");
      }

      const buses = await response.json();
      busList.innerHTML = "";

      if (buses.length === 0) {
        busList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bus"></i>
            <p>No available buses found at this moment.</p>
          </div>
        `;
        return;
      }

      buses.forEach(bus => {
        // Render styled ticket card
        busList.innerHTML += `
          <div class="bus-card">
            <div class="bus-header">
              <div class="bus-name-wrap">
                <h3>${bus.busName}</h3>
                <span class="bus-type-badge">${bus.busName.toLowerCase().includes('sleeper') ? '<i class="fas fa-bed"></i> Luxury Sleeper' : '<i class="fas fa-snowflake"></i> Express AC'}</span>
              </div>
              <div class="bus-price">₹${bus.price}</div>
            </div>
            
            <div class="bus-route-visual">
              <div class="route-point from">
                <div class="route-label">From</div>
                <div class="route-name">${bus.from}</div>
              </div>
              <div class="route-line-wrap">
                <i class="fas fa-bus route-bus-icon"></i>
                <div class="route-line"></div>
              </div>
              <div class="route-point to">
                <div class="route-label">To</div>
                <div class="route-name">${bus.to}</div>
              </div>
            </div>
            
            <div class="bus-footer">
              <div class="seats-indicator">
                <span class="seats-dot ${bus.availableSeats > 10 ? 'available' : bus.availableSeats > 0 ? 'limited' : 'full'}"></span>
                <span class="seats-count"><span>${bus.availableSeats}</span> seats left</span>
              </div>
              <button onclick="bookBus('${bus._id}', this)" ${bus.availableSeats === 0 ? 'disabled' : ''}>
                <i class="fas fa-ticket"></i> ${bus.availableSeats === 0 ? 'Sold Out' : 'Book Ticket'}
              </button>
            </div>
          </div>
        `;
      });
    } catch (error) {
      console.error(error);
      busList.innerHTML = `
        <div class="empty-state" style="color: var(--danger);">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load routes. Is the backend server running?</p>
        </div>
      `;
      showToast("Error loading buses from API.", "error");
    }
  }

  loadBuses();
}


// ================= BOOK BUS =================

async function bookBus(busId, buttonElement) {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Please login or register first to reserve tickets.", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }
  
  // Disable button and show spinner
  let originalBtnHTML = "";
  if (buttonElement) {
    originalBtnHTML = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Booking...`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/book/${busId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        seatsBooked: 1
      })
    });

    const data = await response.json();

    if (response.ok) {
      showToast(data.message || "Ticket booked successfully!", "success");
      
      // Reload page after a delay to display updated seats
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      showToast(data.message || "Failed to book ticket.", "error");
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalBtnHTML;
      }
    }
  } catch (error) {
    console.error(error);
    showToast("Connection error while reserving ticket.", "error");
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.innerHTML = originalBtnHTML;
    }
  }
}


// ================= LOAD BOOKINGS =================

const bookingList = document.getElementById("bookingList");

if (bookingList) {
  async function loadBookings() {
    const token = localStorage.getItem("token");

    // CHECK LOGIN
    if (!token) {
      showToast("Please register or login to view bookings.", "warning");
      setTimeout(() => {
        window.location.href = "register.html";
      }, 1500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const bookings = await response.json();
      bookingList.innerHTML = "";

      if (bookings.length === 0) {
        bookingList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>You have not booked any boarding passes yet.</p>
            <a href="buses.html" style="text-decoration: none; display: inline-block; margin-top: 10px;">
              <button style="width: auto; padding: 10px 20px;"><i class="fas fa-search"></i> Search Buses</button>
            </a>
          </div>
        `;
        return;
      }

      bookings.forEach(booking => {
        // Safe check for nested fields in case database objects are incomplete
        const busName = booking.busId ? booking.busId.busName : "Bus Route";
        const fromLoc = booking.busId ? booking.busId.from : "N/A";
        const toLoc = booking.busId ? booking.busId.to : "N/A";
        const ticketIdSuffix = booking._id ? booking._id.substring(booking._id.length - 8).toUpperCase() : "XXXX";

        // Render boarding pass card
        bookingList.innerHTML += `
          <div class="booking-card">
            <div class="ticket-header">
              <span class="ticket-brand"><i class="fas fa-bus-alt"></i> BusFlux Boarding Pass</span>
              <span class="ticket-status">Confirmed</span>
            </div>
            
            <div class="ticket-body">
              <div class="ticket-grid">
                <div class="ticket-info-item">
                  <span class="info-label">Bus Service</span>
                  <span class="info-value">${busName}</span>
                </div>
                <div class="ticket-info-item" style="text-align: right;">
                  <span class="info-label">Seat Quantity</span>
                  <span class="info-value">${booking.seatsBooked} seat(s)</span>
                </div>
              </div>
              
              <div class="ticket-divider">
                <div class="divider-notch left"></div>
                <div class="divider-line"></div>
                <div class="divider-notch right"></div>
              </div>
              
              <div class="ticket-grid">
                <div class="ticket-info-item">
                  <span class="info-label">Route</span>
                  <span class="info-value">${fromLoc} ➔ ${toLoc}</span>
                </div>
                <div class="ticket-info-item" style="text-align: right;">
                  <span class="info-label">Total Paid</span>
                  <span class="info-value" style="color: #a855f7; font-weight: 800;">₹${booking.totalPrice}</span>
                </div>
              </div>
            </div>
            
            <div class="ticket-footer">
              <div class="barcode-aesthetic"></div>
              <div class="ticket-number">TICKET #${ticketIdSuffix}</div>
            </div>
          </div>
        `;
      });
    } catch (error) {
      console.error(error);
      bookingList.innerHTML = `
        <div class="empty-state" style="color: var(--danger);">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load bookings. Please try again later.</p>
        </div>
      `;
      showToast("Error loading bookings from API.", "error");
    }
  }

  loadBookings();
}


// ================= LOGOUT =================

function logout() {
  localStorage.removeItem("token");
  showToast("Logged out successfully.", "success");

  // Redirect after delay
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
}


// ================= CHECK BOOKING ACCESS =================

function checkBookingAccess() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Please register or login first to access bookings.", "warning");
    setTimeout(() => {
      window.location.href = "register.html";
    }, 1500);
  } else {
    window.location.href = "bookings.html";
  }
}


// ================= FORGOT PASSWORD =================

async function forgotPassword(){

  try {

    const email =
      document.getElementById(
        "forgotEmail"
      ).value;

    const response =
      await fetch(

        `${API_BASE_URL}/auth/forgot-password`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );

  } catch (error) {

    console.log(error);

  }

}



// RESET PASSWORD
async function resetPassword(){

  try {

    const email =
      document.getElementById(
        "forgotEmail"
      ).value;

    const otp =
      document.getElementById(
        "forgotOtp"
      ).value;

    const newPassword =
      document.getElementById(
        "newPassword"
      ).value;

    const response =
      await fetch(

        `${API_BASE_URL}/auth/reset-password`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email,
            otp,
            newPassword

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );



    if(response.ok){

      setTimeout(() => {

        window.location.href =
          "login.html";

      }, 1500);

    }

  } catch (error) {

    console.log(error);

  }

}

