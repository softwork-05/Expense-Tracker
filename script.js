// ==========================================================================
// Firebase Configuration & Initialization
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDuhAqfVJ_as3q5LV1IjibRMRCMRweNhRM",
  authDomain: "income-tracker-4c2a5.firebaseapp.com",
  projectId: "income-tracker-4c2a5",
  storageBucket: "income-tracker-4c2a5.firebasestorage.app",
  messagingSenderId: "805849206198",
  appId: "1:805849206198:web:9138ef3c65a5feb1978517",
  measurementId: "G-X8CYHZPPZY"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentTransactions = []; // Cached transactions for client-side search & filtering
let activeRecurringRules = []; // Cached recurring rules
let activeMonthKey = getCurrentMonthKey(); // e.g. "2026-10" or "ALL"
let currentSortDirection = 'desc'; // 'desc' = Newest date & time first, 'asc' = Oldest first

// ==========================================================================
// Theme Management (Dark / Light)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('smartflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('smartflow_theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

// Run theme setup immediately
initTheme();

// ==========================================================================
// Modern Toast Notification System
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// Auth Mode Switcher & Real-time Validation Engine
// ==========================================================================
let currentAuthMode = 'login'; // 'login' or 'signup'

function switchAuthTab(mode) {
  currentAuthMode = mode;
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const authTitle = document.getElementById('authTitle');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const authSwitchPrompt = document.getElementById('authSwitchPrompt');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  const passwordValidationBox = document.getElementById('passwordValidationBox');
  const forgotPwdBtn = document.getElementById('forgotPwdBtn');

  // Clear previous hints
  clearAuthHints();

  if (mode === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    authTitle.innerText = 'Welcome Back';
    loginBtn.style.display = 'inline-flex';
    signupBtn.style.display = 'none';
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
    if (passwordValidationBox) passwordValidationBox.style.display = 'none';
    if (forgotPwdBtn) forgotPwdBtn.style.display = 'inline';
    authSwitchPrompt.innerHTML = `Don't have an account? <a href="javascript:void(0)" onclick="switchAuthTab('signup')">Sign up</a>`;
  } else {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    authTitle.innerText = 'Create an Account';
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'inline-flex';
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'flex';
    if (passwordValidationBox) passwordValidationBox.style.display = 'block';
    if (forgotPwdBtn) forgotPwdBtn.style.display = 'none';
    authSwitchPrompt.innerHTML = `Already have an account? <a href="javascript:void(0)" onclick="switchAuthTab('login')">Log in</a>`;
    validatePasswordLive();
  }
}

function clearAuthHints() {
  const emailHint = document.getElementById('authEmailHint');
  const confirmHint = document.getElementById('authConfirmHint');
  if (emailHint) emailHint.innerText = '';
  if (confirmHint) confirmHint.innerText = '';
}

function togglePasswordVisibility(fieldId, btn) {
  const input = document.getElementById(fieldId);
  const icon = btn.querySelector('i');
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-regular fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-regular fa-eye';
  }
}

// Strict Email Regex Validation
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return emailRegex.test(String(email).toLowerCase());
}

// Live Password Validation & Strength Meter
function validatePasswordLive() {
  const pwdInput = document.getElementById('authPassword');
  const confirmInput = document.getElementById('authConfirmPassword');
  const strengthBar = document.getElementById('pwdStrengthBar');
  const strengthText = document.getElementById('pwdStrengthText');
  const critLength = document.getElementById('critLength');
  const critLetter = document.getElementById('critLetter');
  const confirmHint = document.getElementById('authConfirmHint');

  if (!pwdInput) return;
  const pwd = pwdInput.value;

  // Criteria Checks
  const hasLength = pwd.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasBoth = hasLetter && hasNumber;

  if (critLength) {
    critLength.className = 'pwd-crit ' + (hasLength ? 'valid' : 'invalid');
    critLength.innerHTML = `<i class="fa-solid ${hasLength ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> At least 6 characters`;
  }

  if (critLetter) {
    critLetter.className = 'pwd-crit ' + (hasBoth ? 'valid' : 'invalid');
    critLetter.innerHTML = `<i class="fa-solid ${hasBoth ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> Contains letters & numbers`;
  }

  // Calculate Strength
  let score = 0;
  if (hasLength) score++;
  if (pwd.length >= 8) score++;
  if (hasBoth) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

  if (strengthBar && strengthText) {
    if (pwd.length === 0) {
      strengthBar.style.width = '0%';
      strengthBar.style.background = 'transparent';
      strengthText.innerText = 'Password strength: Waiting for input';
      strengthText.style.color = 'var(--text-muted)';
    } else if (score <= 1) {
      strengthBar.style.width = '25%';
      strengthBar.style.background = '#f43f5e';
      strengthText.innerText = 'Password strength: Weak';
      strengthText.style.color = '#f43f5e';
    } else if (score === 2) {
      strengthBar.style.width = '55%';
      strengthBar.style.background = '#f59e0b';
      strengthText.innerText = 'Password strength: Moderate';
      strengthText.style.color = '#f59e0b';
    } else {
      strengthBar.style.width = '100%';
      strengthBar.style.background = '#10b981';
      strengthText.innerText = 'Password strength: Strong & Secure';
      strengthText.style.color = '#10b981';
    }
  }

  // Confirm Password Check
  if (currentAuthMode === 'signup' && confirmInput && confirmHint) {
    const confirmVal = confirmInput.value;
    if (confirmVal.length > 0) {
      if (confirmVal === pwd) {
        confirmHint.innerText = '✓ Passwords match perfectly';
        confirmHint.className = 'auth-field-hint valid';
      } else {
        confirmHint.innerText = '✗ Passwords do not match';
        confirmHint.className = 'auth-field-hint invalid';
      }
    } else {
      confirmHint.innerText = '';
    }
  }
}

// Live Email Validation
function validateEmailLive() {
  const emailInput = document.getElementById('authEmail');
  const emailHint = document.getElementById('authEmailHint');
  if (!emailInput || !emailHint) return;

  const email = emailInput.value.trim();
  if (email.length === 0) {
    emailHint.innerText = '';
    return;
  }

  if (isValidEmail(email)) {
    emailHint.innerText = '✓ Valid email format';
    emailHint.className = 'auth-field-hint valid';
  } else {
    emailHint.innerText = '✗ Please enter a valid email address';
    emailHint.className = 'auth-field-hint invalid';
  }
}

// Attach real-time input listeners & initialize UI enhancements
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('authEmail');
  const pwdInput = document.getElementById('authPassword');
  const confirmInput = document.getElementById('authConfirmPassword');

  if (emailInput) {
    emailInput.addEventListener('input', validateEmailLive);
  }
  if (pwdInput) {
    pwdInput.addEventListener('input', validatePasswordLive);
  }
  if (confirmInput) {
    confirmInput.addEventListener('input', validatePasswordLive);
  }

  // Initialize interactive cursor & button sheen effects
  initCustomCursor();
});

// ==========================================================================
// Interactive Custom Cursor & Dynamic Button Sheen
// ==========================================================================
function initCustomCursor() {
  const dot = document.getElementById('customCursorDot');
  const ring = document.getElementById('customCursorRing');
  if (!dot || !ring) return;

  // Don't activate on coarse touch devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

    // Dynamic button spotlight sheen coordinate tracking
    const target = e.target.closest('button, .btn-primary, .btn-secondary, .pill-btn, .btn-export-excel, .btn-today-pill, .btn-secondary-sm, .btn-advisor-toggle, .btn-logout, .btn-month-nav, .auth-tab, .th-sortable, .cat-chip, .btn-quick-amount');
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--cursor-x', `${e.clientX - rect.left}px`);
      target.style.setProperty('--cursor-y', `${e.clientY - rect.top}px`);
    }
  });

  // Smooth trailing outer ring with fluid RAF damping
  function renderRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderRing);
  }
  renderRing();

  // Mouse hover state changes
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, a, input, select, .th-sortable, .pill-btn, .cat-chip, .btn-quick-amount, .user-avatar-wrap, .btn-month-nav')) {
      document.body.classList.add('cursor-hover-active');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('button, a, input, select, .th-sortable, .pill-btn, .cat-chip, .btn-quick-amount, .user-avatar-wrap, .btn-month-nav')) {
      document.body.classList.remove('cursor-hover-active');
    }
  });

  document.addEventListener('mousedown', () => document.body.classList.add('cursor-clicking'));
  document.addEventListener('mouseup', () => document.body.classList.remove('cursor-clicking'));
}

// ==========================================================================
// Category Quick Chips & Quick Amount Presets
// ==========================================================================
function selectCategoryChip(type) {
  const select = document.getElementById('type');
  if (select) {
    select.value = type;
    handleTypeChange();
  }
  const chips = document.querySelectorAll('.cat-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-type') === type);
  });
}

function addQuickAmount(delta) {
  const amountInput = document.getElementById('amount');
  if (!amountInput) return;
  const currentVal = parseFloat(amountInput.value) || 0;
  amountInput.value = currentVal + delta;
  amountInput.dispatchEvent(new Event('input'));
  showToast(`Added Rs. ${delta.toLocaleString()} (Total: Rs. ${(currentVal + delta).toLocaleString()})`, 'info');
}

// Category Type Selector Notice
function handleTypeChange() {
  const select = document.getElementById('type');
  const type = select ? select.value : 'OUT';
  const notice = document.getElementById('permanentNotice');
  if (notice) {
    notice.style.display = type === 'PERMANENT' ? 'flex' : 'none';
  }

  // Keep Category Chips in sync
  const chips = document.querySelectorAll('.cat-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-type') === type);
  });
}

// ==========================================================================
// MONTH SELECTION & FILTER ENGINE
// ==========================================================================

// Helper: Current Month string "YYYY-MM"
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Initialize pickers default values
function initMonthPickers() {
  const monthPicker = document.getElementById('monthPicker');
  if (monthPicker && !monthPicker.value) {
    monthPicker.value = getCurrentMonthKey();
  }

  const txDate = document.getElementById('transactionDate');
  if (txDate && !txDate.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    txDate.value = `${yyyy}-${mm}-${dd}`;
  }
}

// Reset Transaction Date to Today
function setTodayDate() {
  const txDate = document.getElementById('transactionDate');
  if (txDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    txDate.value = `${yyyy}-${mm}-${dd}`;
    showToast("Date set to Today", "info");
  }
}

// Open native date picker popup when clicking anywhere in wrapper
function openDatePicker(id) {
  const el = document.getElementById(id);
  if (el && typeof el.showPicker === 'function') {
    try {
      el.showPicker();
    } catch (e) {
      el.focus();
    }
  }
}

// Triggered when user selects a month from the date input
function onMonthPickerChange() {
  const picker = document.getElementById('monthPicker');
  if (!picker || !picker.value) return;

  activeMonthKey = picker.value;
  updateQuickPillState();
  updateDashboardView();
  showToast(`Showing records for ${formatMonthLabel(activeMonthKey)}`, 'info');
}

