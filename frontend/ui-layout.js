const UI_API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

// ── Sidebar ──
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Theme ──
function toggleTheme() {
  // Uses script.js toggleTheme if available
  const icon = document.querySelector('#themeBtn i');
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  if (newTheme === 'dark') {
    if (icon) { icon.classList.replace('fa-moon', 'fa-sun'); }
    localStorage.setItem('theme', 'dark');
  } else {
    if (icon) { icon.classList.replace('fa-sun', 'fa-moon'); }
    localStorage.setItem('theme', 'light');
  }
}

// Apply saved theme on load
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  const icon = document.querySelector('#themeBtn i');
  if (icon) { icon.classList.replace('fa-moon', 'fa-sun'); }
}

// ── Trip Tabs ──
function setTripTab(btn) {
  document.querySelectorAll('.trip-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// ── Swap Locations ──
function swapLocations() {
  const from = document.getElementById('searchFrom');
  const to = document.getElementById('searchTo');
  const tmp = from.value;
  from.value = to.value;
  to.value = tmp;
}

// ── Search Buses ──
function searchBuses() {
  const from = document.getElementById('searchFrom').value.trim();
  const to = document.getElementById('searchTo').value.trim();
  const date = document.getElementById('searchDate').value;
  const passengers = document.getElementById('searchPassengers').value;

  let url = 'buses.html?';
  if (from) url += `from=${encodeURIComponent(from)}&`;
  if (to) url += `to=${encodeURIComponent(to)}&`;
  if (date) url += `date=${encodeURIComponent(date)}&`;
  if (passengers) url += `passengers=${encodeURIComponent(passengers)}`;

  window.location.href = url;
}

// Set default date to today
const today = new Date().toISOString().split('T')[0];
const sd = document.getElementById('searchDate'); if(sd) sd.value = today;
if(sd) sd.min = today;

// ── Global Search ──
function handleGlobalSearch(val) {
  const isOnBusesPage = !!document.getElementById('busList');

  if (isOnBusesPage) {
    // Live filter bus cards already rendered on buses.html
    const query = val.trim().toLowerCase();
    const cards = document.querySelectorAll('#busList .bus-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      const matches = !query || text.includes(query);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    // Show no-results message if nothing matches
    let noRes = document.getElementById('searchNoResults');
    if (!noRes) {
      noRes = document.createElement('div');
      noRes.id = 'searchNoResults';
      noRes.className = 'empty-state';
      noRes.innerHTML = '<i class="fas fa-search"></i><p>No buses match your search. Try a different route or city.</p>';
      document.getElementById('busList').appendChild(noRes);
    }
    noRes.style.display = (query && visibleCount === 0) ? 'flex' : 'none';

  } else {
    // On index.html — redirect to buses.html with search query on Enter or after short delay
    clearTimeout(window._searchRedirectTimer);
    if (val.trim().length > 1) {
      window._searchRedirectTimer = setTimeout(() => {
        window.location.href = `buses.html?search=${encodeURIComponent(val.trim())}`;
      }, 800);
    }
  }
}


// On buses.html — auto-apply search query from URL on page load
// Uses readyState check because ui-layout.js loads after DOM is already parsed
function applyUrlSearch() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('search');
  if (!q || !document.getElementById('busList')) return;

  const searchInput = document.getElementById('globalSearch');
  if (searchInput) searchInput.value = q;

  // Poll until bus cards are rendered (loadBuses has a ~1200ms delay)
  const tryFilter = () => {
    const cards = document.querySelectorAll('#busList .bus-card');
    if (cards.length === 0) {
      setTimeout(tryFilter, 300);
    } else {
      handleGlobalSearch(q);
    }
  };
  tryFilter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyUrlSearch);
} else {
  applyUrlSearch();
}


// ── Populate city datalists from backend ──
async function populateCities() {
  try {
    const res = await fetch(`${UI_API_BASE_URL}/buses`);
    if (!res.ok) return;
    const buses = await res.json();
    const froms = [...new Set(buses.map(b => b.from).filter(Boolean))];
    const tos = [...new Set(buses.map(b => b.to).filter(Boolean))];
    const allCities = [...new Set([...froms, ...tos])];

    const fromList = document.getElementById('fromCities');
    const toList = document.getElementById('toCities');
    allCities.forEach(city => {
      if(fromList) fromList.innerHTML += `<option value="${city}">`;
      if(toList) toList.innerHTML += `<option value="${city}">`;
    });
  } catch(e) { /* silent */ }
}
populateCities();

// ── Notification dropdown ──
function toggleNotiDropdown(e) {
  console.log('toggleNotiDropdown click event triggered');
  e.stopPropagation();
  const d = document.getElementById('userNotiDropdown');
  if (d) {
    d.classList.toggle('open');
    console.log('Dropdown open class toggled, is open:', d.classList.contains('open'));
    if (d.classList.contains('open')) {
      d.style.display = 'block';
      fetchUserNotifications();
    } else {
      d.style.display = 'none';
    }
  } else {
    console.error('userNotiDropdown element not found!');
  }
}

document.addEventListener('click', (e) => {
  const d = document.getElementById('userNotiDropdown');
  if (d && !e.target.closest('#notiWrap')) {
    d.classList.remove('open');
    d.style.display = 'none';
  }
});

// ── Booking access check ──
function checkBookingAccess() {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please login first to view your bookings.', 'warning');
    setTimeout(() => window.location.href = 'login.html', 1500);
  } else {
    window.location.href = 'bookings.html';
  }
}