// Previous / Next Month Navigation Buttons
function changeMonth(delta) {
  let baseKey = activeMonthKey === 'ALL' ? getCurrentMonthKey() : activeMonthKey;
  const [yearStr, monthStr] = baseKey.split('-');
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + delta, 1);

  activeMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  
  const picker = document.getElementById('monthPicker');
  if (picker) {
    picker.value = activeMonthKey;
  }

  updateQuickPillState();
  updateDashboardView();
  showToast(`Switched to ${formatMonthLabel(activeMonthKey)}`, 'info');
}

// Quick filter buttons: 'current' (This Month) or 'all' (All Time)
function selectQuickMonth(mode) {
  if (mode === 'current') {
    activeMonthKey = getCurrentMonthKey();
    const picker = document.getElementById('monthPicker');
    if (picker) picker.value = activeMonthKey;
    showToast(`Viewing current month (${formatMonthLabel(activeMonthKey)})`, 'info');
  } else {
    activeMonthKey = 'ALL';
    showToast(`Viewing All-Time transactions`, 'info');
  }

  updateQuickPillState();
  updateDashboardView();
}

function updateQuickPillState() {
  const btnThis = document.getElementById('btnThisMonth');
  const btnAll = document.getElementById('btnAllMonths');

  if (btnThis) {
    btnThis.classList.toggle('active', activeMonthKey === getCurrentMonthKey());
  }
  if (btnAll) {
    btnAll.classList.toggle('active', activeMonthKey === 'ALL');
  }
}

// Helper to format "2026-10" to "Oct 2026"
function formatMonthLabel(monthKey) {
  if (monthKey === 'ALL') return 'All Time';
  if (!monthKey || !monthKey.includes('-')) return monthKey || '';
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

// Helper: Robust parser to extract epoch milliseconds for any transaction
function getTransactionDateMillis(item) {
  if (!item) return 0;

  // 1. Direct timestampMillis if saved
  if (typeof item.timestampMillis === 'number' && !isNaN(item.timestampMillis)) {
    return item.timestampMillis;
  }

  // 2. ISO or parsable string in txDateTime or isoDate
  if (item.txDateTime) {
    const t = new Date(item.txDateTime).getTime();
    if (!isNaN(t)) return t;
  }
  if (item.isoDate) {
    const t = new Date(item.isoDate).getTime();
    if (!isNaN(t)) return t;
  }

  // 3. Robust parse from item.timestamp string
  if (item.timestamp && typeof item.timestamp === 'string') {
    const raw = item.timestamp.trim();

    // Standard JavaScript Date.parse check first
    const directParsed = Date.parse(raw);
    if (!isNaN(directParsed)) {
      return directParsed;
    }

    // Clean comma and normalize whitespace
    const cleaned = raw.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanDirect = Date.parse(cleaned);
    if (!isNaN(cleanDirect)) {
      return cleanDirect;
    }

    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };

    // Format: "07 Oct 2026 10:13 AM" or "07 Oct 2026 22:28"
    const matchA = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (matchA) {
      const day = parseInt(matchA[1], 10);
      const mKey = matchA[2].toLowerCase();
      const month = monthMap[mKey] !== undefined ? monthMap[mKey] : (monthMap[mKey.slice(0, 3)] ?? 0);
      const year = parseInt(matchA[3], 10);
      let hours = matchA[4] !== undefined ? parseInt(matchA[4], 10) : 0;
      const minutes = matchA[5] !== undefined ? parseInt(matchA[5], 10) : 0;
      const seconds = matchA[6] !== undefined ? parseInt(matchA[6], 10) : 0;
      const ampm = matchA[7] ? matchA[7].toUpperCase() : null;

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    // Format: "YYYY-MM-DD HH:mm:ss"
    const matchIso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/i);
    if (matchIso) {
      const year = parseInt(matchIso[1], 10);
      const month = parseInt(matchIso[2], 10) - 1;
      const day = parseInt(matchIso[3], 10);
      const hours = matchIso[4] !== undefined ? parseInt(matchIso[4], 10) : 0;
      const minutes = matchIso[5] !== undefined ? parseInt(matchIso[5], 10) : 0;
      const seconds = matchIso[6] !== undefined ? parseInt(matchIso[6], 10) : 0;
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    // Format: "DD/MM/YYYY HH:mm"
    const matchSlash = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (matchSlash) {
      const day = parseInt(matchSlash[1], 10);
      const month = parseInt(matchSlash[2], 10) - 1;
      const year = parseInt(matchSlash[3], 10);
      let hours = matchSlash[4] !== undefined ? parseInt(matchSlash[4], 10) : 0;
      const minutes = matchSlash[5] !== undefined ? parseInt(matchSlash[5], 10) : 0;
      const seconds = matchSlash[6] !== undefined ? parseInt(matchSlash[6], 10) : 0;
      const ampm = matchSlash[7] ? matchSlash[7].toUpperCase() : null;

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }

  // 4. Fallback to Firestore createdAt timestamp
  if (item.createdAt && typeof item.createdAt.toDate === 'function') {
    return item.createdAt.toDate().getTime();
  }
  if (item.createdAt && item.createdAt.seconds) {
    return item.createdAt.seconds * 1000;
  }

  return 0;
}

// Helper: Get JavaScript Date object for a transaction
function getItemDate(item) {
  if (!item) return null;
  const millis = item.sortMillis !== undefined ? item.sortMillis : getTransactionDateMillis(item);
  if (millis && millis > 0) return new Date(millis);
  if (item.createdAt && typeof item.createdAt.toDate === 'function') return item.createdAt.toDate();
  if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000);
  return null;
}

// Helper: Check if two dates represent the same calendar day
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Sort helper: sorts transactions strictly by date & time sequence
function sortTransactions(list, direction = currentSortDirection) {
  if (!Array.isArray(list)) return [];
  return list.sort((a, b) => {
    const millisA = a.sortMillis !== undefined ? a.sortMillis : getTransactionDateMillis(a);
    const millisB = b.sortMillis !== undefined ? b.sortMillis : getTransactionDateMillis(b);

    if (millisA !== millisB) {
      return direction === 'asc' ? millisA - millisB : millisB - millisA;
    }

    // Tie-breaker using Firestore createdAt
    const createdA = (a.createdAt && typeof a.createdAt.toDate === 'function')
      ? a.createdAt.toDate().getTime()
      : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const createdB = (b.createdAt && typeof b.createdAt.toDate === 'function')
      ? b.createdAt.toDate().getTime()
      : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);

    if (createdA !== createdB) {
      return direction === 'asc' ? createdA - createdB : createdB - createdA;
    }

    return (b.id || '').localeCompare(a.id || '');
  });
}

function toggleDateSort() {
  currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
  updateSortIcon();
  updateDashboardView();
  showToast(
    currentSortDirection === 'desc'
      ? "Sorted: Newest transactions first (Date & Time sequence)"
      : "Sorted: Oldest transactions first (Date & Time sequence)",
    "info"
  );
}

function updateSortIcon() {
  const icon = document.getElementById('sortDirectionIcon');
  if (icon) {
    icon.className = currentSortDirection === 'desc'
      ? 'fa-solid fa-arrow-down-wide-short'
      : 'fa-solid fa-arrow-up-wide-short';
    icon.title = currentSortDirection === 'desc' ? 'Sorted Newest First (Click for Oldest First)' : 'Sorted Oldest First (Click for Newest First)';
  }
}

// Helper: Extract YYYY-MM from transaction item
function getTransactionMonthKey(item) {
  if (item.monthKey) return item.monthKey;

  const millis = getTransactionDateMillis(item);
  if (millis > 0) {
    const d = new Date(millis);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  if (item.createdAt && typeof item.createdAt.toDate === 'function') {
    const d = item.createdAt.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  return getCurrentMonthKey();
}

// ==========================================================================
// Auth State Observer
// ==========================================================================
auth.onAuthStateChanged(user => {
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  const emailVerifyNotice = document.getElementById('emailVerifyNotice');
  const verificationBadge = document.getElementById('userVerificationBadge');

  if (user) {
    currentUser = user;
    authSection.style.display = 'none';
    appSection.style.display = 'block';

    const emailDisplay = user.email || 'User';
    document.getElementById('userEmailTag').innerText = emailDisplay;
    
    // 1. Update Profile Avatar / Picture
    loadUserProfilePic(user.uid, emailDisplay);

    // 2. Update Verified Badge Status
    if (verificationBadge) {
      if (user.emailVerified) {
        verificationBadge.className = 'badge-verification verified';
        verificationBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Verified';
        verificationBadge.title = 'Officially Verified Account';
      } else {
        verificationBadge.className = 'badge-verification unverified';
        verificationBadge.innerHTML = '<i class="fa-solid fa-clock"></i> Unverified';
        verificationBadge.title = 'Click to send verification link';
      }
    }

    // 3. Email verification status top alert banner
    if (emailVerifyNotice) {
      if (!user.emailVerified) {
        emailVerifyNotice.style.display = 'flex';
      } else {
        emailVerifyNotice.style.display = 'none';
      }
    }

    initMonthPickers();

    // Check and automatically deduct monthly fixed expenses for new month
    checkAndApplyRecurringExpenses(user.uid);

    // Load user transactions and recurring rules
    loadUserTransactions();
    listenToRecurringRules(user.uid);
  } else {
    currentUser = null;
    currentTransactions = [];
    activeRecurringRules = [];
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    if (emailVerifyNotice) emailVerifyNotice.style.display = 'none';
  }
});

// ==========================================================================
// User Profile Picture & Verification Badge System
// ==========================================================================

function loadUserProfilePic(uid, fallbackEmail = 'User') {
  const avatarText = document.getElementById('userAvatar');
  const avatarImg = document.getElementById('userAvatarImg');

  // Check LocalStorage or user object for saved photo
  const savedPhoto = localStorage.getItem('smartflow_avatar_' + uid);

  if (savedPhoto) {
    if (avatarImg) {
      avatarImg.src = savedPhoto;
      avatarImg.style.display = 'block';
    }
    if (avatarText) avatarText.style.display = 'none';
  } else {
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarText) {
      avatarText.style.display = 'flex';
      avatarText.innerText = fallbackEmail.charAt(0).toUpperCase();
    }

    // Attempt to load from Firestore async
    db.collection('users').doc(uid).get().then(doc => {
      if (doc.exists && doc.data() && doc.data().photoURL) {
        const url = doc.data().photoURL;
        localStorage.setItem('smartflow_avatar_' + uid, url);
        if (avatarImg) {
          avatarImg.src = url;
          avatarImg.style.display = 'block';
        }
        if (avatarText) avatarText.style.display = 'none';
      }
    }).catch(err => console.log('Avatar cloud fetch notice:', err));
  }
}

function triggerProfilePicUpload() {
  const input = document.getElementById('profilePicInput');
  if (input) input.click();
}

function handleProfilePicChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast("Please select a valid image file (PNG, JPG, WebP)", "error");
    return;
  }

  showToast("Uploading & processing profile picture...", "info");

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Compress and resize image to 256x256 max using Canvas for optimal performance
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 256;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

      if (currentUser) {
        // Save to local storage
        localStorage.setItem('smartflow_avatar_' + currentUser.uid, compressedBase64);

        // Update UI
        const avatarImg = document.getElementById('userAvatarImg');
        const avatarText = document.getElementById('userAvatar');
        if (avatarImg) {
          avatarImg.src = compressedBase64;
          avatarImg.style.display = 'block';
        }
        if (avatarText) avatarText.style.display = 'none';

        // Save to Firestore
        db.collection('users').doc(currentUser.uid).set({
          photoURL: compressedBase64,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
          showToast("📸 Profile picture updated successfully!", "success");
        }).catch(err => {
          console.warn("Cloud avatar sync notice:", err);
          showToast("📸 Profile picture saved locally!", "success");
        });
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleBadgeClick() {
  if (!currentUser) return;

  if (currentUser.emailVerified) {
    showToast("✅ This account is officially verified & secure!", "success");
  } else {
    // If unverified, reload user to see if they just verified their email
    currentUser.reload().then(() => {
      if (currentUser.emailVerified) {
        const verificationBadge = document.getElementById('userVerificationBadge');
        const emailVerifyNotice = document.getElementById('emailVerifyNotice');
        if (verificationBadge) {
          verificationBadge.className = 'badge-verification verified';
          verificationBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Verified';
        }
        if (emailVerifyNotice) emailVerifyNotice.style.display = 'none';
        showToast("🎉 Awesome! Your email is now verified!", "success");
      } else {
        resendVerificationEmail();
      }
    }).catch(() => {
      resendVerificationEmail();
    });
  }
}

// ==========================================================================
// Auth Handlers (Signup, Login, Logout, Verification, Reset)
// ==========================================================================
function handleSignup() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const confirmPassword = document.getElementById('authConfirmPassword')?.value || '';

  // 1. Email Format Validation
  if (!email || !isValidEmail(email)) {
    showToast("Please enter a valid email address (e.g. name@example.com)", "error");
    document.getElementById('authEmail')?.focus();
    return;
  }

  // 2. Password Strength Validation
  if (password.length < 6) {
    showToast("Password must be at least 6 characters long.", "error");
    document.getElementById('authPassword')?.focus();
    return;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    showToast("Password must contain both letters and numbers for safety.", "error");
    document.getElementById('authPassword')?.focus();
    return;
  }

  // 3. Confirm Password Match Validation
  if (password !== confirmPassword) {
    showToast("Passwords do not match! Please verify your password.", "error");
    document.getElementById('authConfirmPassword')?.focus();
    return;
  }

  showToast("Creating your account...", "info");

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Send Email Verification
      userCredential.user.sendEmailVerification()
        .then(() => {
          showToast("📧 Verification email sent to " + email + "! Please check your inbox.", "success");
        })
        .catch(err => {
          console.warn("Verification email notice:", err);
        });

      showToast("Account created successfully! Welcome to SmartFlow!", "success");
    })
    .catch(error => {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        msg = "This email is already registered. Please log in instead.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "The email address is invalid.";
      } else if (error.code === 'auth/weak-password') {
        msg = "The password is too weak. Please use a stronger password.";
      }
      showToast("Signup Error: " + msg, "error");
    });
}