// ── Misc UI helpers ──
function showOffersToast() {
  showToast('🎉 Use code FLUX10 for 10% off your first booking!', 'success');
}

// ── Help center toast ──
function showHelpToast() {
  showToast('📞 Help Center coming soon! Email us at support@busflux.in', 'info');
}

function scrollToStats() {
  const el = document.getElementById('statsSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  else showToast('Track Bus feature coming soon!', 'info');
}

// ── Enhanced Navbar updater for sidebar ──
async function updateSidebarUser() {
  const token = localStorage.getItem('token');
  const loginBtn = document.getElementById('topLoginBtn');
  const notiWrap = document.getElementById('notiWrap');
  const sidebarOffer = document.getElementById('sidebarOffer');

  if (!token) {
    // Show sidebar offer when logged out
    if (sidebarOffer) sidebarOffer.style.display = 'block';
    if (loginBtn) loginBtn.style.display = '';
    if (notiWrap) notiWrap.style.display = 'none';
    return;
  }

  // Hide offer, hide login btn, show noti
  if (sidebarOffer) sidebarOffer.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'none';
  if (notiWrap) notiWrap.style.display = '';

  try {
    const res = await fetch(`${UI_API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { localStorage.removeItem('token'); location.reload(); return; }
    const user = await res.json();

    // Update sidebar user info
    const nameEl = document.getElementById('sidebarUserName');
    const actionEl = document.getElementById('sidebarUserAction');
    const avatarEl = document.getElementById('sidebarAvatar');

    if (nameEl) nameEl.textContent = `Hi, ${user.name?.split(' ')[0] || 'Traveler'} 👋`;
    if (actionEl) {
      actionEl.textContent = 'Log out';
      actionEl.href = '#';
      actionEl.style.color = '#ef4444';
      actionEl.onclick = function(e) { 
        e.preventDefault(); 
        e.stopPropagation(); 
        logout(); 
      };
    }
    if (avatarEl && user.userPhoto) {
      avatarEl.innerHTML = '';
      const img = document.createElement('img');
      const baseUrl = UI_API_BASE_URL.replace('/api', '');
      const photoPath = user.userPhoto.startsWith('/') ? user.userPhoto : '/' + user.userPhoto;
      img.src = baseUrl + photoPath;
      img.alt = user.name || 'User';
      img.onerror = () => {
        avatarEl.innerHTML = '<i class="fas fa-user"></i>';
      };
      avatarEl.appendChild(img);
    }

    // Wallet balance hidden from sidebar nav

    // Conductor / Admin redirects (unless on register page to allow staff to register new users)
    const currentPath = window.location.pathname.toLowerCase();
    if (!currentPath.includes('register.html')) {
      if (user.role === 'conductor') {
        window.location.href = 'conductor.html'; return;
      }
      if (user.role === 'admin') {
        window.location.href = 'admin.html'; return;
      }
    }

    // Fetch notifications
    fetchUserNotifications();
    if (user._id) initUserWebSocket(user._id);

  } catch(e) { console.error('Sidebar user update failed:', e); }
}

function handleSidebarUserClick() {
  const token = localStorage.getItem('token');
  if (token) window.location.href = 'profile.html';
  else window.location.href = 'login.html';
}

// Run on load — handle case where DOMContentLoaded already fired (e.g. wallet.html with inline scripts)
function uiLayoutInit() {
  updateSidebarUser();
  if (typeof updateNavbar === 'function') updateNavbar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', uiLayoutInit);
} else {
  // DOM already loaded — run immediately
  uiLayoutInit();
}