function handleLogin() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!email || !isValidEmail(email)) {
    showToast("Please enter a valid email address.", "error");
    document.getElementById('authEmail')?.focus();
    return;
  }

  if (!password) {
    showToast("Please enter your password.", "error");
    document.getElementById('authPassword')?.focus();
    return;
  }

  showToast("Signing in...", "info");

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      showToast("Logged in successfully! Welcome back!", "success");
      if (!userCredential.user.emailVerified) {
        showToast("⚠️ Note: Your email is not verified yet. You can resend verification from the top banner.", "info");
      }
    })
    .catch(error => {
      let msg = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "Invalid email or password. Please check your credentials.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Too many failed attempts. Please wait a moment or reset your password.";
      }
      showToast("Login Error: " + msg, "error");
    });
}

function handleForgotPassword() {
  const emailInput = document.getElementById('authEmail');
  let email = emailInput ? emailInput.value.trim() : '';

  if (!email || !isValidEmail(email)) {
    email = prompt("Enter your registered email address to receive a password reset link:", email || "");
  }

  if (!email || !isValidEmail(email.trim())) {
    showToast("Please provide a valid email address to reset password.", "error");
    return;
  }

  auth.sendPasswordResetEmail(email.trim())
    .then(() => {
      showToast(`📬 Password reset link sent to ${email}! Please check your email inbox.`, "success");
    })
    .catch(error => {
      showToast("Reset Error: " + error.message, "error");
    });
}

function resendVerificationEmail() {
  if (!currentUser) {
    showToast("No active user session found.", "error");
    return;
  }

  currentUser.sendEmailVerification()
    .then(() => {
      showToast("✅ Verification email resent! Please check your inbox & spam folder.", "success");
    })
    .catch(error => {
      showToast("Error sending verification: " + error.message, "error");
    });
}

function handleLogout() {
  auth.signOut()
    .then(() => {
      showToast("You have been signed out.", "info");
    });
}

// ==========================================================================
// AUTOMATIC MONTHLY FIXED EXPENSE LOGIC
// ==========================================================================

async function checkAndApplyRecurringExpenses(userId) {
  if (!userId) return;
  const currentMonthKey = getCurrentMonthKey();
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  try {
    const rulesSnap = await db.collection('users').doc(userId).collection('recurring_rules').get();
    let autoAddedCount = 0;

    for (const doc of rulesSnap.docs) {
      const rule = doc.data();
      
      if (rule.lastAppliedMonth !== currentMonthKey) {
        const existingTx = await db.collection('users').doc(userId).collection('transactions')
          .where('recurringRuleId', '==', doc.id)
          .where('monthKey', '==', currentMonthKey)
          .get();

        if (existingTx.empty) {
          const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const timestamp = `${dateStr}, ${timeStr}`;

          await db.collection('users').doc(userId).collection('transactions').add({
            title: rule.title,
            amount: rule.amount,
            type: 'PERMANENT',
            timestamp: timestamp,
            timestampMillis: now.getTime(),
            txDateTime: now.toISOString(),
            monthKey: currentMonthKey,
            recurringRuleId: doc.id,
            isAutoMonthly: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          autoAddedCount++;
        }

        await doc.ref.update({
          lastAppliedMonth: currentMonthKey,
          lastAppliedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    if (autoAddedCount > 0) {
      showToast(`⚡ ${autoAddedCount} fixed monthly expense(s) auto-recorded for ${monthName}!`, 'info');
    }
  } catch (err) {
    console.error("Error checking recurring expenses:", err);
  }
}

function listenToRecurringRules(userId) {
  db.collection('users').doc(userId).collection('recurring_rules')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      activeRecurringRules = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        activeRecurringRules.push(data);
      });

      const countBadge = document.getElementById('recurringCount');
      if (countBadge) {
        countBadge.innerText = activeRecurringRules.length;
      }

      renderRecurringList();
    });
}

function toggleRecurringModal() {
  const modal = document.getElementById('recurringModal');
  if (!modal) return;
  const isVisible = modal.style.display === 'flex';
  modal.style.display = isVisible ? 'none' : 'flex';
  if (!isVisible) {
    renderRecurringList();
  }
}

function renderRecurringList() {
  const list = document.getElementById('recurringList');
  if (!list) return;

  if (activeRecurringRules.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
        <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        <p>No monthly fixed rules active yet.</p>
        <span style="font-size: 0.8rem;">Select <strong>"Permanent / Fixed Expense"</strong> in the form to set an auto-repeating outflow.</span>
      </div>
    `;
    return;
  }

  list.innerHTML = activeRecurringRules.map(rule => `
    <div class="recurring-item">
      <div class="recurring-item-info">
        <strong>${escapeHtml(rule.title)}</strong>
        <span><i class="fa-solid fa-arrows-rotate"></i> Auto-deducts monthly • Last applied: ${rule.lastAppliedMonth || 'Active'}</span>
      </div>
      <div class="recurring-actions">
        <span class="recurring-item-amount">- Rs. ${(rule.amount || 0).toLocaleString()}</span>
        <button class="btn-delete-rule" onclick="deleteRecurringRule('${rule.id}')" title="Stop Auto-Monthly Deduction">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function deleteRecurringRule(ruleId) {
  if (confirm("Are you sure you want to stop this monthly fixed deduction? Future months will not auto-deduct this amount.")) {
    db.collection('users').doc(currentUser.uid).collection('recurring_rules').doc(ruleId).delete()
      .then(() => {
        showToast("Fixed monthly rule removed.", "info");
      })
      .catch(err => {
        showToast("Error: " + err.message, "error");
      });
  }
}

// ==========================================================================
// Transaction Operations: Add, Load, Filter, Delete
// ==========================================================================
async function addTransaction() {
  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const dateInput = document.getElementById('transactionDate')?.value;

  if (!title || isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid title and positive amount!", "error");
    return;
  }

  const addBtn = document.getElementById('addTransactionBtn');
  if (addBtn) addBtn.disabled = true;

  // Determine transaction date & time
  let txDate = new Date();
  const now = new Date();
  if (dateInput) {
    const [y, m, d] = dateInput.split('-').map(Number);
    txDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
  }

  const dateStr = txDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timestamp = `${dateStr}, ${timeStr}`;
  const timestampMillis = txDate.getTime();
  const txDateTime = txDate.toISOString();
  const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

  try {
    let recurringRuleId = null;

    if (type === 'PERMANENT') {
      const ruleRef = await db.collection('users').doc(currentUser.uid).collection('recurring_rules').add({
        title: title,
        amount: amount,
        lastAppliedMonth: monthKey,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      recurringRuleId = ruleRef.id;
    }

    await db.collection('users').doc(currentUser.uid).collection('transactions').add({
      title: title,
      amount: amount,
      type: type,
      timestamp: timestamp,
      timestampMillis: timestampMillis,
      txDateTime: txDateTime,
      monthKey: monthKey,
      recurringRuleId: recurringRuleId,
      isAutoMonthly: type === 'PERMANENT',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('title').value = '';
    document.getElementById('amount').value = '';
    setTodayDate();
    
    const notice = document.getElementById('permanentNotice');
    if (notice) notice.style.display = 'none';

    // If active month filter is different from transaction month, notify or sync
    if (activeMonthKey !== 'ALL' && activeMonthKey !== monthKey) {
      activeMonthKey = monthKey;
      const picker = document.getElementById('monthPicker');
      if (picker) picker.value = monthKey;
      updateQuickPillState();
    }

    if (type === 'PERMANENT') {
      showToast("Fixed expense saved & set to auto-repeat every month!", "success");
    } else {
      showToast("Transaction recorded successfully!", "success");
    }
  } catch (err) {
    showToast("Data Save Error: " + err.message, "error");
  } finally {
    if (addBtn) addBtn.disabled = false;
  }
}

// Real-time Firestore Listener
function loadUserTransactions() {
  db.collection('users').doc(currentUser.uid).collection('transactions')
    .onSnapshot(snapshot => {
      currentTransactions = [];

      snapshot.forEach(doc => {
        const item = doc.data();
        item.id = doc.id;
        item.sortMillis = getTransactionDateMillis(item);
        item.computedMonthKey = getTransactionMonthKey(item);
        currentTransactions.push(item);
      });

      // Sort strictly by Date & Time sequence
      sortTransactions(currentTransactions);

      // Update both summary statistics and table rows
      updateDashboardView();
    }, error => {
      showToast("Error loading records: " + error.message, "error");
    });
}

// Master view update: recalculates metrics & filters rows according to active month
function updateDashboardView() {
  // Always ensure currentTransactions is sorted
  sortTransactions(currentTransactions);

  // 1. Filter transactions by selected Month
  const monthFiltered = currentTransactions.filter(item => {
    if (activeMonthKey === 'ALL') return true;
    return (item.computedMonthKey || item.monthKey) === activeMonthKey;
  });

  // 2. Compute Summary Totals for the active month
  let totalIncome = 0;
  let totalExpense = 0;

  monthFiltered.forEach(item => {
    if (item.type === 'IN') {
      totalIncome += (item.amount || 0);
    } else {
      totalExpense += (item.amount || 0);
    }
  });

  const net = totalIncome - totalExpense;

  // 3. Update Stat Card UI
  document.getElementById('totalIncome').innerText = 'Rs. ' + totalIncome.toLocaleString();
  document.getElementById('totalExpense').innerText = 'Rs. ' + totalExpense.toLocaleString();
  document.getElementById('netBalance').innerText = 'Rs. ' + net.toLocaleString();

  const balanceHint = document.getElementById('balanceStatusHint');
  if (balanceHint) {
    const monthTag = activeMonthKey === 'ALL' ? 'Overall' : formatMonthLabel(activeMonthKey);
    if (net >= 0) {
      balanceHint.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${monthTag}: Healthy`;
    } else {
      balanceHint.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${monthTag}: Deficit`;
    }
  }

  // 4. Update Visual Cashflow Ratio Bar
  const elCashflowInPct = document.getElementById('cashflowInPct');
  const elCashflowOutPct = document.getElementById('cashflowOutPct');
  const elCashflowIncomeSeg = document.getElementById('cashflowIncomeSeg');
  const elCashflowExpenseSeg = document.getElementById('cashflowExpenseSeg');

  if (totalIncome > 0) {
    const retainedRatio = Math.max(0, Math.min(100, Math.round((Math.max(0, net) / totalIncome) * 100)));
    const spentRatio = Math.min(100, Math.round((totalExpense / totalIncome) * 100));
    
    if (elCashflowInPct) elCashflowInPct.innerText = `${retainedRatio}%`;
    if (elCashflowOutPct) elCashflowOutPct.innerText = `${spentRatio}%`;
    if (elCashflowIncomeSeg) elCashflowIncomeSeg.style.width = `${Math.max(4, retainedRatio)}%`;
    if (elCashflowExpenseSeg) elCashflowExpenseSeg.style.width = `${Math.max(4, Math.min(96, spentRatio))}%`;
  } else {
    if (elCashflowInPct) elCashflowInPct.innerText = '0%';
    if (elCashflowOutPct) elCashflowOutPct.innerText = totalExpense > 0 ? '100%' : '0%';
    if (elCashflowIncomeSeg) elCashflowIncomeSeg.style.width = '0%';
    if (elCashflowExpenseSeg) elCashflowExpenseSeg.style.width = totalExpense > 0 ? '100%' : '0%';
  }

  // 5. Update Smart Month-End Financial Health & Savings Advisor
  updateAdvisorView(totalIncome, totalExpense, net, monthFiltered);

  // 6. Render Table with further text search and type filter
  renderTransactionsTable(monthFiltered);
}

function filterTransactions() {
  updateDashboardView();
}

function renderTransactionsTable(sourceTransactions) {
  const baseList = sourceTransactions || currentTransactions.filter(item => {
    if (activeMonthKey === 'ALL') return true;
    return (item.computedMonthKey || item.monthKey) === activeMonthKey;
  });

  // Ensure current sort order is maintained
  sortTransactions(baseList);

  const table = document.getElementById('historyTable');
  const emptyState = document.getElementById('emptyState');
  const tableWrapper = document.getElementById('transactionsMainTable');
  const searchQuery = (document.getElementById('searchFilter')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('typeFilter')?.value || 'ALL';

  table.innerHTML = '';

  const filtered = baseList.filter(item => {
    const matchesSearch = !searchQuery || (item.title && item.title.toLowerCase().includes(searchQuery));
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (filtered.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
      const emptyP = emptyState.querySelector('p');
      if (emptyP) {
        if (activeMonthKey === 'ALL') {
          emptyP.innerText = "No transactions found across all time.";
        } else {
          emptyP.innerText = `No transactions recorded for ${formatMonthLabel(activeMonthKey)}.`;
        }
      }
    }
    if (tableWrapper) tableWrapper.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (tableWrapper) tableWrapper.style.display = 'table';

  filtered.forEach(item => {
    let typeTag = '';
    let amountClass = 'td-amount-out';
    let amountPrefix = '- ';

    if (item.type === 'IN') {
      typeTag = '<span class="tag-income"><i class="fa-solid fa-arrow-down-left"></i> IN</span>';
      amountClass = 'td-amount-in';
      amountPrefix = '+ ';
    } else if (item.type === 'OUT') {
      typeTag = '<span class="tag-expense"><i class="fa-solid fa-arrow-up-right"></i> OUT</span>';
    } else {
      typeTag = '<span class="tag-expense"><i class="fa-solid fa-arrow-up-right"></i> OUT</span> <span class="tag-perm"><i class="fa-solid fa-lock"></i> Fixed</span>';
      if (item.isAutoMonthly) {
        typeTag += ' <span class="badge-auto" title="Auto-deducted every month"><i class="fa-solid fa-arrows-rotate"></i> Monthly Auto</span>';
      }
    }

    const row = table.insertRow();
    row.innerHTML = `
      <td data-label="Date & Time">${item.timestamp || 'Just now'}</td>
      <td data-label="Title / Source"><strong>${escapeHtml(item.title)}</strong></td>
      <td data-label="Category">${typeTag}</td>
      <td data-label="Amount" class="td-amount ${amountClass}">${amountPrefix}Rs. ${(item.amount || 0).toLocaleString()}</td>
      <td data-label="Action" style="text-align: center;">
        <button class="btn-delete" onclick="deleteTransaction('${item.id}')" title="Delete record">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>
    `;
  });
}

function deleteTransaction(docId) {
  if (confirm("Are you sure you want to delete this transaction record?")) {
    db.collection('users').doc(currentUser.uid).collection('transactions').doc(docId).delete()
      .then(() => {
        showToast("Transaction deleted", "info");
      })
      .catch(err => {
        showToast("Error deleting: " + err.message, "error");
      });
  }
}

// Utility: Prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// Smart Financial Health & Month-End Savings Advisor
// ==========================================================================

let isAdvisorExpanded = false;

function toggleAdvisorDetails() {
  const content = document.getElementById('advisorExpandedContent');
  const btn = document.getElementById('btnToggleAdvisor');
  if (!content || !btn) return;

  isAdvisorExpanded = !isAdvisorExpanded;
  content.style.display = isAdvisorExpanded ? 'block' : 'none';
  btn.classList.toggle('expanded', isAdvisorExpanded);

  const span = btn.querySelector('span');
  if (span) {
    span.innerText = isAdvisorExpanded ? 'Hide Advice' : 'Savings Advice';
  }
}

function updateAdvisorView(totalIncome, totalExpense, net, monthTransactions) {
  const monthLabel = formatMonthLabel(activeMonthKey);
  const subtitle = document.getElementById('advisorPeriodSubtitle');
  if (subtitle) {
    subtitle.innerText = `Personalized budget & savings guidance for ${monthLabel}`;
  }

  // Savings & Burn rate calculations
  const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100) : 0;
  const burnRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100) : (totalExpense > 0 ? 100 : 0);

  // --------------------------------------------------------------------------
  // Calendar & Month Day Calculations
  // --------------------------------------------------------------------------
  const now = new Date();
  const currentRealMonthKey = getCurrentMonthKey();

  let daysInMonth = 30;
  let daysPassed = now.getDate();
  let remainingDays = Math.max(1, 30 - daysPassed + 1);
  let isPastMonth = false;
  let isFutureMonth = false;

  if (activeMonthKey !== 'ALL' && activeMonthKey.includes('-')) {
    const [yStr, mStr] = activeMonthKey.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    daysInMonth = new Date(y, m, 0).getDate(); // Total days in this active month

    if (activeMonthKey === currentRealMonthKey) {
      daysPassed = Math.min(daysInMonth, Math.max(1, now.getDate()));
      remainingDays = Math.max(1, daysInMonth - daysPassed + 1); // including today
    } else if (activeMonthKey < currentRealMonthKey) {
      isPastMonth = true;
      daysPassed = daysInMonth;
      remainingDays = 0;
    } else {
      isFutureMonth = true;
      daysPassed = 0;
      remainingDays = daysInMonth;
    }
  } else {
    // ALL time view: default to current month's pacing
    daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysPassed = Math.min(daysInMonth, Math.max(1, now.getDate()));
    remainingDays = Math.max(1, daysInMonth - daysPassed + 1);
  }

  // --------------------------------------------------------------------------
  // Dynamic Daily Cap & Spend Reduction / Recovery Calculations
  // --------------------------------------------------------------------------
  // Safe Expense Budget = 80% of income (Needs 50% + Wants 30%, reserving 20% savings)
  const maxMonthlyBudget = Math.round(totalIncome * 0.8);
  const baseDailyCap = totalIncome > 0 ? Math.max(0, Math.floor(maxMonthlyBudget / daysInMonth)) : 0;

  // Calculate today's spending from active month transactions
  let todayExpense = 0;
  if (!isPastMonth && !isFutureMonth) {
    (monthTransactions || []).forEach(item => {
      if (item.type !== 'IN') {
        const itemDate = getItemDate(item);
        if (itemDate && isSameDay(itemDate, now)) {
          todayExpense += (item.amount || 0);
        }
      }
    });
  }

  // Month-to-date pacing analysis
  const expectedSpendToDate = baseDailyCap * daysPassed;
  const paceDifference = totalExpense - expectedSpendToDate;
  const remainingBudget = maxMonthlyBudget - totalExpense;

  let adjustedDailyCap = 0;
  let dailyCutRequired = 0;
  let dailyCutPercentage = 0;
  let capStatusType = 'healthy';
  let capStatusText = 'On Track';

  if (totalIncome === 0) {
    capStatusType = 'warning';
    capStatusText = 'No Income Set';
  } else if (remainingDays === 0) {
    // Past month
    if (totalExpense > maxMonthlyBudget) {
      capStatusType = 'danger';
      capStatusText = 'Over Budget Limit';
    } else {
      capStatusType = 'healthy';
      capStatusText = 'Completed Within Cap';
    }
  } else if (remainingBudget <= 0) {
    // Exhausted entire 80% budget!
    capStatusType = 'danger';
    capStatusText = 'Budget Deficit 🚨';
    adjustedDailyCap = 0;
    dailyCutRequired = baseDailyCap;
    dailyCutPercentage = 100;
  } else {
    // Remaining days > 0 and remainingBudget > 0
    adjustedDailyCap = Math.max(0, Math.floor(remainingBudget / remainingDays));

    if (adjustedDailyCap < baseDailyCap) {
      dailyCutRequired = baseDailyCap - adjustedDailyCap;
      dailyCutPercentage = baseDailyCap > 0 ? Math.round((dailyCutRequired / baseDailyCap) * 100) : 0;
      capStatusType = dailyCutPercentage > 35 ? 'danger' : 'warning';
      capStatusText = dailyCutPercentage > 35 ? 'Over Cap Pacing ⚠️' : 'Moderate Cut Needed';
    } else {
      dailyCutRequired = 0;
      dailyCutPercentage = 0;
      capStatusType = 'healthy';
      capStatusText = 'On Track 💚';
    }
  }

  // --------------------------------------------------------------------------
  // Financial Health Score Calculation (0 - 100)
  // --------------------------------------------------------------------------
  let healthScore = 50;
  let statusClass = 'status-warning';
  let statusText = 'Fair / Modest';
  let bannerType = 'warning';
  let bannerIcon = 'fa-circle-exclamation';
  let bannerHeading = '';
  let bannerText = '';

  if (totalIncome === 0 && totalExpense === 0) {
    healthScore = 50;
    statusClass = 'status-warning';
    statusText = 'No Activity Yet';
    bannerType = 'warning';
    bannerIcon = 'fa-circle-info';
    bannerHeading = 'No Transactions Recorded';
    bannerText = `Aapne ${monthLabel} ke liye abhi koi aamadni ya kharcha record nahi kiya. Apni pehli transaction add karke financial tracking shuru karein.`;
  } else if (net < 0) {
    // Deficit (Expenses > Income)
    const deficitRatio = Math.min(1, Math.abs(net) / (totalExpense || 1));
    healthScore = Math.max(15, Math.round(45 - deficitRatio * 30));
    statusClass = 'status-danger';
    statusText = 'Deficit Alert 🚨';
    bannerType = 'danger';
    bannerIcon = 'fa-triangle-exclamation';
    bannerHeading = `🚨 Deficit Alert: Kharcha Aamadni se Barh Gaya Hai!`;
    bannerText = `Aapne is mahine apni kul aamadni se <strong>Rs. ${Math.abs(net).toLocaleString()}</strong> ziada kharch kar diye hain (Burn Rate: <strong>${burnRate.toFixed(1)}%</strong>). Yeh situation emergency savings ko deplete karti hai. Ghair zaroori kharche foran rokein.`;
  } else if (savingsRate >= 20) {
    // Healthy (Saving >= 20%)
    healthScore = Math.min(100, Math.round(80 + (savingsRate - 20) * 0.6));
    statusClass = 'status-healthy';
    statusText = 'Super Healthy 💚';
    bannerType = 'healthy';
    bannerIcon = 'fa-circle-check';
    bannerHeading = `🌟 Zabardast Financial Control!`;
    bannerText = `Masha'Allah! Aapne is mahine apni aamadni ka <strong>${savingsRate.toFixed(1)}% (Rs. ${net.toLocaleString()})</strong> kamyabi se bacha liya hai! Yeh ek behtareen savings rate hai.`;
  } else {
    // Low Savings (0% - 19.9%)
    healthScore = Math.round(55 + (savingsRate / 20) * 20);
    statusClass = 'status-warning';
    statusText = 'Low Savings ⚠️';
    bannerType = 'warning';
    bannerIcon = 'fa-triangle-exclamation';
    bannerHeading = `⚠️ Low Savings Margin: Bachat Kam Hai`;
    bannerText = `Aapne is mahine sirf <strong>${savingsRate.toFixed(1)}% (Rs. ${net.toLocaleString()})</strong> bachaya hai, jabke ideal bachat kam az kam <strong>20%</strong> honi chahiye. Chote kharche control karke savings barhayein.`;
  }

  // --------------------------------------------------------------------------
  // Update Quick Metric Values
  // --------------------------------------------------------------------------
  const elSavingsRate = document.getElementById('qmSavingsRate');
  if (elSavingsRate) {
    elSavingsRate.innerText = (savingsRate >= 0 ? '+' : '') + savingsRate.toFixed(1) + '%';
    elSavingsRate.style.color = savingsRate >= 20 ? 'var(--income-color)' : (savingsRate >= 0 ? '#f59e0b' : 'var(--expense-color)');
  }

  const elBurnRate = document.getElementById('qmBurnRate');
  if (elBurnRate) {
    elBurnRate.innerText = burnRate.toFixed(1) + '%';
    elBurnRate.style.color = burnRate > 100 ? 'var(--expense-color)' : (burnRate > 80 ? '#f59e0b' : 'var(--income-color)');
  }

  const elDailyCap = document.getElementById('qmDailyCap');
  const elDailyCapHint = document.getElementById('qmDailyCapHint');
  if (elDailyCap) {
    elDailyCap.innerText = totalIncome > 0 ? `Rs. ${baseDailyCap.toLocaleString()}` : 'Rs. 0';
  }
  if (elDailyCapHint) {
    if (totalIncome === 0) {
      elDailyCapHint.innerText = 'Set income to calculate';
      elDailyCapHint.style.color = 'var(--text-muted)';
    } else if (dailyCutRequired > 0) {
      elDailyCapHint.innerHTML = `<span style="color: #f43f5e; font-weight: 700;"><i class="fa-solid fa-scissors"></i> Cut Rs. ${dailyCutRequired.toLocaleString()}/day</span>`;
    } else {
      const todayLeft = Math.max(0, baseDailyCap - todayExpense);
      elDailyCapHint.innerHTML = `<span style="color: #10b981; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> On track (${todayLeft > 0 ? 'Rs. ' + todayLeft.toLocaleString() + ' left today' : 'Safe pace'})</span>`;
    }
  }

  const elHealthScore = document.getElementById('qmHealthScore');
  if (elHealthScore) {
    elHealthScore.innerText = `${healthScore} / 100`;
  }

  const elHealthStatus = document.getElementById('qmHealthStatus');
  if (elHealthStatus) {
    elHealthStatus.innerText = statusText;
  }

  const pill = document.getElementById('advisorHealthPill');
  if (pill) {
    pill.className = `advisor-pill ${statusClass}`;
    pill.innerHTML = `<i class="fa-solid fa-heart-pulse"></i> ${statusText}`;
  }

  // Update Status Banner
  const banner = document.getElementById('advisorStatusBanner');
  if (banner) {
    banner.className = `advisor-status-banner banner-${bannerType}`;
    banner.innerHTML = `
      <i class="fa-solid ${bannerIcon}"></i>
      <div>
        <strong>${bannerHeading}</strong>
        <p style="margin: 4px 0 0; font-size: 0.85rem;">${bannerText}</p>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Update Dedicated Daily Cap & Spending Pace Box
  // --------------------------------------------------------------------------
  const capPill = document.getElementById('dailyCapStatusPill');
  if (capPill) {
    capPill.className = `daily-cap-status-pill status-${capStatusType}`;
    let icon = 'fa-circle-check';
    if (capStatusType === 'warning') icon = 'fa-triangle-exclamation';
    if (capStatusType === 'danger') icon = 'fa-fire-flame-curved';
    capPill.innerHTML = `<i class="fa-solid ${icon}"></i> ${capStatusText}`;
  }

  const elCapBase = document.getElementById('capStatBase');
  if (elCapBase) elCapBase.innerText = totalIncome > 0 ? `Rs. ${baseDailyCap.toLocaleString()}` : 'Rs. 0';

  const elCapToday = document.getElementById('capStatToday');
  if (elCapToday) {
    elCapToday.innerText = `Rs. ${todayExpense.toLocaleString()}`;
    elCapToday.style.color = (baseDailyCap > 0 && todayExpense > baseDailyCap) ? 'var(--expense-color)' : 'var(--text-primary)';
  }

  const elCapTodaySub = document.getElementById('capStatTodaySub');
  if (elCapTodaySub) {
    if (baseDailyCap > 0 && todayExpense > baseDailyCap) {
      elCapTodaySub.innerHTML = `<span style="color: #f43f5e; font-weight: 600;">+Rs. ${(todayExpense - baseDailyCap).toLocaleString()} over cap</span>`;
    } else if (baseDailyCap > 0) {
      elCapTodaySub.innerText = `Rs. ${(baseDailyCap - todayExpense).toLocaleString()} remaining today`;
    } else {
      elCapTodaySub.innerText = "Today's spend";
    }
  }

  const elCapCut = document.getElementById('capStatCut');
  if (elCapCut) {
    elCapCut.innerText = dailyCutRequired > 0 ? `Rs. ${dailyCutRequired.toLocaleString()}` : 'Rs. 0';
    elCapCut.style.color = dailyCutRequired > 0 ? 'var(--expense-color)' : 'var(--income-color)';
  }

  const elCapCutSub = document.getElementById('capStatCutSub');
  if (elCapCutSub) {
    elCapCutSub.innerText = dailyCutRequired > 0 ? `${dailyCutPercentage}% reduction needed` : 'No cut needed (Safe)';
  }

  const elCapAdjusted = document.getElementById('capStatAdjusted');
  if (elCapAdjusted) {
    elCapAdjusted.innerText = totalIncome > 0 ? `Rs. ${adjustedDailyCap.toLocaleString()} / day` : 'Rs. 0';
    elCapAdjusted.style.color = adjustedDailyCap > 0 ? 'var(--income-color)' : 'var(--expense-color)';
  }

  const elCapAdjustedSub = document.getElementById('capStatAdjustedSub');
  if (elCapAdjustedSub) {
    elCapAdjustedSub.innerText = remainingDays > 0 ? `For next ${remainingDays} days` : 'Month ended';
  }

  // Progress Bars
  const todayProgressPercent = baseDailyCap > 0 ? Math.min(100, Math.round((todayExpense / baseDailyCap) * 100)) : 0;
  const elProgressTodayText = document.getElementById('capProgressTodayText');
  if (elProgressTodayText) {
    elProgressTodayText.innerText = `Rs. ${todayExpense.toLocaleString()} / Rs. ${baseDailyCap.toLocaleString()} limit`;
  }
  const elProgressTodayPercent = document.getElementById('capProgressTodayPercent');
  if (elProgressTodayPercent) {
    const rawTodayPct = baseDailyCap > 0 ? Math.round((todayExpense / baseDailyCap) * 100) : 0;
    elProgressTodayPercent.innerText = `${rawTodayPct}%`;
    elProgressTodayPercent.style.color = rawTodayPct > 100 ? 'var(--expense-color)' : (rawTodayPct > 80 ? '#f59e0b' : 'var(--income-color)');
  }
  const elProgressTodayFill = document.getElementById('capProgressTodayFill');
  if (elProgressTodayFill) {
    elProgressTodayFill.style.width = `${todayProgressPercent}%`;
    elProgressTodayFill.className = `b-progress-fill ${todayExpense > baseDailyCap ? 'fill-wants' : 'fill-savings'}`;
  }

  // Month-to-Date Progress Bar
  const monthProgressPercent = maxMonthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / maxMonthlyBudget) * 100)) : 0;
  const rawMonthPct = maxMonthlyBudget > 0 ? Math.round((totalExpense / maxMonthlyBudget) * 100) : 0;
  const elProgressMonthText = document.getElementById('capProgressMonthText');
  if (elProgressMonthText) {
    elProgressMonthText.innerText = `Rs. ${totalExpense.toLocaleString()} spent of Rs. ${maxMonthlyBudget.toLocaleString()} max budget`;
  }
  const elProgressMonthPercent = document.getElementById('capProgressMonthPercent');
  if (elProgressMonthPercent) {
    elProgressMonthPercent.innerText = `${rawMonthPct}%`;
    elProgressMonthPercent.style.color = rawMonthPct > 100 ? 'var(--expense-color)' : (rawMonthPct > 80 ? '#f59e0b' : 'var(--income-color)');
  }
  const elProgressMonthFill = document.getElementById('capProgressMonthFill');
  if (elProgressMonthFill) {
    elProgressMonthFill.style.width = `${monthProgressPercent}%`;
    elProgressMonthFill.className = `b-progress-fill ${totalExpense > maxMonthlyBudget ? 'fill-wants' : 'fill-needs'}`;
  }

  // --------------------------------------------------------------------------
  // Dynamic Roman Urdu & English Actionable Reduction Guidance
  // --------------------------------------------------------------------------
  let adviceHtml = '';
  if (totalIncome === 0) {
    adviceHtml = `
      <div class="cap-advice-alert info">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>Income Record Karein</strong>
          <p>Apna Daily Cap aur zaroori bachat targets dekhne ke liye pehle aamadni (Income) record karein. Is se aapka exact rozana limit calculate ho sakega.</p>
        </div>
      </div>
    `;
  } else if (isPastMonth) {
    adviceHtml = `
      <div class="cap-advice-alert ${totalExpense > maxMonthlyBudget ? 'danger' : 'healthy'}">
        <i class="fa-solid ${totalExpense > maxMonthlyBudget ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
        <div>
          <strong>${formatMonthLabel(activeMonthKey)} Ka Final Summary</strong>
          <p>Is mahine aapka base daily cap <strong>Rs. ${baseDailyCap.toLocaleString()} / din</strong> tha. Kul kharcha <strong>Rs. ${totalExpense.toLocaleString()}</strong> raha (Rozana average: <strong>Rs. ${Math.round(totalExpense / daysInMonth).toLocaleString()} / din</strong>). ${totalExpense > maxMonthlyBudget ? 'Yeh mahina budget cap se ziada par close hua.' : 'Masha\'Allah! Yeh mahina daily cap aur safe budget ke andar kamyabi se close hua.'}</p>
        </div>
      </div>
    `;
  } else if (remainingBudget <= 0) {
    const deficitAmount = Math.abs(remainingBudget);
    adviceHtml = `
      <div class="cap-advice-alert danger">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>🚨 Mahine Ka Kul Expense Budget Exceed Ho Gaya Hai!</strong>
          <p style="margin-bottom: 8px;">Aapka is mahine ka 80% expense limit (<strong>Rs. ${maxMonthlyBudget.toLocaleString()}</strong>) poora khatam ho chuka hai aur aap <strong>Rs. ${deficitAmount.toLocaleString()}</strong> overspend kar chuke hain.</p>
          <div class="cap-steps-list">
            <div class="cap-step-item">
              <span class="step-num">1</span>
              <span><strong>100% Non-Essential Spending Freeze:</strong> Mahine ke baqi <strong>${remainingDays}</strong> dino mein dining out, online shopping aur ghair zaroori purchases par mukammal stop lagayein.</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">2</span>
              <span><strong>Naya Rozana Spending Target:</strong> Ab se rozana kharcha <strong>Rs. 0 / din</strong> (sirf zaroori survival kharche) hona chahiye taake mazeed deficit na barhe.</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">3</span>
              <span><strong>Recovery Target:</strong> Agle mahine ki pehli salary se Rs. ${deficitAmount.toLocaleString()} bachat mein daal kar yeh deficit recover karein.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (dailyCutRequired > 0) {
    const todayOver = (baseDailyCap > 0 && todayExpense > baseDailyCap) ? todayExpense - baseDailyCap : 0;
    adviceHtml = `
      <div class="cap-advice-alert warning">
        <i class="fa-solid fa-chart-line-down"></i>
        <div>
          <strong>⚠️ Daily Cap Pura Karne Ke Liye Kharcha Kam Karne Ki Guidance:</strong>
          <p style="margin-bottom: 8px;">
            Aapka kharcha ab tak ke expected cap (Rs. ${expectedSpendToDate.toLocaleString()}) se <strong>Rs. ${paceDifference.toLocaleString()}</strong> aage chal raha hai. Mahine ke bache hue <strong>${remainingDays}</strong> dino ke liye aapke paas <strong>Rs. ${remainingBudget.toLocaleString()}</strong> bache hain.
          </p>
          <div class="cap-steps-list">
            <div class="cap-step-item">
              <span class="step-num">1</span>
              <span><strong>Rozana Kharch Kami (Daily Reduction):</strong> Cap pura karne aur 20% bachat target bachane ke liye ab rozana apne kharche mein <strong>Rs. ${dailyCutRequired.toLocaleString()} (${dailyCutPercentage}%)</strong> ki kami karein.</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">2</span>
              <span><strong>Naya Rozana Spending Limit:</strong> Bajaye purane Rs. ${baseDailyCap.toLocaleString()} ke, ab aapka naya daily limit <strong>Rs. ${adjustedDailyCap.toLocaleString()} / din</strong> hona chahiye.</span>
            </div>
            ${todayOver > 0 ? `
            <div class="cap-step-item">
              <span class="step-num">3</span>
              <span><strong>Aaj Ka Overspend Recovery:</strong> Aaj aapne Rs. ${todayExpense.toLocaleString()} kharch kiye (Rs. ${todayOver.toLocaleString()} over cap). Kal ka kharcha sirf <strong>Rs. ${Math.max(0, adjustedDailyCap - todayOver).toLocaleString()}</strong> tak rakhein taake aaj ka extra kharcha kal hi balance ho jaye!</span>
            </div>` : `
            <div class="cap-step-item">
              <span class="step-num">3</span>
              <span><strong>Aaj Ka Status:</strong> Aaj aapne Rs. ${todayExpense.toLocaleString()} kharch kiye hain. Din ke bache hue hissay mein koshish karein ke Rs. ${Math.max(0, adjustedDailyCap - todayExpense).toLocaleString()} se ziada kharch na ho.</span>
            </div>`}
          </div>
        </div>
      </div>
    `;
  } else {
    adviceHtml = `
      <div class="cap-advice-alert healthy">
        <i class="fa-solid fa-circle-check"></i>
        <div>
          <strong>🌟 Zabardast Control! Aapka Kharcha Daily Cap Ke Andar Hai:</strong>
          <p style="margin-bottom: 8px;">
            Masha'Allah! Aap rozana daily cap (Rs. ${baseDailyCap.toLocaleString()} / din) ke andar disciplined tareeqe se kharch kar rahe hain. Mahine ke baqi <strong>${remainingDays}</strong> dino ke liye aapke paas <strong>Rs. ${remainingBudget.toLocaleString()}</strong> ka safe budget maujood hai.
          </p>
          <div class="cap-steps-list">
            <div class="cap-step-item">
              <span class="step-num">✓</span>
              <span><strong>Kami Ki Zaroorat Nahi:</strong> Filhal aapko kharcha kam karne ki zaroorat nahi hai. Aap safe zone mein hain.</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">✓</span>
              <span><strong>Safe Daily Limit:</strong> Agle ${remainingDays} din aap rozana <strong>Rs. ${adjustedDailyCap.toLocaleString()} / din</strong> tak araam se kharch kar sakte hain aur phir bhi 20% bachat secure rahegi.</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">✓</span>
              <span><strong>Aaj Ka Status:</strong> Aaj aapne <strong>Rs. ${todayExpense.toLocaleString()}</strong> kharch kiye hain (Gunjayish baqi: <strong>Rs. ${Math.max(0, baseDailyCap - todayExpense).toLocaleString()}</strong>).</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const elAdviceBox = document.getElementById('dailyCapAdviceBox');
  if (elAdviceBox) {
    elAdviceBox.innerHTML = adviceHtml;
  }

  // --------------------------------------------------------------------------
  // Update 50/30/20 Ideal Budget Guide
  // --------------------------------------------------------------------------
  const elIncomeDisplay = document.getElementById('guideIncomeDisplay');
  if (elIncomeDisplay) {
    elIncomeDisplay.innerText = `Rs. ${totalIncome.toLocaleString()}`;
  }

  const needsTarget = Math.round(totalIncome * 0.5);
  const wantsTarget = Math.round(totalIncome * 0.3);
  const savingsTarget = Math.round(totalIncome * 0.2);

  const elNeedsVal = document.getElementById('guideNeedsVal');
  if (elNeedsVal) elNeedsVal.innerText = `Rs. ${needsTarget.toLocaleString()}`;

  const elWantsVal = document.getElementById('guideWantsVal');
  if (elWantsVal) elWantsVal.innerText = `Rs. ${wantsTarget.toLocaleString()}`;

  const elSavingsVal = document.getElementById('guideSavingsVal');
  if (elSavingsVal) elSavingsVal.innerText = `Rs. ${savingsTarget.toLocaleString()}`;

  // --------------------------------------------------------------------------
  // Populate Dynamic Actionable Tips List (Updated with dynamic Cap Reduction)
  // --------------------------------------------------------------------------
  const tipsList = document.getElementById('advisorTipsList');
  if (tipsList) {
    const tips = [];

    if (net < 0) {
      tips.push({
        icon: 'fa-hand-holding-dollar',
        title: '1. Pay Yourself First (Aamadni aate hi 20% alag karein)',
        desc: `Salary/Income aane par mahine ke aakhri bache hue paison ka intezar na karein. Pehle din hi kam az kam Rs. ${savingsTarget > 0 ? savingsTarget.toLocaleString() : '5,000'} kisi alag account ya committee mein save kar dein.`
      });
      tips.push({
        icon: 'fa-ban',
        title: '2. Immediate Non-Essential Spending Freeze',
        desc: `Aapka budget deficit mein hai. Agle mahine tak online shopping, baahir se khana, aur ghair zaroori purchases par 100% stop lagayein taake balance recover ho sake.`
      });
      tips.push({
        icon: 'fa-hourglass-half',
        title: '3. The 72-Hour Rule (Impulse Buying Control)',
        desc: `Kisi bhi aisi cheez par jo foran zaroori na ho, khareedne se pehle 72 ghante intezar karein. Ziada tar shauq 3 din baad khatam ho jata hai aur paise bach jate hain.`
      });
      tips.push({
        icon: 'fa-scissors',
        title: `4. Daily Cap Deficit Cut (Rozana Rs. ${dailyCutRequired > 0 ? dailyCutRequired.toLocaleString() : '1,000'} Kami)`,
        desc: `Deficit khatam karne ke liye mahine ke bache hue ${remainingDays} dino mein rozana kharche ko Rs. ${adjustedDailyCap.toLocaleString()} tak mehdood karein.`
      });
    } else if (savingsRate < 20) {
      tips.push({
        icon: 'fa-piggy-bank',
        title: '1. 20% Savings Target (Bachat ka Hadaf)',
        desc: `Is mahine aapka savings rate ${savingsRate.toFixed(1)}% raha. Kam az kam 20% (Rs. ${savingsTarget.toLocaleString()}) bachane ke liye discretionary kharchon mein se 15% kami karein.`
      });
      tips.push({
        icon: 'fa-repeat',
        title: '2. Fixed vs Variable Outflows Audit',
        desc: `Aapke fixed rules (jaise ghar k kharcha, bills) ko examine karein. Jahan electricity, subscriptions ya fuel mein bachat mumkin ho, wahan control karein.`
      });
      tips.push({
        icon: 'fa-utensils',
        title: '3. Food & Dining Out Optimization',
        desc: `Tea, snacks, cafe visits aur food delivery ke chote chote kharche mahine ke aakhir mein hazaron ban jate hain. Ghar ke khane ko tarjeeh dein.`
      });
      if (dailyCutRequired > 0) {
        tips.push({
          icon: 'fa-scissors',
          title: `4. Rozana Kharch Kami: Rs. ${dailyCutRequired.toLocaleString()} / Day Cut`,
          desc: `Daily cap pura karne ke liye agle ${remainingDays} dino mein rozana Rs. ${dailyCutRequired.toLocaleString()} (${dailyCutPercentage}%) kharcha kam karein (Naya target: Rs. ${adjustedDailyCap.toLocaleString()}/day).`
        });
      } else {
        tips.push({
          icon: 'fa-wallet',
          title: `4. Daily Spending Target: Rs. ${adjustedDailyCap > 0 ? adjustedDailyCap.toLocaleString() : baseDailyCap.toLocaleString()} / Day`,
          desc: `Rozana ke kharche ko is had ke andar rakhne ki koshish karein taake month-end par Rs. ${savingsTarget.toLocaleString()} ka safe buffer bache.`
        });
      }
    } else {
      tips.push({
        icon: 'fa-trophy',
        title: '1. Maintain Momentum (Bachat ki Aadat Barqarar Rakhein)',
        desc: `Aapka savings rate (${savingsRate.toFixed(1)}%) bohot zabardast hai! Is raqam (Rs. ${net.toLocaleString()}) ko ghair zaroori tor par kharch na hone dein.`
      });
      tips.push({
        icon: 'fa-shield-halved',
        title: '2. Build 3-6 Months Emergency Fund',
        desc: `Kam az kam 3 se 6 mahine ke kharchon (approx Rs. ${(totalExpense * 3).toLocaleString()}) ka emergency fund kisi secure jagah jama karein taake mushkil waqt mein sukoon rahe.`
      });
      tips.push({
        icon: 'fa-arrow-trend-up',
        title: '3. Avoid Lifestyle Creep',
        desc: `Aamadni barhne ke sath sath standards barhana aam baat hai, lekin apne fixed expenses ko hamesha 50% se kam rakhein.`
      });
      tips.push({
        icon: 'fa-circle-check',
        title: `4. Safe Daily Limit: Rs. ${adjustedDailyCap > 0 ? adjustedDailyCap.toLocaleString() : baseDailyCap.toLocaleString()} / Day`,
        desc: `Aapka spending pace control mein hai. Agle ${remainingDays} din rozana is had ke andar rehte hue araam se kharch kar sakte hain.`
      });
    }

    tipsList.innerHTML = tips.map(tip => `
      <div class="tip-item">
        <div class="tip-icon"><i class="fa-solid ${tip.icon}"></i></div>
        <div class="tip-content">
          <strong>${tip.title}</strong>
          <p>${tip.desc}</p>
        </div>
      </div>
    `).join('');
  }
}

// ==========================================================================
// Modernized Excel Spreadsheet (.xlsx) Exporter
// ==========================================================================

// ==========================================================================
// Colorful & Executive Modern Excel Spreadsheet (.xlsx) Exporter
// ==========================================================================

function exportTransactionsToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast("Excel export engine is loading, please try in a moment...", "error");
    return;
  }

  // 1. Gather filtered list of transactions for active month
  const monthFiltered = currentTransactions.filter(item => {
    if (activeMonthKey === 'ALL') return true;
    return (item.computedMonthKey || item.monthKey) === activeMonthKey;
  });

  if (monthFiltered.length === 0) {
    showToast("No transactions available to export for this period.", "error");
    return;
  }

  // Compute Metrics for the export
  let totalIncome = 0;
  let totalExpense = 0;
  monthFiltered.forEach(item => {
    if (item.type === 'IN') totalIncome += (item.amount || 0);
    else totalExpense += (item.amount || 0);
  });
  const net = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) + '%' : '0.0%';
  const healthStatus = net < 0 ? 'Deficit Alert (Over budget)' : (totalIncome > 0 && (net / totalIncome) >= 0.2 ? 'Healthy Saver (Target met)' : 'Low Savings (Needs audit)');
  const monthLabel = formatMonthLabel(activeMonthKey);
  const exportTimestamp = new Date().toLocaleString('en-GB');

  // Create a new Workbook
  const wb = XLSX.utils.book_new();

  // Helper for applying styles to cells safely
  function setCellStyle(ws, r, c, style) {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (!ws[ref]) {
      ws[ref] = { t: 's', v: '' };
    }
    ws[ref].s = Object.assign({}, ws[ref].s || {}, style);
  }

  // Common Border Styles
  const borderThinLight = {
    top: { style: "thin", color: { rgb: "E2E8F0" } },
    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
    left: { style: "thin", color: { rgb: "E2E8F0" } },
    right: { style: "thin", color: { rgb: "E2E8F0" } }
  };

  const borderMediumIndigo = {
    top: { style: "medium", color: { rgb: "4338CA" } },
    bottom: { style: "medium", color: { rgb: "4338CA" } },
    left: { style: "thin", color: { rgb: "4338CA" } },
    right: { style: "thin", color: { rgb: "4338CA" } }
  };

  // -------------------------------------------------------------
  // Sheet 1: Transactions History (Full Color Theme)
  // -------------------------------------------------------------
  const sheet1Data = [
    ["SMARTFLOW EXPENSE TRACKER - EXECUTIVE REPORT", "", "", "", "", "", ""],
    ["Target Period:", monthLabel, "", "Exported On:", exportTimestamp, "", ""],
    ["", "", "", "", "", "", ""],
    ["EXECUTIVE FINANCIAL SUMMARY", "", "", "", "", "", ""],
    ["Total Income (PKR):", totalIncome, "Total Expense (PKR):", totalExpense, "Net Balance (PKR):", net, ""],
    ["Savings Rate:", savingsRate, "Financial Health Status:", healthStatus, "", "", ""],
    ["", "", "", "", "", "", ""],
    ["#", "Date & Time", "Title / Description", "Category", "Amount (PKR)", "Cashflow", "Month Key"]
  ];

  // Add individual transactions
  monthFiltered.forEach((tx, idx) => {
    let catText = 'Expense (OUT)';
    let flowSign = `- Rs. ${(tx.amount || 0).toLocaleString()}`;
    if (tx.type === 'IN') {
      catText = 'Income (IN)';
      flowSign = `+ Rs. ${(tx.amount || 0).toLocaleString()}`;
    } else if (tx.type === 'PERMANENT') {
      catText = 'Permanent Outflow';
    }

    sheet1Data.push([
      idx + 1,
      tx.timestamp || 'N/A',
      tx.title || 'Untitled',
      catText,
      tx.amount || 0,
      flowSign,
      tx.computedMonthKey || tx.monthKey || 'N/A'
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Set merged header banners
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title Banner
    { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }  // Summary Header
  ];

  // Set spacious column widths
  ws1['!cols'] = [
    { wch: 6 },   // #
    { wch: 24 },  // Date & Time
    { wch: 32 },  // Title
    { wch: 22 },  // Category
    { wch: 18 },  // Amount
    { wch: 20 },  // Cashflow
    { wch: 14 }   // Month
  ];

  // 1. Style Main Title Banner (Row 0)
  for (let c = 0; c <= 6; c++) {
    setCellStyle(ws1, 0, c, {
      fill: { fgColor: { rgb: "1E1B4B" } }, // Deep Navy Indigo
      font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // 2. Style Period & Metadata (Row 1)
  for (let c = 0; c <= 6; c++) {
    setCellStyle(ws1, 1, c, {
      fill: { fgColor: { rgb: "F1F5F9" } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "334155" } },
      alignment: { vertical: "center" }
    });
  }

  // 3. Style Executive Summary Title (Row 3)
  for (let c = 0; c <= 6; c++) {
    setCellStyle(ws1, 3, c, {
      fill: { fgColor: { rgb: "4F46E5" } }, // Vibrant Indigo Accent
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // 4. Style Metrics Row (Row 4)
  // Income Metric (Cols 0-1)
  setCellStyle(ws1, 4, 0, { fill: { fgColor: { rgb: "D1FAE5" } }, font: { bold: true, color: { rgb: "065F46" } } });
  setCellStyle(ws1, 4, 1, { fill: { fgColor: { rgb: "D1FAE5" } }, font: { bold: true, color: { rgb: "065F46" }, sz: 12 }, alignment: { horizontal: "right" } });
  // Expense Metric (Cols 2-3)
  setCellStyle(ws1, 4, 2, { fill: { fgColor: { rgb: "FFE4E6" } }, font: { bold: true, color: { rgb: "9F1239" } } });
  setCellStyle(ws1, 4, 3, { fill: { fgColor: { rgb: "FFE4E6" } }, font: { bold: true, color: { rgb: "9F1239" }, sz: 12 }, alignment: { horizontal: "right" } });
  // Balance Metric (Cols 4-5)
  setCellStyle(ws1, 4, 4, { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true, color: { rgb: "1E40AF" } } });
  setCellStyle(ws1, 4, 5, { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true, color: { rgb: "1E40AF" }, sz: 12 }, alignment: { horizontal: "right" } });
  setCellStyle(ws1, 4, 6, { fill: { fgColor: { rgb: "DBEAFE" } } });

  // 5. Style Savings Rate & Status (Row 5)
  for (let c = 0; c <= 6; c++) {
    setCellStyle(ws1, 5, c, {
      fill: { fgColor: { rgb: "FEF3C7" } }, // Soft Amber
      font: { bold: true, color: { rgb: "92400E" } },
      alignment: { vertical: "center" }
    });
  }

  // 6. Style Table Headers (Row 7)
  for (let c = 0; c <= 6; c++) {
    setCellStyle(ws1, 7, c, {
      fill: { fgColor: { rgb: "312E81" } }, // Deep Midnight Indigo
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderMediumIndigo
    });
  }

  // 7. Style Each Data Row (Row 8+)
  monthFiltered.forEach((tx, idx) => {
    const r = 8 + idx;
    let rowBg = "F8FAFC"; // default
    let textRgb = "0F172A";
    let flowRgb = "0F172A";

    if (tx.type === 'IN') {
      rowBg = "F0FDF4"; // Fresh Light Green
      textRgb = "065F46";
      flowRgb = "059669";
    } else if (tx.type === 'PERMANENT') {
      rowBg = "FFFBEB"; // Light Amber
      textRgb = "92400E";
      flowRgb = "D97706";
    } else {
      rowBg = "FFF1F2"; // Soft Light Red/Rose
      textRgb = "9F1239";
      flowRgb = "E11D48";
    }

    // Apply color and borders across the row
    for (let c = 0; c <= 6; c++) {
      let align = "left";
      if (c === 0 || c === 6) align = "center";
      if (c === 1 || c === 3) align = "center";
      if (c === 4 || c === 5) align = "right";

      let isBold = (c === 4 || c === 5 || c === 3);

      setCellStyle(ws1, r, c, {
        fill: { fgColor: { rgb: rowBg } },
        font: {
          name: "Calibri",
          sz: 10,
          bold: isBold,
          color: { rgb: (c === 4 || c === 5) ? flowRgb : textRgb }
        },
        alignment: { horizontal: align, vertical: "center" },
        border: borderThinLight
      });
    }
  });

  XLSX.utils.book_append_sheet(wb, ws1, "Transactions History");

  // -------------------------------------------------------------
  // Sheet 2: Month-End Financial Advice & Savings Plan (Rich Purple Theme)
  // -------------------------------------------------------------
  const needsBudget = Math.round(totalIncome * 0.5);
  const wantsBudget = Math.round(totalIncome * 0.3);
  const savingsBudget = Math.round(totalIncome * 0.2);
  const maxMonthlyBudget = Math.round(totalIncome * 0.8);

  const now = new Date();
  let daysInMonth = 30;
  if (activeMonthKey !== 'ALL' && activeMonthKey.includes('-')) {
    const [yStr, mStr] = activeMonthKey.split('-');
    daysInMonth = new Date(parseInt(yStr, 10), parseInt(mStr, 10), 0).getDate();
  }
  const baseDailyCap = totalIncome > 0 ? Math.max(0, Math.floor(maxMonthlyBudget / daysInMonth)) : 0;
  const daysPassed = Math.min(daysInMonth, Math.max(1, now.getDate()));
  const remainingDays = Math.max(1, daysInMonth - daysPassed + 1);
  const remainingBudget = maxMonthlyBudget - totalExpense;
  const adjustedDailyCap = remainingBudget > 0 ? Math.floor(remainingBudget / remainingDays) : 0;
  const dailyCut = Math.max(0, baseDailyCap - adjustedDailyCap);

  const sheet2Data = [
    ["SMARTFLOW - MONTH-END SAVINGS & BUDGET ADVISOR", "", "", ""],
    ["Target Period:", monthLabel, "Generated At:", exportTimestamp],
    ["", "", "", ""],
    ["1. THE 50 / 30 / 20 BUDGET DISTRIBUTION TARGETS", "", "", ""],
    ["Budget Bucket", "Recommended %", "Target Amount (PKR)", "Description / Purpose"],
    ["Needs (Essentials)", "50% max", needsBudget, "Rent, groceries, utility bills, transportation"],
    ["Wants (Lifestyle)", "30% max", wantsBudget, "Dining out, entertainment, shopping, subscriptions"],
    ["Savings (Future)", "20% min", savingsBudget, "Emergency reserve, investments, wealth accumulation"],
    ["", "", "", ""],
    ["2. DAILY BUDGET & SPENDING PACING GUIDELINES", "", "", ""],
    ["Base Daily Spend Cap:", `Rs. ${baseDailyCap.toLocaleString()} / day`, "(Safe allowance to maintain 20% savings)", ""],
    ["Current Daily Pace Status:", dailyCut > 0 ? `Over Cap Pace: Cut Rs. ${dailyCut.toLocaleString()} / day needed` : "Within Cap: Spending pace is safe", "", ""],
    ["Adjusted Daily Cap for Remaining Days:", `Rs. ${adjustedDailyCap.toLocaleString()} / day`, `(${remainingDays} days remaining to balance budget)`, ""],
    ["", "", "", ""],
    ["3. ACTIONABLE MONEY-SAVING RULES & ADVICE", "", "", ""],
    ["Rule 1: Pay Yourself First", `Salary aate hi foran kam az kam 20% (Rs. ${savingsBudget.toLocaleString()}) alag account mein transfer karein.`, "", ""],
    ["Rule 2: 72-Hour Rule", "Ghair zaroori impulse purchase karne se pehle 72 ghante intezar karein.", "", ""],
    ["Rule 3: Daily Cap Discipline", dailyCut > 0 ? `Cap pura karne ke liye rozana Rs. ${dailyCut.toLocaleString()} kami karein taake month-end balance ho sake.` : "Apne rozana kharche ko daily cap ke andar rakhein.", "", ""],
    ["Rule 4: Emergency Fund", `Kam az kam 3 mahine ke kharchon (Rs. ${(totalExpense * 3).toLocaleString()}) ka emergency buffer maintain karein.`, "", ""]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Sheet 2 Banner
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // 50/30/20 Banner
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } }, // Daily Pacing Banner
    { s: { r: 14, c: 0 }, e: { r: 14, c: 3 } } // Actionable Rules Banner
  ];

  ws2['!cols'] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 25 },
    { wch: 65 }
  ];

  // Sheet 2 Styles
  // Main Title
  for (let c = 0; c <= 3; c++) {
    setCellStyle(ws2, 0, c, {
      fill: { fgColor: { rgb: "581C87" } }, // Deep Royal Purple
      font: { name: "Calibri", sz: 13, bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // 50/30/20 Header
  for (let c = 0; c <= 3; c++) {
    setCellStyle(ws2, 3, c, {
      fill: { fgColor: { rgb: "7C3AED" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // Table Columns Header (Row 4)
  for (let c = 0; c <= 3; c++) {
    setCellStyle(ws2, 4, c, {
      fill: { fgColor: { rgb: "EDE9FE" } },
      font: { bold: true, color: { rgb: "4C1D95" } },
      border: borderThinLight
    });
  }

  // Needs, Wants, Savings rows
  setCellStyle(ws2, 5, 0, { fill: { fgColor: { rgb: "ECFDF5" } }, font: { bold: true, color: { rgb: "065F46" } }, border: borderThinLight });
  setCellStyle(ws2, 5, 1, { fill: { fgColor: { rgb: "ECFDF5" } }, border: borderThinLight });
  setCellStyle(ws2, 5, 2, { fill: { fgColor: { rgb: "ECFDF5" } }, font: { bold: true, color: { rgb: "065F46" } }, alignment: { horizontal: "right" }, border: borderThinLight });
  setCellStyle(ws2, 5, 3, { fill: { fgColor: { rgb: "ECFDF5" } }, border: borderThinLight });

  setCellStyle(ws2, 6, 0, { fill: { fgColor: { rgb: "FFFBEB" } }, font: { bold: true, color: { rgb: "92400E" } }, border: borderThinLight });
  setCellStyle(ws2, 6, 1, { fill: { fgColor: { rgb: "FFFBEB" } }, border: borderThinLight });
  setCellStyle(ws2, 6, 2, { fill: { fgColor: { rgb: "FFFBEB" } }, font: { bold: true, color: { rgb: "92400E" } }, alignment: { horizontal: "right" }, border: borderThinLight });
  setCellStyle(ws2, 6, 3, { fill: { fgColor: { rgb: "FFFBEB" } }, border: borderThinLight });

  setCellStyle(ws2, 7, 0, { fill: { fgColor: { rgb: "EFF6FF" } }, font: { bold: true, color: { rgb: "1E40AF" } }, border: borderThinLight });
  setCellStyle(ws2, 7, 1, { fill: { fgColor: { rgb: "EFF6FF" } }, border: borderThinLight });
  setCellStyle(ws2, 7, 2, { fill: { fgColor: { rgb: "EFF6FF" } }, font: { bold: true, color: { rgb: "1E40AF" } }, alignment: { horizontal: "right" }, border: borderThinLight });
  setCellStyle(ws2, 7, 3, { fill: { fgColor: { rgb: "EFF6FF" } }, border: borderThinLight });

  // Section 2 Daily Pacing Banner
  for (let c = 0; c <= 3; c++) {
    setCellStyle(ws2, 9, c, {
      fill: { fgColor: { rgb: "4338CA" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // Section 3 Rules Banner
  for (let c = 0; c <= 3; c++) {
    setCellStyle(ws2, 14, c, {
      fill: { fgColor: { rgb: "047857" } }, // Emerald Green
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // Actionable Rules rows styling
  for (let r = 15; r <= 18; r++) {
    for (let c = 0; c <= 3; c++) {
      setCellStyle(ws2, r, c, {
        fill: { fgColor: { rgb: r % 2 === 0 ? "F8FAFC" : "FFFFFF" } },
        font: { name: "Calibri", sz: 10, bold: c === 0, color: { rgb: c === 0 ? "065F46" : "334155" } },
        border: borderThinLight
      });
    }
  }

  XLSX.utils.book_append_sheet(wb, ws2, "Savings & Budget Advice");

  // -------------------------------------------------------------
  // Trigger file download
  // -------------------------------------------------------------
  const safeFilename = `SmartFlow_${activeMonthKey === 'ALL' ? 'AllTime' : activeMonthKey}_Report.xlsx`;
  XLSX.writeFile(wb, safeFilename);

  showToast(`📊 Colorful Executive Excel Report downloaded: ${safeFilename}`, 'success');
}