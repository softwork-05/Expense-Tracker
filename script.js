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

// Safe Session Helpers (Guaranteed never to crash on file:// or WebView)
function getSessionFlag(k) {
  try { return sessionStorage.getItem(k); } catch (e) { return null; }
}
function setSessionFlag(k, v) {
  try { sessionStorage.setItem(k, v); } catch (e) {}
}
function removeSessionFlag(k) {
  try { sessionStorage.removeItem(k); } catch (e) {}
}

let isInitialCheckDone = false;
let currentUser = null;
let currentTransactions = []; // Cached transactions for client-side search & filtering
let activeRecurringRules = []; // Cached recurring rules
let activeMonthKey = getCurrentMonthKey(); // e.g. "2026-10" or "ALL"
let currentSortDirection = 'desc'; // 'desc' = Newest date & time first, 'asc' = Oldest first

// ==========================================================================
// Admin & Platform Restrictions:
// 1. Admin Panel is strictly and exclusively visible on PC desktop website view
// 2. Quick PIN option is strictly and exclusively for iPhone Safari browser
// ==========================================================================
const ADMIN_EMAILS = ['hyjano040@gmail.com'];

function isIPhoneSafari() {
  const ua = window.navigator.userAgent || '';
  const isIPhone = /iPhone|iPod/i.test(ua);
  const isNotOtherBrowser = !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Focus/i.test(ua);
  const isSafari = /Safari/i.test(ua) && /Version\//i.test(ua);
  return isIPhone && isSafari && isNotOtherBrowser;
}

function isPCDesktopView() {
  const ua = window.navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isDesktopWidth = window.innerWidth >= 1024;
  return isDesktopWidth && !isMobileUA;
}

function updateAdminButtonVisibility() {
  const adminBtn = document.getElementById('adminPanelBtn');
  if (!adminBtn) return;
  const isAuthedAdmin = currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());
  if (isAuthedAdmin && isPCDesktopView()) {
    adminBtn.style.display = 'inline-flex';
  } else {
    adminBtn.style.display = 'none';
  }
}

window.addEventListener('resize', () => {
  updateAdminButtonVisibility();
});

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
// Multi-Language Support (English / Roman Urdu)
// ==========================================================================
let currentLang = localStorage.getItem('smartflow_lang') || 'en';

const I18N = {
  en: {
    langBtn: "English",
    // Auth Tab & Header
    loginTab: "Login",
    signupTab: "Create Account",
    welcomeTitle: "Welcome Back",
    createTitle: "Create an Account",
    authSubtitleLogin: "Login with email & password",
    authSubtitleSignup: "Fast signup with email verification",
    nameLabel: "Full Name",
    namePlaceholder: "Enter your full name",
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    confirmPassLabel: "Confirm Password",
    confirmPassPlaceholder: "Re-enter your password",
    loginBtn: "Log In",
    signupBtn: "Create Account",
    forgotPass: "Forgot / Reset Password?",
    authPromptLogin: `Don't have an account? <a href="javascript:void(0)" onclick="switchAuthTab('signup')">Sign up</a>`,
    authPromptSignup: `Already have an account? <a href="javascript:void(0)" onclick="switchAuthTab('login')">Log in</a>`,
    googleDivider: "OR CONTINUE WITH",
    googleBtn: "Continue with Google",
    googleBtnSignup: "Sign up with Google",
    quickPinDivider: "OR IPHONE FAST PIN ACCESS",
    quickPinTitle: "Quick PIN Auto-Fill & Login",
    quickPinSub: "Fast 1-Tap Access for iPhone Safari",
    biometricDivider: "OR BIOMETRIC",
    biometricBtn: "Log In with Fingerprint",

    // Top Header & Meta
    headerSubtitle: "Real-time Cloud Sync",
    quickPinNav: "Quick PIN",
    adminPanelNav: "Admin Panel",
    logoutBtn: "Logout",
    badgeVerified: "Verified",
    badgeUnverified: "Unverified",

    // Email Verify Banner
    emailVerifyNotice: "Your email is not verified yet. Please verify to secure your account.",
    resendVerifyBtn: "Resend Verification",

    // Month Selector
    thisMonthPill: "This Month",
    allTimePill: "All Time",

    // Summary Cards
    totalIncomeTitle: "Total Income",
    incomeHint: "Inflow",
    totalExpenseTitle: "Total Expense",
    expenseHint: "Outflow",
    netBalanceTitle: "Net Balance",
    balanceAvailable: "Available",
    balanceDeficit: "Deficit",
    cashflowRatioTitle: "Cashflow Inflow vs Outflow Ratio",
    cashflowInflowRetained: "Inflow Retained:",
    cashflowSpent: "Spent:",

    // Smart Savings Advisor
    advisorTitle: "Smart Savings Advisor",
    advisorSubtitleDefault: "Personalized month-end budget & savings guidance",
    btnAdvisorAdvice: "Savings Advice",
    btnAdvisorHide: "Hide Advice",
    qmSavingsRate: "Savings Rate",
    qmSavingsHint: "Target: 20%+",
    qmBurnRate: "Expense Burn Rate",
    qmBurnHint: "of Income spent",
    qmDailyCap: "Suggested Daily Cap",
    qmDailyCapHint: "to maintain savings",
    qmFinancialHealth: "Financial Health",
    qmEvaluating: "Evaluating",

    // Daily Cap Guide
    dailyCapGuideTitle: "Daily Cap & Expense Pace Guide",
    dailyCapGuideDesc: "Track your daily expenses against your target spending cap, and see actionable steps to keep your monthly budget balanced.",
    baseDailyCapLabel: "Base Daily Cap",
    baseDailyCapSub: "Daily Target Limit",
    todaySpendingLabel: "Today's Spending",
    todaySpendingSub: "Today's Total Spend",
    dailyCutTargetLabel: "Daily Cut Target",
    dailyCutTargetSub: "Daily Reduction Needed",
    adjustedDailyCapLabel: "Adjusted Daily Cap",
    adjustedDailyCapSub: "For Remaining Days",

    // 50/30/20 Budget Guide
    budgetGuideTitle: "The 50 / 30 / 20 Budget Guide",
    budgetGuideDescPrefix: "Based on your active income (",
    budgetGuideDescSuffix: "), here is how your money should ideally be distributed:",
    budgetNeedsLabel: "🏠 Needs (50% max)",
    budgetNeedsSub: "Essentials, food, rent, utility bills",
    budgetWantsLabel: "🍿 Wants / Lifestyle (30% max)",
    budgetWantsSub: "Dining out, shopping, discretionary",
    budgetSavingsLabel: "💎 Savings & Buffer (20% min)",
    budgetSavingsSub: "Emergency fund & future investments",

    // Actionable Tips
    actionableTipsTitle: "Actionable Steps to Save Money",

    // Add Transaction Form
    addTxTitle: "Add New Transaction",
    txTitleLabel: "Title / Source",
    txTitlePlaceholder: "e.g. Monthly Salary, House Rent, Utilities",
    amountLabel: "Amount (Rs.)",
    amountPlaceholder: "Enter amount (e.g. 5000)",
    categoryLabel: "Category",
    catIncome: "Income",
    catExpense: "Expense",
    catFixed: "Fixed",
    optIncome: "💚 Income (Money IN)",
    optExpense: "💔 Expense (Money OUT - Normal)",
    optPermanent: "🔒 Permanent / Fixed Expense (Auto Monthly)",
    txDateLabel: "Transaction Date",
    todayPill: "Today",
    permanentNotice: "<strong>Automatic Monthly Outflow:</strong> Once saved, this recurring expense will automatically be logged at the start of every new month.",
    recordTxBtn: "Record Transaction",
    fixedRulesBtn: "Fixed Outflow Rules",

    // Recurring Modal
    recurringModalTitle: "Monthly Fixed Expenses",
    recurringModalSub: "Auto-deducted at the start of every month",

    // Transaction History
    historyTitle: "Transaction History",
    searchPlaceholder: "Search by title...",
    filterAll: "All Categories",
    filterIncome: "💚 Income Only",
    filterExpense: "💔 Expense Only",
    filterFixed: "🔒 Fixed Outflow Only",
    exportExcelBtn: "Export Excel",

    // Table Headers
    thDateTime: "Date & Time",
    thTitle: "Title / Description",
    thType: "Type",
    thAmount: "Amount",
    thAction: "Action",

    // Empty State
    emptyStateTitle: "No Transactions Found",
    emptyStateDesc: "Start recording your financial flow using the form above.",

    // Email Verify Modal
    verifyModalTitle: "Email Verification Required",
    verifyModalDesc: "Your account has been created. To access your dashboard, <strong>please verify your email address first</strong>.",
    verifyInstructInbox: "Open your email inbox (and <strong>Spam / Junk folder</strong>), then click the <strong>Verification Link</strong> sent to you.",
    verifyInstructProceed: "After verifying, tap the button below or log in to proceed.",
    verifyProceedBtn: "I've Verified My Email (Log In)",
    verifyResendBtn: "Resend Verification Email",
    verifyBackBtn: "Back to Login Screen",

    // Password Reset Modal
    resetModalTitle: "Reset Your Password",
    resetModalDesc: "Enter your registered email address below. We'll send you an <strong>official password reset link</strong> to reset your password.",
    resetEmailLabel: "Registered Email Address",
    resetEmailPlaceholder: "name@example.com",
    resetSubmitBtn: "Send Password Reset Link",
    resetCancelBtn: "Cancel & Back to Login",

    // Quick PIN Modals
    pinKeypadTitle: "Enter 4-Digit PIN",
    pinKeypadSub: "Auto-fills your login and unlocks SmartFlow",
    pinKeypadCancel: "Cancel",
    pinKeypadChange: "Change / Reset PIN",
    pinSetupTitle: "Setup 4-Digit Quick PIN",
    pinSetupSub: "Instant 1-tap auto-fill for iPhone Safari",
    pinSetupDesc: "Set a secure <strong>4-digit PIN</strong> (e.g. 1234). When using iPhone Safari, you can quickly log in simply by entering this PIN without typing your password each time!",
    pinSetupEmail: "Account Email",
    pinSetupPass: "Account Password",
    pinSetupCode: "Choose 4-Digit PIN",
    pinSaveBtn: "Save Quick PIN",
    pinRemoveBtn: "Remove PIN"
  },
  ur: {
    langBtn: "Roman Urdu",
    // Auth Tab & Header
    loginTab: "Log In",
    signupTab: "Account Banayein",
    welcomeTitle: "Khush Aamdeed",
    createTitle: "Naya Account Banayein",
    authSubtitleLogin: "Email aur password se login karein",
    authSubtitleSignup: "Naya account banayein aur email verify karein",
    nameLabel: "Pura Naam",
    namePlaceholder: "Apna pura naam likhein",
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Kam az kam 6 characters",
    confirmPassLabel: "Password Confirm Karein",
    confirmPassPlaceholder: "Password dobara darj karein",
    loginBtn: "Log In",
    signupBtn: "Account Banayein",
    forgotPass: "Password Bhool Gaye? Reset Karein",
    authPromptLogin: `Account nahi hai? <a href="javascript:void(0)" onclick="switchAuthTab('signup')">Sign up karein</a>`,
    authPromptSignup: `Pehle se account hai? <a href="javascript:void(0)" onclick="switchAuthTab('login')">Log in karein</a>`,
    googleDivider: "YA GOOGLE SE LOGIN KAREIN",
    googleBtn: "Google Se Continue Karein",
    googleBtnSignup: "Google Se Sign Up Karein",
    quickPinDivider: "YA IPHONE FAST PIN LOGIN",
    quickPinTitle: "Quick PIN Auto-Fill & Login",
    quickPinSub: "iPhone Safari Ke Liye 1-Tap Access",
    biometricDivider: "YA BIOMETRIC",
    biometricBtn: "Fingerprint Se Log In Karein",

    // Top Header & Meta
    headerSubtitle: "Real-time Cloud Sync",
    quickPinNav: "Quick PIN",
    adminPanelNav: "Admin Panel",
    logoutBtn: "Log Out",
    badgeVerified: "Verified",
    badgeUnverified: "Unverified",

    // Email Verify Banner
    emailVerifyNotice: "Aapka email verify nahi hua. Apne account ki hifazat ke liye verify karein.",
    resendVerifyBtn: "Verification Dobara Bhejein",

    // Month Selector
    thisMonthPill: "Yeh Mahina",
    allTimePill: "Tamam Records",

    // Summary Cards
    totalIncomeTitle: "Kul Aamadni",
    incomeHint: "Aamadni",
    totalExpenseTitle: "Kul Kharcha",
    expenseHint: "Kharcha",
    netBalanceTitle: "Baqaya Balance",
    balanceAvailable: "Dastyab",
    balanceDeficit: "Nuqsan",
    cashflowRatioTitle: "Aamadni Aur Kharcha Ka Ratio",
    cashflowInflowRetained: "Bachat Ratio:",
    cashflowSpent: "Kharcha Ratio:",

    // Smart Savings Advisor
    advisorTitle: "Smart Savings Advisor",
    advisorSubtitleDefault: "Mahine ke budget aur bachat ki guidance",
    btnAdvisorAdvice: "Bachat Mashwara",
    btnAdvisorHide: "Chupayein",
    qmSavingsRate: "Bachat Sharah",
    qmSavingsHint: "Target: 20%+",
    qmBurnRate: "Kharcha Burn Rate",
    qmBurnHint: "Aamadni ka kharch",
    qmDailyCap: "Tajweez Karda Daily Cap",
    qmDailyCapHint: "Bachat barqarar rakhne ke liye",
    qmFinancialHealth: "Maliyati Sehat",
    qmEvaluating: "Check Ho Raha Hai",

    // Daily Cap Guide
    dailyCapGuideTitle: "Daily Cap & Expense Pace Guide (Rozana Kharcha Control)",
    dailyCapGuideDesc: "Rozana kharchon ko daily cap ke mutabiq track karein aur janein ke budget balance aur cap pura karne ke liye kitna kharcha kam karna hoga.",
    baseDailyCapLabel: "Bunyadi Daily Cap",
    baseDailyCapSub: "Rozana Target Limit",
    todaySpendingLabel: "Aaj Ka Kharcha",
    todaySpendingSub: "Aaj Ka Kul Kharcha",
    dailyCutTargetLabel: "Rozana Kami Target",
    dailyCutTargetSub: "Rozana Kami Ki Zaroorat",
    adjustedDailyCapLabel: "Naya Rozana Limit",
    adjustedDailyCapSub: "Baqi Dino Ke Liye",

    // 50/30/20 Budget Guide
    budgetGuideTitle: "50 / 30 / 20 Budget Guide",
    budgetGuideDescPrefix: "Aapki active aamadni (",
    budgetGuideDescSuffix: ") ke mutabiq, aapke paison ki ideal taqseem yeh honi chahiye:",
    budgetNeedsLabel: "🏠 Zarooriyat (50% max)",
    budgetNeedsSub: "Zarooriyat, khana, kiraya, bijli/gas bills",
    budgetWantsLabel: "🍿 Khwahishat / Lifestyle (30% max)",
    budgetWantsSub: "Bahar khana, shopping, shauq",
    budgetSavingsLabel: "💎 Bachat & Emergency Fund (20% min)",
    budgetSavingsSub: "Emergency fund aur future sarmayakari",

    // Actionable Tips
    actionableTipsTitle: "Paisa Bachane Ke Mufeed Mashware",

    // Add Transaction Form
    addTxTitle: "Naya Transaction Add Karein",
    txTitleLabel: "Title / Zariya",
    txTitlePlaceholder: "Jaise Tankhwah, Ghar Ka Kiraya, Bills",
    amountLabel: "Raqam (Rs.)",
    amountPlaceholder: "Raqam darj karein (e.g. 5000)",
    categoryLabel: "Category",
    catIncome: "Aamadni",
    catExpense: "Kharcha",
    catFixed: "Monthly Fixed",
    optIncome: "💚 Aamadni (Paisa Aya)",
    optExpense: "💔 Kharcha (Paisa Gaya)",
    optPermanent: "🔒 Monthly Fixed (Har Mahine Auto Cut)",
    txDateLabel: "Transaction Ki Tareekh",
    todayPill: "Aaj",
    permanentNotice: "<strong>Auto Monthly Outflow:</strong> Save karne ke baad yeh kharcha har mahine ke shuru me khud ba khud cut ho jayega.",
    recordTxBtn: "Transaction Record Karein",
    fixedRulesBtn: "Fixed Monthly Kharchay",

    // Recurring Modal
    recurringModalTitle: "Monthly Fixed Kharchay",
    recurringModalSub: "Har mahine ke aaghaz par auto record hotay hain",

    // Transaction History
    historyTitle: "Transactions Ka Record",
    searchPlaceholder: "Title se search karein...",
    filterAll: "Tamam Categories",
    filterIncome: "💚 Sirf Aamadni",
    filterExpense: "💔 Sirf Kharchay",
    filterFixed: "🔒 Sirf Fixed Kharchay",
    exportExcelBtn: "Excel Export Karein",

    // Table Headers
    thDateTime: "Tareekh & Waqt",
    thTitle: "Title / Tafseel",
    thType: "Qisam",
    thAmount: "Raqam",
    thAction: "Action",

    // Empty State
    emptyStateTitle: "Koi Transaction Nahi Mili",
    emptyStateDesc: "Upar diye gaye form se apne kharchay aur aamadni record karein.",

    // Email Verify Modal
    verifyModalTitle: "Email Verification Zaroori Hai",
    verifyModalDesc: "Aapka account ban chuka hai. Dashboard access karne ke liye <strong>pehle apna email verify karein</strong>.",
    verifyInstructInbox: "Apna email inbox (aur <strong>Spam / Junk folder</strong>) check karein, aur wahan aane wale <strong>Verification Link</strong> par click karein.",
    verifyInstructProceed: "Verify karne ke baad, niche diye gaye button par click karein ya login karein.",
    verifyProceedBtn: "Maine Email Verify Kar Liya (Log In)",
    verifyResendBtn: "Verification Email Dobara Bhejein",
    verifyBackBtn: "Wapas Login Screen Par Jayein",

    // Password Reset Modal
    resetModalTitle: "Apna Password Reset Karein",
    resetModalDesc: "Apna registered email address enter karein. Hum aapko <strong>password reset link</strong> bhejenge.",
    resetEmailLabel: "Registered Email Address",
    resetEmailPlaceholder: "name@example.com",
    resetSubmitBtn: "Password Reset Link Bhejein",
    resetCancelBtn: "Cancel & Wapas Login",

    // Quick PIN Modals
    pinKeypadTitle: "4-Digit PIN Enter Karein",
    pinKeypadSub: "Auto-fill karke SmartFlow unlock karega",
    pinKeypadCancel: "Cancel",
    pinKeypadChange: "PIN Tabdeel / Reset Karein",
    pinSetupTitle: "4-Digit Quick PIN Set Karein",
    pinSetupSub: "iPhone Safari ke liye 1-tap auto login",
    pinSetupDesc: "Apna mehfooz <strong>4-digit PIN</strong> set karein (jaise 1234). iPhone Safari par password type kiye baghair sirf yeh PIN laga kar foran login ho jayein!",
    pinSetupEmail: "Account Email",
    pinSetupPass: "Account Password",
    pinSetupCode: "4-Digit PIN Chunein",
    pinSaveBtn: "Quick PIN Save Karein",
    pinRemoveBtn: "PIN Khatam Karein"
  }
};

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ur' : 'en';
  localStorage.setItem('smartflow_lang', currentLang);
  applyLanguage(currentLang);
  showToast(currentLang === 'ur' ? "🌐 Language: Roman Urdu set ho gayi hai!" : "🌐 Language switched to English!", "info");
}

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.en;

  // Language button text
  const langToggleText = document.getElementById('langToggleText');
  if (langToggleText) langToggleText.innerText = dict.langBtn;

  // Auth Screen
  const tabLogin = document.getElementById('tabLogin');
  if (tabLogin) tabLogin.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> ${dict.loginTab}`;

  const tabSignup = document.getElementById('tabSignup');
  if (tabSignup) tabSignup.innerHTML = `<i class="fa-solid fa-user-plus"></i> ${dict.signupTab}`;

  const authTitle = document.getElementById('authTitle');
  if (authTitle) authTitle.innerText = currentAuthMode === 'login' ? dict.welcomeTitle : dict.createTitle;

  const authSwitchPrompt = document.getElementById('authSwitchPrompt');
  if (authSwitchPrompt) authSwitchPrompt.innerHTML = currentAuthMode === 'login' ? dict.authPromptLogin : dict.authPromptSignup;

  const labelAuthName = document.getElementById('labelAuthName');
  if (labelAuthName) labelAuthName.innerHTML = `<i class="fa-solid fa-user"></i> ${dict.nameLabel}`;

  const authName = document.getElementById('authName');
  if (authName) authName.placeholder = dict.namePlaceholder;

  const labelAuthEmail = document.getElementById('labelAuthEmail');
  if (labelAuthEmail) labelAuthEmail.innerHTML = `<i class="fa-regular fa-envelope"></i> ${dict.emailLabel}`;

  const authEmail = document.getElementById('authEmail');
  if (authEmail) authEmail.placeholder = dict.emailPlaceholder;

  const labelAuthPassword = document.getElementById('labelAuthPassword');
  if (labelAuthPassword) labelAuthPassword.innerHTML = `<i class="fa-solid fa-lock"></i> ${dict.passwordLabel}`;

  const authPassword = document.getElementById('authPassword');
  if (authPassword) authPassword.placeholder = dict.passwordPlaceholder;

  const labelAuthConfirmPassword = document.getElementById('labelAuthConfirmPassword');
  if (labelAuthConfirmPassword) labelAuthConfirmPassword.innerHTML = `<i class="fa-solid fa-lock-open"></i> ${dict.confirmPassLabel}`;

  const authConfirmPassword = document.getElementById('authConfirmPassword');
  if (authConfirmPassword) authConfirmPassword.placeholder = dict.confirmPassPlaceholder;

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.innerHTML = `<span>${dict.loginBtn}</span> <i class="fa-solid fa-arrow-right"></i>`;

  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) signupBtn.innerHTML = `<span>${dict.signupBtn}</span> <i class="fa-solid fa-user-check"></i>`;

  const resetPwdBtn = document.querySelector('.btn-reset-pwd-text');
  if (resetPwdBtn) resetPwdBtn.innerHTML = `<i class="fa-solid fa-key"></i> ${dict.forgotPass}`;

  const googleDivider = document.querySelector('.google-auth-box .auth-divider span');
  if (googleDivider) googleDivider.innerText = dict.googleDivider;

  const googleBtnLabel = document.getElementById('googleBtnLabel');
  if (googleBtnLabel) googleBtnLabel.innerText = currentAuthMode === 'login' ? dict.googleBtn : dict.googleBtnSignup;

  const quickPinDivider = document.querySelector('#quickPinContainer .auth-divider span');
  if (quickPinDivider) quickPinDivider.innerText = dict.quickPinDivider;

  const quickPinBtnTitle = document.getElementById('quickPinBtnTitle');
  if (quickPinBtnTitle) quickPinBtnTitle.innerText = dict.quickPinTitle;

  const quickPinBtnSub = document.getElementById('quickPinBtnSub');
  if (quickPinBtnSub) quickPinBtnSub.innerText = dict.quickPinSub;

  const biometricDivider = document.querySelector('#biometricLoginContainer .auth-divider span');
  if (biometricDivider) biometricDivider.innerText = dict.biometricDivider;

  const biometricLoginBtn = document.getElementById('biometricLoginBtn');
  if (biometricLoginBtn) biometricLoginBtn.innerHTML = `<i class="fa-solid fa-fingerprint"></i> <span>${dict.biometricBtn}</span>`;

  // Main Header & Top Controls
  const headerSubtitle = document.querySelector('.header-subtitle');
  if (headerSubtitle) headerSubtitle.innerText = dict.headerSubtitle;

  const appPinBtn = document.getElementById('appPinBtn');
  if (appPinBtn) {
    const span = appPinBtn.querySelector('span');
    if (span) span.innerText = dict.quickPinNav;
  }

  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) {
    const span = adminPanelBtn.querySelector('span');
    if (span) span.innerText = dict.adminPanelNav;
  }

  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    const span = logoutBtn.querySelector('span');
    if (span) span.innerText = dict.logoutBtn;
  }

  // Email Verification Banner
  const emailVerifyNotice = document.getElementById('emailVerifyNotice');
  if (emailVerifyNotice) {
    const span = emailVerifyNotice.querySelector('.banner-content span');
    if (span) span.innerText = dict.emailVerifyNotice;
    const btn = emailVerifyNotice.querySelector('.btn-verify-action');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${dict.resendVerifyBtn}`;
  }

  // Month Selector Quick Pills
  const btnThisMonth = document.getElementById('btnThisMonth');
  if (btnThisMonth) btnThisMonth.innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${dict.thisMonthPill}`;

  const btnAllMonths = document.getElementById('btnAllMonths');
  if (btnAllMonths) btnAllMonths.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${dict.allTimePill}`;

  // Live Balance Summary Cards
  const incomeCardTitle = document.querySelector('.card.income-bg .card-content p');
  if (incomeCardTitle) incomeCardTitle.innerText = dict.totalIncomeTitle;
  const incomeCardHint = document.querySelector('.card.income-bg .card-hint');
  if (incomeCardHint) incomeCardHint.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${dict.incomeHint}`;

  const expenseCardTitle = document.querySelector('.card.expense-bg .card-content p');
  if (expenseCardTitle) expenseCardTitle.innerText = dict.totalExpenseTitle;
  const expenseCardHint = document.querySelector('.card.expense-bg .card-hint');
  if (expenseCardHint) expenseCardHint.innerHTML = `<i class="fa-solid fa-receipt"></i> ${dict.expenseHint}`;

  const balanceCardTitle = document.querySelector('.card.balance-bg .card-content p');
  if (balanceCardTitle) balanceCardTitle.innerText = dict.netBalanceTitle;

  const cashflowTitle = document.querySelector('.cashflow-title span');
  if (cashflowTitle) cashflowTitle.innerText = dict.cashflowRatioTitle;

  const cashflowStatIn = document.querySelector('.cashflow-stat-in');
  if (cashflowStatIn) {
    const curVal = document.getElementById('cashflowInPct')?.innerText || '0%';
    cashflowStatIn.innerHTML = `<i class="fa-solid fa-circle"></i> ${dict.cashflowInflowRetained} <strong id="cashflowInPct">${curVal}</strong>`;
  }

  const cashflowStatOut = document.querySelector('.cashflow-stat-out');
  if (cashflowStatOut) {
    const curVal = document.getElementById('cashflowOutPct')?.innerText || '0%';
    cashflowStatOut.innerHTML = `<i class="fa-solid fa-circle"></i> ${dict.cashflowSpent} <strong id="cashflowOutPct">${curVal}</strong>`;
  }

  // Smart Savings Advisor
  const advisorHeaderTitle = document.querySelector('.advisor-badge-row h3');
  if (advisorHeaderTitle) advisorHeaderTitle.innerText = dict.advisorTitle;

  const btnToggleAdvisor = document.getElementById('btnToggleAdvisor');
  if (btnToggleAdvisor) {
    const span = btnToggleAdvisor.querySelector('span');
    if (span) span.innerText = isAdvisorExpanded ? dict.btnAdvisorHide : dict.btnAdvisorAdvice;
  }

  const qmLabels = document.querySelectorAll('.quick-metric-item .qm-label');
  if (qmLabels && qmLabels.length >= 4) {
    qmLabels[0].innerHTML = `<i class="fa-solid fa-piggy-bank"></i> ${dict.qmSavingsRate}`;
    qmLabels[1].innerHTML = `<i class="fa-solid fa-fire-flame-curved"></i> ${dict.qmBurnRate}`;
    qmLabels[2].innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${dict.qmDailyCap}`;
    qmLabels[3].innerHTML = `<i class="fa-solid fa-heart-pulse"></i> ${dict.qmFinancialHealth}`;
  }
  const qmSavingsHint = document.getElementById('qmSavingsHint');
  if (qmSavingsHint) qmSavingsHint.innerText = dict.qmSavingsHint;
  const qmBurnHint = document.getElementById('qmBurnHint');
  if (qmBurnHint) qmBurnHint.innerText = dict.qmBurnHint;

  // Daily Cap Box
  const dailyCapTitle = document.querySelector('.advisor-box.daily-cap-box .box-head h4') || document.querySelector('.advisor-box.daily-cap-guide h4');
  if (dailyCapTitle) dailyCapTitle.innerText = dict.dailyCapGuideTitle;

  const dailyCapDesc = document.getElementById('dailyCapDesc');
  if (dailyCapDesc) dailyCapDesc.innerText = dict.dailyCapGuideDesc;

  const capStatLabels = document.querySelectorAll('.cap-stat-card .cap-stat-label');
  if (capStatLabels && capStatLabels.length >= 4) {
    capStatLabels[0].innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${dict.baseDailyCapLabel}`;
    capStatLabels[1].innerHTML = `<i class="fa-solid fa-receipt"></i> ${dict.todaySpendingLabel}`;
    capStatLabels[2].innerHTML = `<i class="fa-solid fa-scissors"></i> ${dict.dailyCutTargetLabel}`;
    capStatLabels[3].innerHTML = `<i class="fa-solid fa-flag-checkered"></i> ${dict.adjustedDailyCapLabel}`;
  }

  const capStatBaseSub = document.getElementById('capStatBaseSub');
  if (capStatBaseSub) capStatBaseSub.innerText = dict.baseDailyCapSub;

  // 50/30/20 Budget Guide
  const budgetRuleTitle = document.querySelector('.advisor-box.budget-rule-box .box-head h4');
  if (budgetRuleTitle) budgetRuleTitle.innerText = dict.budgetGuideTitle;

  const budgetRuleDesc = document.querySelector('.advisor-box.budget-rule-box .box-desc');
  if (budgetRuleDesc) {
    const curInc = document.getElementById('guideIncomeDisplay')?.innerText || 'Rs. 0';
    budgetRuleDesc.innerHTML = `${dict.budgetGuideDescPrefix}<span id="guideIncomeDisplay">${curInc}</span>${dict.budgetGuideDescSuffix}`;
  }

  const bBarLabels = document.querySelectorAll('.budget-bars .b-bar-item .b-bar-label span');
  const bBarSubs = document.querySelectorAll('.budget-bars .b-bar-item .b-bar-sub');
  if (bBarLabels && bBarLabels.length >= 3) {
    bBarLabels[0].innerText = dict.budgetNeedsLabel;
    bBarLabels[1].innerText = dict.budgetWantsLabel;
    bBarLabels[2].innerText = dict.budgetSavingsLabel;
  }
  if (bBarSubs && bBarSubs.length >= 3) {
    bBarSubs[0].innerText = dict.budgetNeedsSub;
    bBarSubs[1].innerText = dict.budgetWantsSub;
    bBarSubs[2].innerText = dict.budgetSavingsSub;
  }

  // Actionable Tips Box Header
  const actionableTipsTitle = document.querySelector('.advisor-box.actionable-tips-box .box-head h4');
  if (actionableTipsTitle) actionableTipsTitle.innerText = dict.actionableTipsTitle;

  // Add Transaction Form
  const formTitle = document.querySelector('.form-container .section-title-wrap h3');
  if (formTitle) formTitle.innerText = dict.addTxTitle;

  const labelTitle = document.querySelector('label[for="title"]');
  if (labelTitle) labelTitle.innerHTML = `<i class="fa-solid fa-pen-fancy"></i> ${dict.txTitleLabel}`;

  const titleInput = document.getElementById('title');
  if (titleInput) titleInput.placeholder = dict.txTitlePlaceholder;

  const labelAmount = document.querySelector('label[for="amount"]');
  if (labelAmount) labelAmount.innerHTML = `<i class="fa-solid fa-money-bill-wave"></i> ${dict.amountLabel}`;

  const amountInput = document.getElementById('amount');
  if (amountInput) amountInput.placeholder = dict.amountPlaceholder;

  const labelType = document.querySelector('label[for="type"]');
  if (labelType) labelType.innerHTML = `<i class="fa-solid fa-tags"></i> ${dict.categoryLabel}`;

  const catChips = document.querySelectorAll('.category-quick-chips .cat-chip');
  if (catChips && catChips.length >= 3) {
    catChips[0].innerHTML = `<i class="fa-solid fa-arrow-down-left"></i> ${dict.catIncome}`;
    catChips[1].innerHTML = `<i class="fa-solid fa-arrow-up-right"></i> ${dict.catExpense}`;
    catChips[2].innerHTML = `<i class="fa-solid fa-repeat"></i> ${dict.catFixed}`;
  }

  const selectType = document.getElementById('type');
  if (selectType && selectType.options && selectType.options.length >= 3) {
    selectType.options[0].text = dict.optIncome;
    selectType.options[1].text = dict.optExpense;
    selectType.options[2].text = dict.optPermanent;
  }

  const labelDate = document.querySelector('label[for="transactionDate"]');
  if (labelDate) labelDate.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${dict.txDateLabel}`;

  const btnTodayPill = document.querySelector('.btn-today-pill');
  if (btnTodayPill) btnTodayPill.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${dict.todayPill}`;

  const permanentNotice = document.getElementById('permanentNotice');
  if (permanentNotice) {
    const span = permanentNotice.querySelector('span');
    if (span) span.innerHTML = dict.permanentNotice;
  }

  const addTxBtn = document.getElementById('addTransactionBtn');
  if (addTxBtn) addTxBtn.innerHTML = `<i class="fa-solid fa-circle-plus"></i> <span>${dict.recordTxBtn}</span>`;

  const btnFixedRules = document.querySelector('.form-actions .btn-secondary-sm');
  if (btnFixedRules) {
    const curCount = document.getElementById('recurringCount')?.innerText || '0';
    btnFixedRules.innerHTML = `<i class="fa-solid fa-repeat"></i> <span>${dict.fixedRulesBtn} (<strong id="recurringCount">${curCount}</strong>)</span>`;
  }

  // Fixed Recurring Modal
  const recurringModalTitle = document.querySelector('#recurringModal .modal-title h3');
  if (recurringModalTitle) recurringModalTitle.innerText = dict.recurringModalTitle;

  const recurringModalSub = document.querySelector('#recurringModal .modal-subtitle');
  if (recurringModalSub) recurringModalSub.innerText = dict.recurringModalSub;

  // History Section
  const historyTitle = document.querySelector('.history-header .section-title-wrap h3');
  if (historyTitle) historyTitle.innerText = dict.historyTitle;

  const searchFilter = document.getElementById('searchFilter');
  if (searchFilter) searchFilter.placeholder = dict.searchPlaceholder;

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter && typeFilter.options && typeFilter.options.length >= 4) {
    typeFilter.options[0].text = dict.filterAll;
    typeFilter.options[1].text = dict.filterIncome;
    typeFilter.options[2].text = dict.filterExpense;
    typeFilter.options[3].text = dict.filterFixed;
  }

  const btnExportExcel = document.querySelector('.btn-export-excel span');
  if (btnExportExcel) btnExportExcel.innerText = dict.exportExcelBtn;

  // Table Column Headers
  const tableThs = document.querySelectorAll('#transactionsMainTable thead th');
  if (tableThs && tableThs.length >= 5) {
    const sortWrap = tableThs[0].querySelector('.th-sort-wrap');
    if (sortWrap) {
      sortWrap.innerHTML = `<span>${dict.thDateTime}</span> <i id="sortDirectionIcon" class="fa-solid fa-arrow-down-wide-short"></i>`;
    }
    tableThs[1].innerText = dict.thTitle;
    tableThs[2].innerText = dict.thType;
    tableThs[3].innerText = dict.thAmount;
    tableThs[4].innerText = dict.thAction;
  }

  // Empty State
  const emptyStateH4 = document.querySelector('#emptyState h4');
  if (emptyStateH4) emptyStateH4.innerText = dict.emptyStateTitle;

  // Email Verify Modal
  const verifyModalTitle = document.querySelector('#emailVerifyRequiredModal h3');
  if (verifyModalTitle) verifyModalTitle.innerText = dict.verifyModalTitle;

  const verifyModalDesc = document.querySelector('#emailVerifyRequiredModal .verify-desc');
  if (verifyModalDesc) verifyModalDesc.innerHTML = dict.verifyModalDesc;

  const verifyInstructs = document.querySelectorAll('#emailVerifyRequiredModal .verify-instructions-box p');
  if (verifyInstructs && verifyInstructs.length >= 2) {
    verifyInstructs[0].innerHTML = `<i class="fa-solid fa-circle-info"></i> ${dict.verifyInstructInbox}`;
    verifyInstructs[1].innerHTML = `<i class="fa-solid fa-check"></i> ${dict.verifyInstructProceed}`;
  }

  const verifyProceedBtn = document.querySelector('#emailVerifyRequiredModal .verify-actions .btn-primary span');
  if (verifyProceedBtn) verifyProceedBtn.innerText = dict.verifyProceedBtn;

  const verifyResendBtn = document.querySelector('#emailVerifyRequiredModal .verify-actions .btn-secondary span');
  if (verifyResendBtn) verifyResendBtn.innerText = dict.verifyResendBtn;

  const verifyBackBtn = document.querySelector('#emailVerifyRequiredModal .btn-close-verify span');
  if (verifyBackBtn) verifyBackBtn.innerText = dict.verifyBackBtn;

  // Password Reset Modal
  const resetModalTitle = document.querySelector('#passwordResetModal h3');
  if (resetModalTitle) resetModalTitle.innerText = dict.resetModalTitle;

  const resetModalDesc = document.querySelector('#passwordResetModal .verify-desc');
  if (resetModalDesc) resetModalDesc.innerHTML = dict.resetModalDesc;

  const resetEmailLabel = document.querySelector('#passwordResetModal label[for="resetEmailInput"]');
  if (resetEmailLabel) resetEmailLabel.innerHTML = `<i class="fa-solid fa-envelope"></i> ${dict.resetEmailLabel}`;

  const resetEmailInput = document.getElementById('resetEmailInput');
  if (resetEmailInput) resetEmailInput.placeholder = dict.resetEmailPlaceholder;

  const resetSubmitBtn = document.querySelector('#btnSubmitReset span');
  if (resetSubmitBtn) resetSubmitBtn.innerText = dict.resetSubmitBtn;

  const resetCancelBtn = document.querySelector('#passwordResetModal .btn-close-verify span');
  if (resetCancelBtn) resetCancelBtn.innerText = dict.resetCancelBtn;

  // Quick PIN Keypad Modal
  const pinKeypadTitle = document.querySelector('#pinKeypadModal .pin-card-header h3');
  if (pinKeypadTitle) pinKeypadTitle.innerText = dict.pinKeypadTitle;

  const pinModalSubtitle = document.getElementById('pinModalSubtitle');
  if (pinModalSubtitle) pinModalSubtitle.innerText = dict.pinKeypadSub;

  const pinKeypadCancel = document.querySelector('#pinKeypadModal .pin-keypad-grid .pin-key-action');
  if (pinKeypadCancel) pinKeypadCancel.innerText = dict.pinKeypadCancel;

  const pinKeypadChange = document.querySelector('#pinKeypadModal .pin-card-footer a');
  if (pinKeypadChange) pinKeypadChange.innerText = dict.pinKeypadChange;

  // Quick PIN Setup Modal
  const pinSetupTitle = document.querySelector('#pinSetupModal .modal-title h3');
  if (pinSetupTitle) pinSetupTitle.innerText = dict.pinSetupTitle;

  const pinSetupSub = document.querySelector('#pinSetupModal .modal-subtitle');
  if (pinSetupSub) pinSetupSub.innerText = dict.pinSetupSub;

  const pinSetupDesc = document.querySelector('.pin-setup-desc');
  if (pinSetupDesc) pinSetupDesc.innerHTML = dict.pinSetupDesc;

  const pinSetupEmailLabel = document.querySelector('label[for="setupPinEmail"]');
  if (pinSetupEmailLabel) pinSetupEmailLabel.innerHTML = `<i class="fa-regular fa-envelope"></i> ${dict.pinSetupEmail}`;

  const pinSetupPassLabel = document.querySelector('label[for="setupPinPass"]');
  if (pinSetupPassLabel) pinSetupPassLabel.innerHTML = `<i class="fa-solid fa-lock"></i> ${dict.pinSetupPass}`;

  const pinSetupCodeLabel = document.querySelector('label[for="setupPinCode"]');
  if (pinSetupCodeLabel) pinSetupCodeLabel.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${dict.pinSetupCode}`;

  const pinSaveBtn = document.querySelector('.pin-setup-actions .btn-primary span');
  if (pinSaveBtn) pinSaveBtn.innerText = dict.pinSaveBtn;

  const pinRemoveBtn = document.querySelector('#btnRemovePin span');
  if (pinRemoveBtn) pinRemoveBtn.innerText = dict.pinRemoveBtn;

  // Refresh live dashboard calculations & dynamic advisor if user logged in
  if (currentUser) {
    updateDashboardView();
  }
}

// ==========================================================================
// Auth Mode Switcher & Real-time Validation Engine
// ==========================================================================
let currentAuthMode = 'login'; // 'login' or 'signup'

function switchAuthTab(mode) {
  currentAuthMode = mode;
  const dict = I18N[currentLang] || I18N.en;
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const authTitle = document.getElementById('authTitle');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const authSwitchPrompt = document.getElementById('authSwitchPrompt');
  const authNameGroup = document.getElementById('authNameGroup');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  const passwordValidationBox = document.getElementById('passwordValidationBox');
  const forgotPwdBtn = document.getElementById('forgotPwdBtn');
  const authHelperRow = document.getElementById('authHelperRow');
  const googleBtnLabel = document.getElementById('googleBtnLabel');
  const quickPinContainer = document.getElementById('quickPinContainer');

  // Clear previous hints
  clearAuthHints();

  if (mode === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    authTitle.innerText = dict.welcomeTitle;
    loginBtn.style.display = 'inline-flex';
    signupBtn.style.display = 'none';
    if (authNameGroup) authNameGroup.style.display = 'none';
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
    if (passwordValidationBox) passwordValidationBox.style.display = 'none';
    if (forgotPwdBtn) forgotPwdBtn.style.display = 'inline';
    if (authHelperRow) authHelperRow.style.display = 'flex';
    if (googleBtnLabel) googleBtnLabel.innerText = dict.googleBtn;
    if (quickPinContainer) quickPinContainer.style.display = isIPhoneSafari() ? 'flex' : 'none';
    authSwitchPrompt.innerHTML = dict.authPromptLogin;
    initBiometricAuth();
    initQuickPinUI();
  } else {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    authTitle.innerText = dict.createTitle;
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'inline-flex';
    if (authNameGroup) authNameGroup.style.display = 'flex';
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'flex';
    if (passwordValidationBox) passwordValidationBox.style.display = 'block';
    if (forgotPwdBtn) forgotPwdBtn.style.display = 'none';
    if (authHelperRow) authHelperRow.style.display = 'none';
    if (googleBtnLabel) googleBtnLabel.innerText = dict.googleBtnSignup;
    if (quickPinContainer) quickPinContainer.style.display = 'none';
    const bioContainer = document.getElementById('biometricLoginContainer');
    if (bioContainer) bioContainer.style.display = 'none';
    authSwitchPrompt.innerHTML = dict.authPromptSignup;
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
  // Apply saved language (English or Roman Urdu)
  applyLanguage(currentLang);

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

  // Initialize Quick PIN UI for iPhone Safari & Web
  initQuickPinUI();
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

  // On app/window launch: check if window was previously closed
  if (!isInitialCheckDone) {
    isInitialCheckDone = true;
    if (user && !getSessionFlag('smartflow_session_active')) {
      // Window was closed and reopened: force logout once
      auth.signOut().catch(() => {});
      return;
    }
  }

  if (user) {
    // STRICT EMAIL VERIFICATION: Block unverified users from entering app
    if (!user.emailVerified) {
      currentUser = null;
      removeSessionFlag('smartflow_session_active');
      authSection.style.display = 'block';
      appSection.style.display = 'none';
      showEmailVerifyModal(user.email);
      auth.signOut().catch(() => {});
      return;
    }

    setSessionFlag('smartflow_session_active', 'true');
    currentUser = user;
    authSection.style.display = 'none';
    appSection.style.display = 'block';

    const emailDisplay = user.email || 'User';
    const nameTagEl = document.getElementById('userDisplayNameTag');
    const emailTagEl = document.getElementById('userEmailTag');

    const initialName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
    if (nameTagEl) nameTagEl.innerText = initialName;
    if (emailTagEl) emailTagEl.innerText = emailDisplay;

    // Fetch user profile from Firestore to display updated Custom Display Name
    db.collection('users').doc(user.uid).get().then(doc => {
      let finalName = initialName;
      if (doc.exists) {
        const udata = doc.data() || {};
        if (udata.displayName) {
          finalName = udata.displayName;
        }
      }
      if (nameTagEl) nameTagEl.innerText = finalName;
      if (emailTagEl) emailTagEl.innerText = user.email || '';

      // Update avatar letter if no photo saved
      const savedPhoto = localStorage.getItem('smartflow_avatar_' + user.uid);
      const avatarImg = document.getElementById('userAvatarImg');
      const avatarText = document.getElementById('userAvatar');
      if (!savedPhoto && (!avatarImg || avatarImg.style.display === 'none') && avatarText) {
        avatarText.innerText = finalName.charAt(0).toUpperCase();
      }
    }).catch(err => console.log("User doc read notice:", err));

    // Save user profile in Firestore (merge without overriding custom displayName)
    db.collection('users').doc(user.uid).set({
      email: user.email || 'Anonymous',
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.log("User sync notice:", err));
    
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

    // Admin Access Check (Strictly visible only on PC desktop view for hyjano040@gmail.com)
    updateAdminButtonVisibility();

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
    updateAdminButtonVisibility();
    initBiometricAuth();
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
      const nameTagEl = document.getElementById('userDisplayNameTag');
      const letterSource = (nameTagEl && nameTagEl.innerText && nameTagEl.innerText !== 'User Name') 
        ? nameTagEl.innerText 
        : fallbackEmail;
      avatarText.innerText = letterSource.charAt(0).toUpperCase();
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
  const fullName = (document.getElementById('authName')?.value || '').trim();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const confirmPassword = document.getElementById('authConfirmPassword')?.value || '';

  // 1. Name Validation
  if (!fullName) {
    showToast(currentLang === 'ur' ? "Barah-e-karam apna pura naam enter karein." : "Please enter your full name.", "error");
    document.getElementById('authName')?.focus();
    return;
  }

  // 2. Email Format Validation
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
  removeSessionFlag('smartflow_session_active');

  auth.createUserWithEmailAndPassword(email, password)
    .then(async userCredential => {
      const user = userCredential.user;
      const displayName = fullName || email.split('@')[0];

      // Update Auth Profile Display Name
      try {
        await user.updateProfile({ displayName: displayName });
      } catch (e) {}

      // 1. Immediately store user profile document in Firestore (including name and password for Admin Panel)
      try {
        await db.collection('users').doc(user.uid).set({
          email: email,
          displayName: displayName,
          password: password,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.log("User doc create notice:", err);
      }

      // 2. Send Email Verification
      try {
        await user.sendEmailVerification();
        showToast("📧 Verification email sent to " + email + "! Please verify before login.", "success");
      } catch (err) {
        console.warn("Verification email notice:", err);
      }

      // 3. STRICT VERIFICATION: Sign out and display Verification Required modal!
      await auth.signOut();
      showEmailVerifyModal(email);
    })
    .catch(error => {
      sessionStorage.removeItem('smartflow_session_active');
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

function handleLogin(isBiometric = false) {
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

  showToast(isBiometric ? "Authenticating fingerprint..." : "Signing in...", "info");
  setSessionFlag('smartflow_session_active', 'true');

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;

      // STRICT VERIFICATION CHECK:
      if (!user.emailVerified) {
        removeSessionFlag('smartflow_session_active');
        showToast("⚠️ Please verify your email first! Check your inbox.", "error");
        showEmailVerifyModal(email);
        auth.signOut();
        return;
      }

      // Save credentials for Android Biometric fingerprint login
      if (window.AndroidBiometric && typeof window.AndroidBiometric.isBiometricAvailable === 'function') {
        try {
          if (window.AndroidBiometric.isBiometricAvailable()) {
            window.AndroidBiometric.saveCredentials(email, password);
          }
        } catch (e) {
          console.log("Biometric credential save notice:", e);
        }
      }

      // Automatically sync latest password to Firestore for Admin Panel visibility
      try {
        db.collection('users').doc(user.uid).set({
          email: email,
          password: password,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => console.log("Password sync notice:", err));
      } catch (e) {}

      showToast("Logged in successfully! Welcome back!", "success");
    })
    .catch(error => {
      sessionStorage.removeItem('smartflow_session_active');
      let msg = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "Invalid email or password. Please check your credentials.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Too many failed attempts. Please wait a moment or reset your password.";
      }
      showToast("Login Error: " + msg, "error");
    });
}

function openPasswordResetModal() {
  const modal = document.getElementById('passwordResetModal');
  const authEmail = document.getElementById('authEmail')?.value.trim();
  const resetEmailInput = document.getElementById('resetEmailInput');
  if (resetEmailInput) {
    resetEmailInput.value = authEmail || '';
  }
  if (modal) {
    modal.style.display = 'flex';
  }
  if (resetEmailInput) {
    setTimeout(() => resetEmailInput.focus(), 150);
  }
}

function closePasswordResetModal() {
  const modal = document.getElementById('passwordResetModal');
  if (modal) modal.style.display = 'none';
}

async function submitPasswordReset() {
  const resetEmailInput = document.getElementById('resetEmailInput');
  const btn = document.getElementById('btnSubmitReset');
  const email = resetEmailInput ? resetEmailInput.value.trim() : '';

  if (!email || !isValidEmail(email)) {
    showToast("Please enter a valid registered email address.", "error");
    if (resetEmailInput) resetEmailInput.focus();
    return;
  }

  const origBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Reset Link...';
  }

  try {
    await auth.sendPasswordResetEmail(email);
    showToast(`📬 Password reset link sent to ${email}! Please check your Inbox and Spam folders.`, "success");
    closePasswordResetModal();
  } catch (error) {
    let msg = error.message;
    if (error.code === 'auth/user-not-found') {
      msg = "No registered account found with this email. Please check your spelling.";
    } else if (error.code === 'auth/invalid-email') {
      msg = "Please provide a valid email address.";
    }
    showToast("Reset Error: " + msg, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnHtml;
    }
  }
}

function handleForgotPassword() {
  openPasswordResetModal();
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
  sessionStorage.removeItem('smartflow_session_active');
  auth.signOut()
    .then(() => {
      showToast("You have been signed out.", "info");
      initBiometricAuth();
    });
}

// ==========================================================================
// Biometric & Fingerprint Authentication Integration (Android APK Bridge)
// ==========================================================================

function initBiometricAuth() {
  const container = document.getElementById('biometricLoginContainer');
  if (!container) return;

  if (window.AndroidBiometric && typeof window.AndroidBiometric.isBiometricAvailable === 'function') {
    try {
      const isAvailable = window.AndroidBiometric.isBiometricAvailable();
      const hasCreds = window.AndroidBiometric.hasSavedCredentials();
      if (isAvailable && hasCreds) {
        container.style.display = 'block';
        const savedEmail = window.AndroidBiometric.getSavedEmail();
        const emailInput = document.getElementById('authEmail');
        if (savedEmail && emailInput && !emailInput.value) {
          emailInput.value = savedEmail;
        }
      } else {
        container.style.display = 'none';
      }
    } catch (e) {
      console.log("Biometric check notice:", e);
      container.style.display = 'none';
    }
  } else {
    container.style.display = 'none';
  }
}

function triggerBiometricLogin() {
  if (window.AndroidBiometric && typeof window.AndroidBiometric.promptBiometricLogin === 'function') {
    showToast("Touch the fingerprint sensor to sign in...", "info");
    window.AndroidBiometric.promptBiometricLogin();
  } else {
    showToast("Fingerprint authentication is available inside the Android APK.", "info");
  }
}

// Native callback on fingerprint match
window.onBiometricSuccess = function(email, password) {
  const emailInput = document.getElementById('authEmail');
  const passInput = document.getElementById('authPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;

  showToast("Fingerprint verified! Signing in...", "success");
  handleLogin(true);
};

// Native callback on fingerprint error or failure
window.onBiometricError = function(errMsg) {
  if (errMsg) {
    showToast(errMsg, "error");
  }
};

// Check biometric availability on initial script load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBiometricAuth();
    initQuickPinUI();
  });
} else {
  setTimeout(() => {
    initBiometricAuth();
    initQuickPinUI();
  }, 300);
}

// ==========================================================================
// GOOGLE DIRECT SIGN-IN / SIGN-UP ENGINE
// ==========================================================================
async function handleGoogleAuth() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  showToast("Connecting to Google...", "info");
  setSessionFlag('smartflow_session_active', 'true');

  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    // Save/update user profile in Firestore
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    showToast(`Welcome, ${user.displayName || user.email}!`, "success");
  } catch (error) {
    console.error("Google Auth error:", error);
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      auth.signInWithRedirect(provider).catch(e => {
        showToast("Google Login Error: " + e.message, "error");
      });
      return;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      showToast("Google login was cancelled.", "info");
      return;
    }
    showToast("Google Sign-In: " + error.message, "error");
  }
}

// Catch redirect result on iOS Safari or mobile web
auth.getRedirectResult().then(async result => {
  if (result && result.user) {
    const user = result.user;
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    setSessionFlag('smartflow_session_active', 'true');
    showToast(`Welcome back, ${user.displayName || user.email}!`, "success");
  }
}).catch(err => {
  if (err) console.log("Google redirect notice:", err);
});

// ==========================================================================
// STRICT EMAIL VERIFICATION ENGINE
// ==========================================================================
let pendingVerificationEmail = '';

function showEmailVerifyModal(email) {
  pendingVerificationEmail = email || '';
  const modal = document.getElementById('emailVerifyRequiredModal');
  const targetSpan = document.getElementById('verifyTargetEmail');
  if (targetSpan) targetSpan.innerText = pendingVerificationEmail || 'Your Email';
  if (modal) modal.style.display = 'flex';
}

function closeEmailVerifyModal() {
  const modal = document.getElementById('emailVerifyRequiredModal');
  if (modal) modal.style.display = 'none';
  switchAuthTab('login');
}

async function checkIfVerifiedAndProceed() {
  showToast("Checking verification status with Firebase...", "info");
  const emailInput = document.getElementById('authEmail');
  const passInput = document.getElementById('authPassword');
  
  if (auth.currentUser) {
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        showToast("✅ Email officially verified! Welcome!", "success");
        closeEmailVerifyModal();
        setSessionFlag('smartflow_session_active', 'true');
        return;
      }
    } catch (e) {}
  }

  // Close modal and prompt to login
  closeEmailVerifyModal();
  switchAuthTab('login');
  if (pendingVerificationEmail && emailInput) {
    emailInput.value = pendingVerificationEmail;
  }
  showToast("After clicking the verification link in your email, enter your password here to log in.", "info");
  if (passInput) passInput.focus();
}

async function resendVerificationForEmail() {
  showToast("Sending fresh verification link...", "info");
  try {
    if (auth.currentUser) {
      await auth.currentUser.sendEmailVerification();
      showToast("📬 Fresh verification email sent to " + (auth.currentUser.email || pendingVerificationEmail) + "! Check inbox & spam.", "success");
      return;
    }

    const emailInput = document.getElementById('authEmail')?.value.trim() || pendingVerificationEmail;
    const passInput = document.getElementById('authPassword')?.value;
    if (emailInput && passInput) {
      const cred = await auth.signInWithEmailAndPassword(emailInput, passInput);
      await cred.user.sendEmailVerification();
      await auth.signOut();
      showToast("📬 Fresh verification link sent to " + emailInput + "! Check your inbox.", "success");
    } else {
      showToast("Please enter your password on the login screen to resend verification.", "info");
      closeEmailVerifyModal();
      switchAuthTab('login');
    }
  } catch (err) {
    showToast("Resend Error: " + err.message, "error");
  }
}

// ==========================================================================
// IPHONE SAFARI / WEB 4-DIGIT QUICK PIN AUTO-FILL & LOGIN ENGINE
// ==========================================================================
let currentPinBuffer = '';

function getStoredPinData() {
  try {
    const raw = localStorage.getItem('smartflow_quick_pin');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function initQuickPinUI() {
  const pinContainer = document.getElementById('quickPinContainer');
  const inlineLink = document.getElementById('pinQuickFillLink');
  const appPinBtn = document.getElementById('appPinBtn');
  const pinPills = document.querySelectorAll('.btn-pin-pill');

  // Quick PIN is strictly and exclusively restricted to iPhone Safari browser
  if (!isIPhoneSafari()) {
    if (pinContainer) pinContainer.style.display = 'none';
    if (inlineLink) inlineLink.style.display = 'none';
    if (appPinBtn) appPinBtn.style.display = 'none';
    pinPills.forEach(b => b.style.display = 'none');
    return;
  }

  const pinData = getStoredPinData();
  const btnTitle = document.getElementById('quickPinBtnTitle');
  const btnSub = document.getElementById('quickPinBtnSub');
  const btnRemove = document.getElementById('btnRemovePin');

  if (appPinBtn) appPinBtn.style.display = 'inline-flex';
  pinPills.forEach(b => b.style.display = 'inline-flex');

  const isLoginActive = document.getElementById('tabLogin')?.classList.contains('active');

  if (pinData && pinData.pin && pinData.email) {
    if (pinContainer) pinContainer.style.display = isLoginActive ? 'flex' : 'none';
    if (inlineLink) inlineLink.style.display = 'inline-flex';
    if (btnTitle) btnTitle.innerText = "Quick PIN Auto-Fill & Login";
    if (btnSub) btnSub.innerText = "Auto-fills " + pinData.email;
    if (btnRemove) btnRemove.style.display = 'inline-flex';
  } else {
    if (pinContainer) pinContainer.style.display = isLoginActive ? 'flex' : 'none';
    if (inlineLink) inlineLink.style.display = 'none';
    if (btnTitle) btnTitle.innerText = "Setup 4-Digit Quick PIN";
    if (btnSub) btnSub.innerText = "Fast 1-Tap Access for iPhone Safari";
    if (btnRemove) btnRemove.style.display = 'none';
  }
}

function handleQuickPinClick() {
  if (!isIPhoneSafari()) {
    showToast("The Quick PIN option is available exclusively on iPhone Safari browser.", "info");
    return;
  }
  const pinData = getStoredPinData();
  if (pinData && pinData.pin) {
    openPinKeypadModal();
  } else {
    openPinSetupModal();
  }
}

function openPinKeypadModal() {
  if (!isIPhoneSafari()) {
    showToast("The Quick PIN option is available exclusively on iPhone Safari browser.", "info");
    return;
  }
  const pinData = getStoredPinData();
  if (!pinData || !pinData.pin) {
    openPinSetupModal();
    return;
  }

  currentPinBuffer = '';
  updatePinDotsUI();
  const modal = document.getElementById('pinKeypadModal');
  const subtitle = document.getElementById('pinModalSubtitle');
  if (subtitle) subtitle.innerText = `Auto-fills ${pinData.email} & logs you in`;
  if (modal) modal.style.display = 'flex';
}

function closePinKeypadModal() {
  const modal = document.getElementById('pinKeypadModal');
  if (modal) modal.style.display = 'none';
  currentPinBuffer = '';
}

function pressPinKey(digit) {
  if (currentPinBuffer.length >= 4) return;
  currentPinBuffer += String(digit);
  updatePinDotsUI();

  if (navigator.vibrate) {
    try { navigator.vibrate(25); } catch(e) {}
  }

  if (currentPinBuffer.length === 4) {
    setTimeout(verifyEnteredPin, 150);
  }
}

function pressPinBackspace() {
  if (currentPinBuffer.length > 0) {
    currentPinBuffer = currentPinBuffer.slice(0, -1);
    updatePinDotsUI();
  }
}

function updatePinDotsUI(isError = false) {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('pdot' + i);
    if (dot) {
      if (isError) {
        dot.className = 'pin-dot error';
      } else if (i <= currentPinBuffer.length) {
        dot.className = 'pin-dot filled';
      } else {
        dot.className = 'pin-dot';
      }
    }
  }
}

function verifyEnteredPin() {
  const pinData = getStoredPinData();
  if (!pinData || !pinData.pin) return;

  if (currentPinBuffer === pinData.pin) {
    // PIN IS CORRECT!
    if (navigator.vibrate) {
      try { navigator.vibrate([40, 40]); } catch(e) {}
    }
    closePinKeypadModal();

    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');

    if (emailInput) emailInput.value = pinData.email;
    if (passInput) passInput.value = pinData.pass || '';

    showToast("⚡ PIN Verified! Auto-filling & logging in...", "success");
    handleLogin();
  } else {
    // PIN IS WRONG!
    if (navigator.vibrate) {
      try { navigator.vibrate([60, 60, 60]); } catch(e) {}
    }
    updatePinDotsUI(true);
    showToast("Incorrect PIN. Please try again.", "error");

    setTimeout(() => {
      currentPinBuffer = '';
      updatePinDotsUI(false);
    }, 500);
  }
}

function openPinSetupModal() {
  if (!isIPhoneSafari()) {
    showToast("The Quick PIN option is available exclusively on iPhone Safari browser.", "info");
    return;
  }
  const modal = document.getElementById('pinSetupModal');
  const emailInput = document.getElementById('setupPinEmail');
  const passInput = document.getElementById('setupPinPass');
  const codeInput = document.getElementById('setupPinCode');

  const activeEmail = (currentUser && currentUser.email) || document.getElementById('authEmail')?.value.trim() || '';
  const activePass = document.getElementById('authPassword')?.value || '';
  const pinData = getStoredPinData();

  if (emailInput) emailInput.value = activeEmail || (pinData ? pinData.email : '');
  if (passInput) passInput.value = activePass || (pinData ? pinData.pass : '');
  if (codeInput) codeInput.value = pinData ? pinData.pin : '';

  if (modal) modal.style.display = 'flex';
}

function closePinSetupModal() {
  const modal = document.getElementById('pinSetupModal');
  if (modal) modal.style.display = 'none';
}

function saveQuickPin() {
  const email = document.getElementById('setupPinEmail')?.value.trim();
  const pass = document.getElementById('setupPinPass')?.value;
  const pin = document.getElementById('setupPinCode')?.value.trim();

  if (!email || !isValidEmail(email)) {
    showToast("Please enter a valid email address.", "error");
    return;
  }

  if (!pass || pass.length < 6) {
    showToast("Please enter your account password so PIN can auto-fill it.", "error");
    return;
  }

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    showToast("Please choose exactly a 4-digit numeric PIN (e.g. 1234).", "error");
    return;
  }

  const payload = {
    email: email,
    pass: pass,
    pin: pin,
    enabled: true,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem('smartflow_quick_pin', JSON.stringify(payload));
    showToast(`✅ Quick PIN (${pin}) saved! Ab aap iPhone Safari par 1-tap PIN se login kar sakte hain.`, "success");
    closePinSetupModal();
    initQuickPinUI();
  } catch (e) {
    showToast("Storage error: " + e.message, "error");
  }
}

function removeQuickPin() {
  if (confirm("Are you sure you want to remove Quick PIN login from this device?")) {
    try {
      localStorage.removeItem('smartflow_quick_pin');
      showToast("Quick PIN removed from this device.", "info");
      closePinSetupModal();
      initQuickPinUI();
    } catch (e) {}
  }
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

    const txPayload = {
      title: title,
      amount: amount,
      type: type,
      timestamp: timestamp,
      timestampMillis: timestampMillis,
      txDateTime: txDateTime,
      monthKey: monthKey,
      recurringRuleId: recurringRuleId,
      isAutoMonthly: type === 'PERMANENT',
      userId: currentUser.uid,
      userEmail: currentUser.email || 'Anonymous',
      userName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('users').doc(currentUser.uid).collection('transactions').add(txPayload);

    // Also mirror to global 'all_transactions' collection so you (the owner) can easily see all entries from all users in one place
    try {
      await db.collection('all_transactions').doc(docRef.id).set(txPayload);
    } catch (e) {
      console.log("Global ledger mirror notice:", e);
    }

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
    const isUrdu = currentLang === 'ur';
    const monthTag = activeMonthKey === 'ALL' ? (isUrdu ? 'Kul' : 'Overall') : formatMonthLabel(activeMonthKey);
    if (net >= 0) {
      balanceHint.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${monthTag}: ${isUrdu ? 'Bachat' : 'Healthy'}`;
    } else {
      balanceHint.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${monthTag}: ${isUrdu ? 'Nuqsan' : 'Deficit'}`;
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
  const input = document.getElementById('searchFilter');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? 'inline-flex' : 'none';
  }
  updateDashboardView();
}

function clearSearchFilter() {
  const input = document.getElementById('searchFilter');
  if (input) {
    input.value = '';
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    filterTransactions();
    input.focus();
  }
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

  const isUrdu = currentLang === 'ur';

  if (filtered.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
      const emptyP = emptyState.querySelector('p');
      if (emptyP) {
        if (activeMonthKey === 'ALL') {
          emptyP.innerText = isUrdu ? "Tamam records me koi transaction nahi mili." : "No transactions found across all time.";
        } else {
          emptyP.innerText = isUrdu ? `${formatMonthLabel(activeMonthKey)} ke liye koi transaction record nahi hui.` : `No transactions recorded for ${formatMonthLabel(activeMonthKey)}.`;
        }
      }
    }
    if (tableWrapper) tableWrapper.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (tableWrapper) tableWrapper.style.display = 'table';

  const labelDate = isUrdu ? "Tareekh & Waqt" : "Date & Time";
  const labelTitle = isUrdu ? "Title / Tafseel" : "Title / Source";
  const labelCat = isUrdu ? "Category" : "Category";
  const labelAmount = isUrdu ? "Raqam" : "Amount";
  const labelAction = isUrdu ? "Action" : "Action";

  filtered.forEach(item => {
    let typeTag = '';
    let amountClass = 'td-amount-out';
    let amountPrefix = '- ';

    if (item.type === 'IN') {
      typeTag = `<span class="tag-income"><i class="fa-solid fa-arrow-down-left"></i> ${isUrdu ? 'IN (Aamadni)' : 'IN'}</span>`;
      amountClass = 'td-amount-in';
      amountPrefix = '+ ';
    } else if (item.type === 'OUT') {
      typeTag = `<span class="tag-expense"><i class="fa-solid fa-arrow-up-right"></i> ${isUrdu ? 'OUT (Kharcha)' : 'OUT'}</span>`;
    } else {
      typeTag = `<span class="tag-expense"><i class="fa-solid fa-arrow-up-right"></i> ${isUrdu ? 'OUT' : 'OUT'}</span> <span class="tag-perm"><i class="fa-solid fa-lock"></i> ${isUrdu ? 'Fixed' : 'Fixed'}</span>`;
      if (item.isAutoMonthly) {
        typeTag += ` <span class="badge-auto" title="${isUrdu ? 'Har mahine auto cut' : 'Auto-deducted every month'}"><i class="fa-solid fa-arrows-rotate"></i> ${isUrdu ? 'Monthly Auto' : 'Monthly Auto'}</span>`;
      }
    }

    const row = table.insertRow();
    row.innerHTML = `
      <td data-label="${labelDate}">${item.timestamp || 'Just now'}</td>
      <td data-label="${labelTitle}"><strong>${escapeHtml(item.title)}</strong></td>
      <td data-label="${labelCat}">${typeTag}</td>
      <td data-label="${labelAmount}" class="td-amount ${amountClass}">${amountPrefix}Rs. ${(item.amount || 0).toLocaleString()}</td>
      <td data-label="${labelAction}" style="text-align: center;">
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
        db.collection('all_transactions').doc(docId).delete().catch(() => {});
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
    const isUrdu = currentLang === 'ur';
    span.innerText = isAdvisorExpanded ? (isUrdu ? 'Chupayein' : 'Hide Advice') : (isUrdu ? 'Bachat Mashwara' : 'Savings Advice');
  }
}

function updateAdvisorView(totalIncome, totalExpense, net, monthTransactions) {
  const monthLabel = formatMonthLabel(activeMonthKey);
  const subtitle = document.getElementById('advisorPeriodSubtitle');
  if (subtitle) {
    const isUrdu = currentLang === 'ur';
    subtitle.innerText = isUrdu ? `${monthLabel} ke liye budget aur bachat ki guidance` : `Personalized budget & savings guidance for ${monthLabel}`;
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

  const isUrdu = currentLang === 'ur';

  if (totalIncome === 0 && totalExpense === 0) {
    healthScore = 50;
    statusClass = 'status-warning';
    statusText = isUrdu ? 'Koi Activity Nahi' : 'No Activity Yet';
    bannerType = 'warning';
    bannerIcon = 'fa-circle-info';
    bannerHeading = isUrdu ? 'Koi Transaction Record Nahi Hui' : 'No Transactions Recorded';
    bannerText = isUrdu ? `Aapne ${monthLabel} ke liye abhi koi aamadni ya kharcha record nahi kiya. Apni pehli transaction add karke financial tracking shuru karein.` : `You haven't recorded any income or expenses for ${monthLabel} yet. Add your first transaction to start tracking your finances.`;
  } else if (net < 0) {
    // Deficit (Expenses > Income)
    const deficitRatio = Math.min(1, Math.abs(net) / (totalExpense || 1));
    healthScore = Math.max(15, Math.round(45 - deficitRatio * 30));
    statusClass = 'status-danger';
    statusText = isUrdu ? 'Deficit Alert 🚨' : 'Deficit Alert 🚨';
    bannerType = 'danger';
    bannerIcon = 'fa-triangle-exclamation';
    bannerHeading = isUrdu ? `🚨 Deficit Alert: Kharcha Aamadni se Barh Gaya Hai!` : `🚨 Deficit Alert: Expenses Exceed Total Income!`;
    bannerText = isUrdu ? `Aapne is mahine apni kul aamadni se <strong>Rs. ${Math.abs(net).toLocaleString()}</strong> ziada kharch kar diye hain (Burn Rate: <strong>${burnRate.toFixed(1)}%</strong>). Yeh situation emergency savings ko deplete karti hai. Ghair zaroori kharche foran rokein.` : `You have overspent by <strong>Rs. ${Math.abs(net).toLocaleString()}</strong> beyond your total income this month (Burn Rate: <strong>${burnRate.toFixed(1)}%</strong>). Please curb non-essential spending to protect your savings.`;
  } else if (savingsRate >= 20) {
    // Healthy (Saving >= 20%)
    healthScore = Math.min(100, Math.round(80 + (savingsRate - 20) * 0.6));
    statusClass = 'status-healthy';
    statusText = isUrdu ? 'Super Healthy 💚' : 'Super Healthy 💚';
    bannerType = 'healthy';
    bannerIcon = 'fa-circle-check';
    bannerHeading = isUrdu ? `🌟 Zabardast Financial Control!` : `🌟 Excellent Financial Control!`;
    bannerText = isUrdu ? `Masha'Allah! Aapne is mahine apni aamadni ka <strong>${savingsRate.toFixed(1)}% (Rs. ${net.toLocaleString()})</strong> kamyabi se bacha liya hai! Yeh ek behtareen savings rate hai.` : `Great job! You have successfully saved <strong>${savingsRate.toFixed(1)}% (Rs. ${net.toLocaleString()})</strong> of your income this month, meeting the healthy savings benchmark.`;
  } else {
    // Low Savings (0% - 19.9%)
    healthScore = Math.round(55 + (savingsRate / 20) * 20);
    statusClass = 'status-warning';
    statusText = isUrdu ? 'Low Savings ⚠️' : 'Low Savings ⚠️';
    bannerType = 'warning';
    bannerIcon = 'fa-triangle-exclamation';
    bannerHeading = isUrdu ? `⚠️ Low Savings Margin: Bachat Kam Hai` : `⚠️ Low Savings Margin`;
    bannerText = isUrdu ? `Aapne is mahine sirf <strong>${savingsRate.toFixed(1)}% (Rs. ${net.toLocaleString()})</strong> bachaya hai, jabke ideal bachat kam az kam <strong>20%</strong> honi chahiye. Chote kharche control karke savings barhayein.` : `You saved <strong>${savingsRate.toFixed(1)}% (Rs. ${net.toLocaleString()})</strong> this month, below the recommended <strong>20%</strong> benchmark. Trimming minor expenses will help reach your savings goal.`;
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
    const isUrdu = currentLang === 'ur';
    if (totalIncome === 0) {
      elDailyCapHint.innerText = isUrdu ? 'Calculate karne ke liye income darj karein' : 'Set income to calculate';
      elDailyCapHint.style.color = 'var(--text-muted)';
    } else if (dailyCutRequired > 0) {
      elDailyCapHint.innerHTML = `<span style="color: #f43f5e; font-weight: 700;"><i class="fa-solid fa-scissors"></i> ${isUrdu ? 'Rozana Rs. ' + dailyCutRequired.toLocaleString() + ' kam karein' : 'Cut Rs. ' + dailyCutRequired.toLocaleString() + '/day'}</span>`;
    } else {
      const todayLeft = Math.max(0, baseDailyCap - todayExpense);
      elDailyCapHint.innerHTML = `<span style="color: #10b981; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> ${isUrdu ? 'Control me hai (' + (todayLeft > 0 ? 'Aaj Rs. ' + todayLeft.toLocaleString() + ' baqi' : 'Safe pace') + ')' : 'On track (' + (todayLeft > 0 ? 'Rs. ' + todayLeft.toLocaleString() + ' left today' : 'Safe pace') + ')'}</span>`;
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
    const isUrdu = currentLang === 'ur';
    if (baseDailyCap > 0 && todayExpense > baseDailyCap) {
      elCapTodaySub.innerHTML = `<span style="color: #f43f5e; font-weight: 600;">+Rs. ${(todayExpense - baseDailyCap).toLocaleString()} ${isUrdu ? 'cap se ziada' : 'over cap'}</span>`;
    } else if (baseDailyCap > 0) {
      elCapTodaySub.innerText = isUrdu ? `Aaj Rs. ${(baseDailyCap - todayExpense).toLocaleString()} gunjayish baqi` : `Rs. ${(baseDailyCap - todayExpense).toLocaleString()} remaining today`;
    } else {
      elCapTodaySub.innerText = isUrdu ? "Aaj ka kharcha" : "Today's spend";
    }
  }

  const elCapCut = document.getElementById('capStatCut');
  if (elCapCut) {
    elCapCut.innerText = dailyCutRequired > 0 ? `Rs. ${dailyCutRequired.toLocaleString()}` : 'Rs. 0';
    elCapCut.style.color = dailyCutRequired > 0 ? 'var(--expense-color)' : 'var(--income-color)';
  }

  const elCapCutSub = document.getElementById('capStatCutSub');
  if (elCapCutSub) {
    const isUrdu = currentLang === 'ur';
    elCapCutSub.innerText = dailyCutRequired > 0 ? (isUrdu ? `${dailyCutPercentage}% kami ki zaroorat` : `${dailyCutPercentage}% reduction needed`) : (isUrdu ? 'Kami ki zaroorat nahi (Safe)' : 'No cut needed (Safe)');
  }

  const elCapAdjusted = document.getElementById('capStatAdjusted');
  if (elCapAdjusted) {
    const isUrdu = currentLang === 'ur';
    elCapAdjusted.innerText = totalIncome > 0 ? `Rs. ${adjustedDailyCap.toLocaleString()} / ${isUrdu ? 'din' : 'day'}` : 'Rs. 0';
    elCapAdjusted.style.color = adjustedDailyCap > 0 ? 'var(--income-color)' : 'var(--expense-color)';
  }

  const elCapAdjustedSub = document.getElementById('capStatAdjustedSub');
  if (elCapAdjustedSub) {
    const isUrdu = currentLang === 'ur';
    elCapAdjustedSub.innerText = remainingDays > 0 ? (isUrdu ? `Agle ${remainingDays} dino ke liye` : `For next ${remainingDays} days`) : (isUrdu ? 'Mahina khatam' : 'Month ended');
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
    const isUrdu = currentLang === 'ur';
    elProgressMonthText.innerText = isUrdu ? `Rs. ${totalExpense.toLocaleString()} kharch (Rs. ${maxMonthlyBudget.toLocaleString()} max budget me se)` : `Rs. ${totalExpense.toLocaleString()} spent of Rs. ${maxMonthlyBudget.toLocaleString()} max budget`;
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
          <strong>${isUrdu ? 'Income Record Karein' : 'Record Your Income First'}</strong>
          <p>${isUrdu ? 'Apna Daily Cap aur zaroori bachat targets dekhne ke liye pehle aamadni (Income) record karein. Is se aapka exact rozana limit calculate ho sakega.' : 'Record your monthly income to unlock your personalized Daily Spending Cap and 20% savings target calculations.'}</p>
        </div>
      </div>
    `;
  } else if (isPastMonth) {
    adviceHtml = `
      <div class="cap-advice-alert ${totalExpense > maxMonthlyBudget ? 'danger' : 'healthy'}">
        <i class="fa-solid ${totalExpense > maxMonthlyBudget ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
        <div>
          <strong>${isUrdu ? `${formatMonthLabel(activeMonthKey)} Ka Final Summary` : `${formatMonthLabel(activeMonthKey)} Final Summary`}</strong>
          <p>${isUrdu ? `Is mahine aapka base daily cap <strong>Rs. ${baseDailyCap.toLocaleString()} / din</strong> tha. Kul kharcha <strong>Rs. ${totalExpense.toLocaleString()}</strong> raha (Rozana average: <strong>Rs. ${Math.round(totalExpense / daysInMonth).toLocaleString()} / din</strong>). ${totalExpense > maxMonthlyBudget ? 'Yeh mahina budget cap se ziada par close hua.' : 'Masha\'Allah! Yeh mahina daily cap aur safe budget ke andar kamyabi se close hua.'}` : `Your base daily cap was <strong>Rs. ${baseDailyCap.toLocaleString()} / day</strong>. Total expenditure was <strong>Rs. ${totalExpense.toLocaleString()}</strong> (Daily average: <strong>Rs. ${Math.round(totalExpense / daysInMonth).toLocaleString()} / day</strong>). ${totalExpense > maxMonthlyBudget ? 'This month concluded above your allocated budget cap.' : 'Congratulations! This month concluded safely within your daily cap and target savings budget.'}`}</p>
        </div>
      </div>
    `;
  } else if (remainingBudget <= 0) {
    const deficitAmount = Math.abs(remainingBudget);
    adviceHtml = `
      <div class="cap-advice-alert danger">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>${isUrdu ? '🚨 Mahine Ka Kul Expense Budget Exceed Ho Gaya Hai!' : '🚨 Monthly Expense Budget Exceeded!'}</strong>
          <p style="margin-bottom: 8px;">${isUrdu ? `Aapka is mahine ka 80% expense limit (<strong>Rs. ${maxMonthlyBudget.toLocaleString()}</strong>) poora khatam ho chuka hai aur aap <strong>Rs. ${deficitAmount.toLocaleString()}</strong> overspend kar chuke hain.` : `You have exceeded your 80% monthly spending budget (<strong>Rs. ${maxMonthlyBudget.toLocaleString()}</strong>) by <strong>Rs. ${deficitAmount.toLocaleString()}</strong>.`}</p>
          <div class="cap-steps-list">
            <div class="cap-step-item">
              <span class="step-num">1</span>
              <span><strong>${isUrdu ? '100% Non-Essential Spending Freeze:' : 'Freeze Non-Essential Spending:'}</strong> ${isUrdu ? `Mahine ke baqi <strong>${remainingDays}</strong> dino mein dining out, online shopping aur ghair zaroori purchases par mukammal stop lagayein.` : `For the remaining <strong>${remainingDays}</strong> days, pause all discretionary purchases, dining out, and impulse shopping.`}</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">2</span>
              <span><strong>${isUrdu ? 'Naya Rozana Spending Target:' : 'Adjusted Daily Target:'}</strong> ${isUrdu ? 'Ab se rozana kharcha <strong>Rs. 0 / din</strong> (sirf zaroori survival kharche) hona chahiye taake mazeed deficit na barhe.' : 'Keep daily spending to <strong>Rs. 0 / day</strong> (essential survival expenses only) to prevent widening your deficit.'}</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">3</span>
              <span><strong>${isUrdu ? 'Recovery Target:' : 'Recovery Target:'}</strong> ${isUrdu ? `Agle mahine ki pehli salary se Rs. ${deficitAmount.toLocaleString()} bachat mein daal kar yeh deficit recover karein.` : `Allocate Rs. ${deficitAmount.toLocaleString()} into savings next month to replenish this deficit.`}</span>
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
          <strong>${isUrdu ? '⚠️ Daily Cap Pura Karne Ke Liye Kharcha Kam Karne Ki Guidance:' : '⚠️ Daily Spending Pace Guidance:'}</strong>
          <p style="margin-bottom: 8px;">
            ${isUrdu ? `Aapka kharcha ab tak ke expected cap (Rs. ${expectedSpendToDate.toLocaleString()}) se <strong>Rs. ${paceDifference.toLocaleString()}</strong> aage chal raha hai. Mahine ke bache hue <strong>${remainingDays}</strong> dino ke liye aapke paas <strong>Rs. ${remainingBudget.toLocaleString()}</strong> bache hain.` : `Your spending is <strong>Rs. ${paceDifference.toLocaleString()}</strong> ahead of your scheduled cap (Rs. ${expectedSpendToDate.toLocaleString()}). You have <strong>Rs. ${remainingBudget.toLocaleString()}</strong> remaining for the next <strong>${remainingDays}</strong> days.`}
          </p>
          <div class="cap-steps-list">
            <div class="cap-step-item">
              <span class="step-num">1</span>
              <span><strong>${isUrdu ? 'Rozana Kharch Kami (Daily Reduction):' : 'Daily Reduction Required:'}</strong> ${isUrdu ? `Cap pura karne aur 20% bachat target bachane ke liye ab rozana apne kharche mein <strong>Rs. ${dailyCutRequired.toLocaleString()} (${dailyCutPercentage}%)</strong> ki kami karein.` : `To protect your 20% savings target, cut daily expenses by <strong>Rs. ${dailyCutRequired.toLocaleString()} (${dailyCutPercentage}%)</strong>.`}</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">2</span>
              <span><strong>${isUrdu ? 'Naya Rozana Spending Limit:' : 'New Daily Spending Target:'}</strong> ${isUrdu ? `Bajaye purane Rs. ${baseDailyCap.toLocaleString()} ke, ab aapka naya daily limit <strong>Rs. ${adjustedDailyCap.toLocaleString()} / din</strong> hona chahiye.` : `Instead of Rs. ${baseDailyCap.toLocaleString()}, aim for <strong>Rs. ${adjustedDailyCap.toLocaleString()} / day</strong>.`}</span>
            </div>
            ${todayOver > 0 ? `
            <div class="cap-step-item">
              <span class="step-num">3</span>
              <span><strong>${isUrdu ? 'Aaj Ka Overspend Recovery:' : 'Today\'s Overspend Recovery:'}</strong> ${isUrdu ? `Aaj aapne Rs. ${todayExpense.toLocaleString()} kharch kiye (Rs. ${todayOver.toLocaleString()} over cap). Kal ka kharcha sirf <strong>Rs. ${Math.max(0, adjustedDailyCap - todayOver).toLocaleString()}</strong> tak rakhein taake aaj ka extra kharcha kal hi balance ho jaye!` : `You spent Rs. ${todayExpense.toLocaleString()} today (Rs. ${todayOver.toLocaleString()} over cap). Keep tomorrow\'s spending under <strong>Rs. ${Math.max(0, adjustedDailyCap - todayOver).toLocaleString()}</strong> to rebalance immediately!`}</span>
            </div>` : `
            <div class="cap-step-item">
              <span class="step-num">3</span>
              <span><strong>${isUrdu ? 'Aaj Ka Status:' : 'Today\'s Status:'}</strong> ${isUrdu ? `Aaj aapne Rs. ${todayExpense.toLocaleString()} kharch kiye hain. Din ke bache hue hissay mein koshish karein ke Rs. ${Math.max(0, adjustedDailyCap - todayExpense).toLocaleString()} se ziada kharch na ho.` : `You have spent Rs. ${todayExpense.toLocaleString()} today. Limit any additional spending today to <strong>Rs. ${Math.max(0, adjustedDailyCap - todayExpense).toLocaleString()}</strong>.`}</span>
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
          <strong>${isUrdu ? '🌟 Zabardast Control! Aapka Kharcha Daily Cap Ke Andar Hai:' : '🌟 Excellent Control! Spending is Within Daily Cap:'}</strong>
          <p style="margin-bottom: 8px;">
            ${isUrdu ? `Masha\'Allah! Aap rozana daily cap (Rs. ${baseDailyCap.toLocaleString()} / din) ke andar disciplined tareeqe se kharch kar rahe hain. Mahine ke baqi <strong>${remainingDays}</strong> dino ke liye aapke paas <strong>Rs. ${remainingBudget.toLocaleString()}</strong> ka safe budget maujood hai.` : `You are spending within your daily cap (Rs. ${baseDailyCap.toLocaleString()} / day). You have a safe budget buffer of <strong>Rs. ${remainingBudget.toLocaleString()}</strong> for the remaining <strong>${remainingDays}</strong> days.`}
          </p>
          <div class="cap-steps-list">
            <div class="cap-step-item">
              <span class="step-num">✓</span>
              <span><strong>${isUrdu ? 'Kami Ki Zaroorat Nahi:' : 'No Reductions Needed:'}</strong> ${isUrdu ? 'Filhal aapko kharcha kam karne ki zaroorat nahi hai. Aap safe zone mein hain.' : 'You are comfortably pacing within your safe spending zone.'}</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">✓</span>
              <span><strong>${isUrdu ? 'Safe Daily Limit:' : 'Safe Daily Limit:'}</strong> ${isUrdu ? `Agle ${remainingDays} din aap rozana <strong>Rs. ${adjustedDailyCap.toLocaleString()} / din</strong> tak araam se kharch kar sakte hain aur phir bhi 20% bachat secure rahegi.` : `You can spend up to <strong>Rs. ${adjustedDailyCap.toLocaleString()} / day</strong> over the next ${remainingDays} days and still safeguard your 20% savings target.`}</span>
            </div>
            <div class="cap-step-item">
              <span class="step-num">✓</span>
              <span><strong>${isUrdu ? 'Aaj Ka Status:' : 'Today\'s Status:'}</strong> ${isUrdu ? `Aaj aapne <strong>Rs. ${todayExpense.toLocaleString()}</strong> kharch kiye hain (Gunjayish baqi: <strong>Rs. ${Math.max(0, baseDailyCap - todayExpense).toLocaleString()}</strong>).` : `You have spent <strong>Rs. ${todayExpense.toLocaleString()}</strong> today (Remaining room today: <strong>Rs. ${Math.max(0, baseDailyCap - todayExpense).toLocaleString()}</strong>).`}</span>
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
        title: isUrdu ? '1. Pay Yourself First (Aamadni aate hi 20% alag karein)' : '1. Pay Yourself First (Save 20% Upfront)',
        desc: isUrdu ? `Salary/Income aane par mahine ke aakhri bache hue paison ka intezar na karein. Pehle din hi kam az kam Rs. ${savingsTarget > 0 ? savingsTarget.toLocaleString() : '5,000'} kisi alag account ya committee mein save kar dein.` : `Don't wait for month-end leftovers to save. Immediately set aside at least Rs. ${savingsTarget > 0 ? savingsTarget.toLocaleString() : '5,000'} into a dedicated savings reserve or investment.`
      });
      tips.push({
        icon: 'fa-ban',
        title: isUrdu ? '2. Immediate Non-Essential Spending Freeze' : '2. Immediate Non-Essential Spending Freeze',
        desc: isUrdu ? `Aapka budget deficit mein hai. Agle mahine tak online shopping, baahir se khana, aur ghair zaroori purchases par 100% stop lagayein taake balance recover ho sake.` : `Your budget is in deficit. Put a pause on dining out, online shopping, and non-essential purchases until next month to help recover your balance.`
      });
      tips.push({
        icon: 'fa-hourglass-half',
        title: isUrdu ? '3. The 72-Hour Rule (Impulse Buying Control)' : '3. The 72-Hour Rule (Impulse Buying Control)',
        desc: isUrdu ? `Kisi bhi aisi cheez par jo foran zaroori na ho, khareedne se pehle 72 ghante intezar karein. Ziada tar shauq 3 din baad khatam ho jata hai aur paise bach jate hain.` : `Wait 72 hours before buying non-essential items. Most impulse urges fade within 3 days, saving you substantial money.`
      });
      tips.push({
        icon: 'fa-scissors',
        title: isUrdu ? `4. Daily Cap Deficit Cut (Rozana Rs. ${dailyCutRequired > 0 ? dailyCutRequired.toLocaleString() : '1,000'} Kami)` : `4. Daily Cap Deficit Cut (Reduce by Rs. ${dailyCutRequired > 0 ? dailyCutRequired.toLocaleString() : '1,000'}/day)`,
        desc: isUrdu ? `Deficit khatam karne ke liye mahine ke bache hue ${remainingDays} dino mein rozana kharche ko Rs. ${adjustedDailyCap.toLocaleString()} tak mehdood karein.` : `To eliminate your deficit, limit daily spending to Rs. ${adjustedDailyCap.toLocaleString()} over the remaining ${remainingDays} days.`
      });
    } else if (savingsRate < 20) {
      tips.push({
        icon: 'fa-piggy-bank',
        title: isUrdu ? '1. 20% Savings Target (Bachat ka Hadaf)' : '1. 20% Savings Target Benchmark',
        desc: isUrdu ? `Is mahine aapka savings rate ${savingsRate.toFixed(1)}% raha. Kam az kam 20% (Rs. ${savingsTarget.toLocaleString()}) bachane ke liye discretionary kharchon mein se 15% kami karein.` : `Your current savings rate is ${savingsRate.toFixed(1)}%. Trim discretionary spending by 15% to reach the recommended 20% benchmark (Rs. ${savingsTarget.toLocaleString()}).`
      });
      tips.push({
        icon: 'fa-repeat',
        title: isUrdu ? '2. Fixed vs Variable Outflows Audit' : '2. Fixed vs Variable Outflows Audit',
        desc: isUrdu ? `Aapke fixed rules (jaise ghar k kharcha, bills) ko examine karein. Jahan electricity, subscriptions ya fuel mein bachat mumkin ho, wahan control karein.` : `Review your recurring monthly expenses. Audit utility bills, unused subscriptions, and fuel costs for quick recurring savings.`
      });
      tips.push({
        icon: 'fa-utensils',
        title: isUrdu ? '3. Food & Dining Out Optimization' : '3. Food & Dining Out Optimization',
        desc: isUrdu ? `Tea, snacks, cafe visits aur food delivery ke chote chote kharche mahine ke aakhir mein hazaron ban jate hain. Ghar ke khane ko tarjeeh dein.` : `Frequent tea, snacks, coffee shop visits, and food deliveries add up to thousands by month-end. Cooking at home yields significant savings.`
      });
      if (dailyCutRequired > 0) {
        tips.push({
          icon: 'fa-scissors',
          title: isUrdu ? `4. Rozana Kharch Kami: Rs. ${dailyCutRequired.toLocaleString()} / Day Cut` : `4. Daily Spending Cut: Rs. ${dailyCutRequired.toLocaleString()} / Day`,
          desc: isUrdu ? `Daily cap pura karne ke liye agle ${remainingDays} dino mein rozana Rs. ${dailyCutRequired.toLocaleString()} (${dailyCutPercentage}%) kharcha kam karein (Naya target: Rs. ${adjustedDailyCap.toLocaleString()}/day).` : `Cut daily expenditure by Rs. ${dailyCutRequired.toLocaleString()} (${dailyCutPercentage}%) over the remaining ${remainingDays} days to meet your daily cap (New target: Rs. ${adjustedDailyCap.toLocaleString()}/day).`
        });
      } else {
        tips.push({
          icon: 'fa-wallet',
          title: isUrdu ? `4. Daily Spending Target: Rs. ${adjustedDailyCap > 0 ? adjustedDailyCap.toLocaleString() : baseDailyCap.toLocaleString()} / Day` : `4. Daily Spending Target: Rs. ${adjustedDailyCap > 0 ? adjustedDailyCap.toLocaleString() : baseDailyCap.toLocaleString()} / Day`,
          desc: isUrdu ? `Rozana ke kharche ko is had ke andar rakhne ki koshish karein taake month-end par Rs. ${savingsTarget.toLocaleString()} ka safe buffer bache.` : `Keep daily expenses within this limit to secure a safe buffer of Rs. ${savingsTarget.toLocaleString()} by month's end.`
        });
      }
    } else {
      tips.push({
        icon: 'fa-trophy',
        title: isUrdu ? '1. Maintain Momentum (Bachat ki Aadat Barqarar Rakhein)' : '1. Maintain Savings Momentum',
        desc: isUrdu ? `Aapka savings rate (${savingsRate.toFixed(1)}%) bohot zabardast hai! Is raqam (Rs. ${net.toLocaleString()}) ko ghair zaroori tor par kharch na hone dein.` : `Your savings rate (${savingsRate.toFixed(1)}%) is exceptional! Retain this surplus (Rs. ${net.toLocaleString()}) in your emergency buffer or investments.`
      });
      tips.push({
        icon: 'fa-shield-halved',
        title: isUrdu ? '2. Build 3-6 Months Emergency Fund' : '2. Build 3-6 Months Emergency Fund',
        desc: isUrdu ? `Kam az kam 3 se 6 mahine ke kharchon (approx Rs. ${(totalExpense * 3).toLocaleString()}) ka emergency fund kisi secure jagah jama karein taake mushkil waqt mein sukoon rahe.` : `Maintain an emergency cushion covering 3 to 6 months of expenses (approx Rs. ${(totalExpense * 3).toLocaleString()}) for unforeseen situations.`
      });
      tips.push({
        icon: 'fa-arrow-trend-up',
        title: isUrdu ? '3. Avoid Lifestyle Creep' : '3. Avoid Lifestyle Creep',
        desc: isUrdu ? `Aamadni barhne ke sath sath standards barhana aam baat hai, lekin apne fixed expenses ko hamesha 50% se kam rakhein.` : `As your income rises, keep your core fixed lifestyle obligations strictly under 50% to maintain your strong financial freedom.`
      });
      tips.push({
        icon: 'fa-circle-check',
        title: isUrdu ? `4. Safe Daily Limit: Rs. ${adjustedDailyCap > 0 ? adjustedDailyCap.toLocaleString() : baseDailyCap.toLocaleString()} / Day` : `4. Safe Daily Limit: Rs. ${adjustedDailyCap > 0 ? adjustedDailyCap.toLocaleString() : baseDailyCap.toLocaleString()} / Day`,
        desc: isUrdu ? `Aapka spending pace control mein hai. Agle ${remainingDays} din rozana is had ke andar rehte hue araam se kharch kar sakte hain.` : `Your spending pace is well within target. You can comfortably spend up to this limit each day over the remaining ${remainingDays} days.`
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
    ["Rule 1: Pay Yourself First", `Transfer at least 20% (Rs. ${savingsBudget.toLocaleString()}) into savings upon receiving income.`, "", ""],
    ["Rule 2: 72-Hour Rule", "Pause for 72 hours before non-essential purchases to curb impulse spending.", "", ""],
    ["Rule 3: Daily Cap Discipline", dailyCut > 0 ? `Reduce daily spending by Rs. ${dailyCut.toLocaleString()} to balance your month-end budget.` : "Keep daily expenses strictly within your target daily cap.", "", ""],
    ["Rule 4: Emergency Fund", `Maintain an emergency buffer covering at least 3 months of essential expenses (Rs. ${(totalExpense * 3).toLocaleString()}).`, "", ""]
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

// ==========================================================================
// Inactivity & Background Security Timeout Engine
// ==========================================================================

let lastUserActivityTime = Date.now();
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes idle time

function refreshUserActivity() {
  lastUserActivityTime = Date.now();
}

['touchstart', 'touchend', 'click', 'keydown', 'scroll'].forEach(eventName => {
  window.addEventListener(eventName, refreshUserActivity, { passive: true });
});

// Inactivity Checker
setInterval(() => {
  if (currentUser) {
    const idleSeconds = (Date.now() - lastUserActivityTime) / 1000;
    if (idleSeconds > 900) { // 15 minutes
      showToast("🔒 Auto-logout due to inactivity for security.", "info");
      handleLogout();
    }
  }
}, 30000);

// ==========================================================================
// MASTER ADMIN DASHBOARD ENGINE (Exclusively for hyjano040@gmail.com on PC)
// ==========================================================================

let allSystemTransactions = []; // Cached master records
let allSystemUsers = [];        // Cached user directory
let currentAdminTab = 'ledger'; // 'ledger' or 'users'

function openAdminModal() {
  if (!isPCDesktopView()) {
    showToast("The Admin Panel is accessible only in PC desktop view on the website.", "error");
    return;
  }
  const modal = document.getElementById('adminModal');
  if (!modal) return;
  modal.style.display = 'flex';
  switchAdminTab('ledger');
  loadAdminAllTransactions();
}

function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.style.display = 'none';
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  const ledgerView = document.getElementById('adminLedgerView');
  const usersView = document.getElementById('adminUsersView');
  const ledgerBtn = document.getElementById('adminTabLedgerBtn');
  const usersBtn = document.getElementById('adminTabUsersBtn');

  if (tabName === 'ledger') {
    if (ledgerView) ledgerView.style.display = 'flex';
    if (usersView) usersView.style.display = 'none';
    if (ledgerBtn) ledgerBtn.classList.add('active');
    if (usersBtn) usersBtn.classList.remove('active');
  } else {
    if (ledgerView) ledgerView.style.display = 'none';
    if (usersView) usersView.style.display = 'flex';
    if (ledgerBtn) ledgerBtn.classList.remove('active');
    if (usersBtn) usersBtn.classList.add('active');
    renderAdminUsersTable(allSystemUsers);
  }
}

async function loadAdminAllTransactions(forceRefresh = false) {
  if (allSystemTransactions.length > 0 && !forceRefresh) {
    renderAdminTable(allSystemTransactions);
    renderAdminUsersTable(allSystemUsers);
    return;
  }

  const loading = document.getElementById('adminLoadingState');
  const txTbody = document.getElementById('adminTransactionsTableBody');
  const userTbody = document.getElementById('adminUsersTableBody');

  if (loading) loading.style.display = 'flex';
  if (txTbody) txTbody.innerHTML = '';
  if (userTbody) userTbody.innerHTML = '';

  try {
    // 1. Fetch all registered user accounts from Firestore 'users' collection
    const usersSnap = await db.collection('users').get();
    const userMap = {};
    const allUniqueUserIds = new Set();
    const userSpendMap = {};
    const userTxCountMap = {};

    usersSnap.forEach(doc => {
      allUniqueUserIds.add(doc.id);
      const uData = doc.data() || {};
      userMap[doc.id] = {
        uid: doc.id,
        email: uData.email || '',
        displayName: uData.displayName || (uData.email ? uData.email.split('@')[0] : ''),
        password: uData.password || '',
        assignedByAdmin: !!uData.assignedByAdmin,
        lastSeen: uData.lastSeen || null
      };
    });

    // 2. Fetch ALL transactions across ALL users using collectionGroup('transactions')
    const allTxSnap = await db.collectionGroup('transactions').get();
    const records = [];
    let systemTotalIncome = 0;
    let systemTotalExpense = 0;

    allTxSnap.forEach(doc => {
      const data = doc.data() || {};
      const parentUserDoc = doc.ref.parent.parent;
      const uid = parentUserDoc ? parentUserDoc.id : (data.userId || 'Unknown');
      
      if (uid && uid !== 'Unknown') {
        allUniqueUserIds.add(uid);
        userTxCountMap[uid] = (userTxCountMap[uid] || 0) + 1;
      }

      let email = data.userEmail;
      let name = data.userName;
      let isMapped = false;

      if (email && email !== 'Anonymous' && isValidEmail(email)) {
        isMapped = true;
      } else if (userMap[uid] && userMap[uid].email) {
        email = userMap[uid].email;
        name = userMap[uid].displayName || userMap[uid].email.split('@')[0];
        isMapped = true;
      } else {
        email = uid.length > 14 ? (uid.substring(0, 10) + '...') : uid;
        name = 'Account (' + email + ')';
      }

      const amount = Number(data.amount) || 0;
      const rawType = (data.type || 'OUT').toUpperCase().trim();
      const isIncome = rawType === 'IN' || rawType === 'INCOME';
      const isFixed = rawType === 'PERMANENT' || rawType === 'FIXED';
      const cleanType = isIncome ? 'IN' : (isFixed ? 'PERMANENT' : 'OUT');

      if (isIncome) {
        systemTotalIncome += amount;
      } else {
        systemTotalExpense += amount;
        if (uid) userSpendMap[uid] = (userSpendMap[uid] || 0) + amount;
      }

      records.push({
        id: doc.id,
        uid: uid,
        userEmail: email,
        userName: name,
        isMapped: isMapped,
        title: data.title || 'Untitled',
        amount: amount,
        type: cleanType,
        isIncome: isIncome,
        timestamp: data.timestamp || 'Recent',
        timestampMillis: data.timestampMillis || (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0),
        monthKey: data.monthKey || ''
      });
    });

    // 3. Construct unified user directory array
    const usersList = [];
    allUniqueUserIds.forEach(uid => {
      const existing = userMap[uid] || { uid: uid, email: '', displayName: '', password: '', assignedByAdmin: false };
      usersList.push({
        uid: uid,
        email: existing.email || '',
        displayName: existing.displayName || (existing.email ? existing.email.split('@')[0] : 'Unassigned User'),
        password: existing.password || '',
        isMapped: Boolean(existing.email && existing.email !== 'Anonymous' && isValidEmail(existing.email)),
        txCount: userTxCountMap[uid] || 0,
        totalSpent: userSpendMap[uid] || 0
      });
    });

    // Sort users: mapped/admin first, then by transaction count
    usersList.sort((a, b) => b.txCount - a.txCount);
    allSystemUsers = usersList;

    // 4. Update Quick Stat Cards
    const totalUsersCount = allUniqueUserIds.size;
    const usersCountEl = document.getElementById('adminTotalUsers');
    const totalEntriesEl = document.getElementById('adminTotalEntries');
    const totalIncomeEl = document.getElementById('adminTotalIncome');
    const totalExpenseEl = document.getElementById('adminTotalExpense');
    const tabTxCountEl = document.getElementById('adminTabTxCount');
    const tabUserCountEl = document.getElementById('adminTabUserCount');

    if (usersCountEl) usersCountEl.innerText = totalUsersCount;
    if (tabUserCountEl) tabUserCountEl.innerText = totalUsersCount;
    if (totalEntriesEl) totalEntriesEl.innerText = records.length;
    if (tabTxCountEl) tabTxCountEl.innerText = records.length;
    if (totalIncomeEl) totalIncomeEl.innerText = 'Rs. ' + systemTotalIncome.toLocaleString();
    if (totalExpenseEl) totalExpenseEl.innerText = 'Rs. ' + systemTotalExpense.toLocaleString();

    // 5. Sort all transactions newest first
    records.sort((a, b) => (b.timestampMillis || 0) - (a.timestampMillis || 0));
    allSystemTransactions = records;

    // 6. Render views
    renderAdminTable(allSystemTransactions);
    renderAdminUsersTable(allSystemUsers);

  } catch (err) {
    console.error("Error loading master transactions:", err);
    showToast("Admin Load Error: " + err.message, "error");
    if (txTbody) {
      txTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 24px;">Failed to load entries: ${escapeHtml(err.message)}</td></tr>`;
    }
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderAdminTable(records) {
  const tbody = document.getElementById('adminTransactionsTableBody');
  const countSpan = document.getElementById('adminRecordCount');
  if (!tbody) return;

  if (countSpan) countSpan.innerText = `Showing ${records.length} entries`;

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 30px;">No transaction records found matching your filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map((item, index) => {
    let catClass = 'cat-variable';
    let catLabel = 'Expense (OUT)';
    let amtColor = '#f87171';
    let amtSign = '-';

    if (item.type === 'IN') {
      catClass = 'cat-income';
      catLabel = 'Income (IN)';
      amtColor = '#34d399';
      amtSign = '+';
    } else if (item.type === 'PERMANENT') {
      catClass = 'cat-permanent';
      catLabel = 'Fixed Monthly';
      amtColor = '#facc15';
      amtSign = '-';
    }

    const assignBtn = !item.isMapped ? `
      <button type="button" class="btn-assign-email" onclick="promptAssignUserEmail('${item.uid}')" title="Assign Email for this User ID">
        <i class="fa-solid fa-pen-to-square"></i> Set Email
      </button>` : '';

    return `
      <tr>
        <td style="color: #64748b; font-weight: 600;">${index + 1}</td>
        <td>
          <div class="admin-user-pill" title="User ID: ${escapeHtml(item.uid)}">
            <i class="fa-solid ${item.isMapped ? 'fa-user-check' : 'fa-id-badge'}"></i>
            <span>${escapeHtml(item.userEmail)}</span>
            ${assignBtn}
          </div>
        </td>
        <td style="color: #cbd5e1; font-size: 0.82rem;">${escapeHtml(item.timestamp)}</td>
        <td><strong style="color: #ffffff;">${escapeHtml(item.title)}</strong></td>
        <td><span class="admin-cat-pill ${catClass}">${catLabel}</span></td>
        <td style="text-align: right; font-weight: 700; color: ${amtColor}; font-size: 0.95rem;">
          ${amtSign}Rs. ${item.amount.toLocaleString()}
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminUsersTable(users) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 30px;">No user accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u, index) => {
    const isOwner = ADMIN_EMAILS.includes(u.email.toLowerCase().trim());
    const nameDisplay = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-weight: 700; color: #f8fafc; font-size: 0.88rem;">${escapeHtml(u.displayName || 'No Name Set')}</span>
        <button type="button" class="btn-user-action btn-user-edit" onclick="promptChangeUserDisplayName('${u.uid}', '${escapeHtml(u.displayName || '')}')" title="Change Display Name">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </div>`;

    const emailDisplay = u.isMapped ? `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: #38bdf8; font-weight: 600;">${escapeHtml(u.email)}</span>
        ${isOwner ? '<span style="font-size: 0.7rem; background: rgba(250, 204, 21, 0.2); color: #facc15; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ADMIN</span>' : ''}
      </div>` : `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="user-status-pill user-status-missing"><i class="fa-solid fa-triangle-exclamation"></i> No Email Linked</span>
        <button type="button" class="btn-assign-email" onclick="promptAssignUserEmail('${u.uid}')">
          <i class="fa-solid fa-link"></i> Link Email
        </button>
      </div>`;

    let pwdDisplay = '';
    if (u.password) {
      pwdDisplay = `
        <div class="admin-pwd-pill">
          <input type="password" class="admin-pwd-input" id="adminPwdInput_${index}" value="${escapeHtml(u.password)}" readonly>
          <button type="button" class="btn-admin-pwd-action" onclick="toggleAdminPwdVisibility('adminPwdInput_${index}', this)" title="Show/Hide Password">
            <i class="fa-regular fa-eye"></i>
          </button>
          <button type="button" class="btn-admin-pwd-action" onclick="copyAdminPwd('${escapeHtml(u.password)}')" title="Copy Password">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>`;
    } else {
      pwdDisplay = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">Not Saved Yet</span>
          <button type="button" class="btn-user-action btn-user-edit" onclick="promptSetUserPassword('${u.uid}')" title="Set/Record Password for this User">
            <i class="fa-solid fa-key"></i> Set
          </button>
        </div>`;
    }

    const statusBadge = u.isMapped ? `
      <span class="user-status-pill user-status-connected"><i class="fa-solid fa-circle-check"></i> Connected</span>` : `
      <span class="user-status-pill user-status-missing"><i class="fa-solid fa-clock"></i> Pending Mapping</span>`;

    return `
      <tr>
        <td style="color: #64748b; font-weight: 600;">${index + 1}</td>
        <td>
          <code style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #a5b4fc; background: rgba(99, 102, 241, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.25);">
            ${escapeHtml(u.uid)}
          </code>
        </td>
        <td>${nameDisplay}</td>
        <td>${emailDisplay}</td>
        <td>${pwdDisplay}</td>
        <td>${statusBadge}</td>
        <td style="text-align: center; font-weight: 700; color: #f1f5f9;">${u.txCount}</td>
        <td style="text-align: right; font-weight: 700; color: #f87171;">Rs. ${u.totalSpent.toLocaleString()}</td>
        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 5px; flex-wrap: wrap; justify-content: center;">
            <button type="button" class="btn-user-action btn-user-edit" onclick="promptChangeUserDisplayName('${u.uid}', '${escapeHtml(u.displayName || '')}')" title="Change Display Name">
              <i class="fa-solid fa-user-pen"></i> Name
            </button>
            <button type="button" class="btn-user-action btn-user-edit" onclick="promptAssignUserEmail('${u.uid}')" title="Change or Set Email">
              <i class="fa-solid fa-envelope"></i> Email
            </button>
            <button type="button" class="btn-user-action btn-user-edit" onclick="promptSetUserPassword('${u.uid}')" title="Set/Update Password">
              <i class="fa-solid fa-key"></i> Pass
            </button>
            <button type="button" class="btn-user-action btn-user-filter" onclick="filterTransactionsByUser('${escapeHtml(u.email || u.uid)}')" title="Filter ledger by this user">
              <i class="fa-solid fa-list"></i> Entries
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function promptChangeUserDisplayName(uid, currentName) {
  const entered = prompt(`Enter new Display Name for user (${currentName || uid}):`, currentName || "");
  if (entered === null) return;
  const cleanName = entered.trim();
  if (!cleanName) {
    showToast("Display name cannot be empty.", "error");
    return;
  }
  try {
    showToast("Updating display name...", "info");
    await db.collection('users').doc(uid).set({
      displayName: cleanName,
      nameUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (currentUser && currentUser.uid === uid) {
      try {
        await currentUser.updateProfile({ displayName: cleanName });
      } catch (e) {}
      const nameTagEl = document.getElementById('userDisplayNameTag');
      if (nameTagEl) nameTagEl.innerText = cleanName;
      const emailTagEl = document.getElementById('userEmailTag');
      if (emailTagEl) {
        emailTagEl.innerText = currentUser.email || '';
      }
      const avatarText = document.getElementById('userAvatar');
      const avatarImg = document.getElementById('userAvatarImg');
      if (avatarText && (!avatarImg || avatarImg.style.display === 'none')) {
        avatarText.innerText = cleanName.charAt(0).toUpperCase();
      }
    }

    showToast(`✅ Display name updated to "${cleanName}"!`, "success");
    loadAdminAllTransactions(true);
  } catch (err) {
    showToast("Error updating display name: " + err.message, "error");
  }
}

async function promptSetUserPassword(uid) {
  const entered = prompt(`Enter Password to record for User ID (${uid}):\n(Admin directory will store and display this password for this account)`);
  if (!entered || !entered.trim()) return;
  const cleanPwd = entered.trim();
  try {
    showToast("Saving password to user record...", "info");
    await db.collection('users').doc(uid).set({
      password: cleanPwd,
      passwordUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    showToast("✅ Password saved successfully in Admin directory!", "success");
    loadAdminAllTransactions(true);
  } catch (err) {
    showToast("Error updating password: " + err.message, "error");
  }
}

function toggleAdminPwdVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-regular fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-regular fa-eye';
  }
}

function copyAdminPwd(text) {
  if (!text) {
    showToast("No password to copy.", "info");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast("📋 Password copied to clipboard!", "success");
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast("📋 Password copied to clipboard!", "success");
  });
}

function filterTransactionsByUser(identifier) {
  switchAdminTab('ledger');
  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    searchInput.value = identifier;
    filterAdminTable();
  }
}

async function promptAssignUserEmail(uid) {
  const entered = prompt(`Enter Email Address for User ID (${uid}):\n(Copy the email from Firebase Console > Authentication tab and paste it here):`);
  if (!entered || !entered.trim() || !isValidEmail(entered.trim())) {
    if (entered) showToast("Please enter a valid email address.", "error");
    return;
  }
  const cleanEmail = entered.trim();
  try {
    showToast("Linking email to account...", "info");
    await db.collection('users').doc(uid).set({
      email: cleanEmail,
      assignedByAdmin: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    showToast(`✅ Email successfully linked to ${cleanEmail}!`, "success");
    loadAdminAllTransactions(true); // force reload to update both tables
  } catch (err) {
    showToast("Error updating user: " + err.message, "error");
  }
}

async function promptAddNewUserToDirectory() {
  const uid = prompt("Enter User UID from Firebase Console > Authentication tab:\n(e.g. 7qX89yZ2...)");
  if (!uid || !uid.trim()) return;

  const email = prompt(`Enter Registered Email for UID (${uid.trim()}):\n(e.g. user@gmail.com)`);
  if (!email || !email.trim() || !isValidEmail(email.trim())) {
    showToast("Please enter a valid email address.", "error");
    return;
  }

  const name = prompt(`Enter Display Name for this user (optional, press Enter to default):`, email.trim().split('@')[0]) || email.trim().split('@')[0];
  const pwd = prompt(`Enter Password for this account (optional):`, "") || "";

  const cleanUid = uid.trim();
  const cleanEmail = email.trim();

  try {
    showToast("Adding account to directory...", "info");
    const payload = {
      email: cleanEmail,
      displayName: name.trim(),
      assignedByAdmin: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (pwd.trim()) {
      payload.password = pwd.trim();
    }
    await db.collection('users').doc(cleanUid).set(payload, { merge: true });

    showToast(`✅ User ${cleanEmail} added to Directory!`, "success");
    loadAdminAllTransactions(true);
  } catch (err) {
    showToast("Error adding user: " + err.message, "error");
  }
}

function filterAdminTable() {
  const searchInput = document.getElementById('adminSearchInput');
  const clearBtn = document.getElementById('clearAdminSearchBtn');
  if (clearBtn) {
    clearBtn.style.display = (searchInput && searchInput.value.trim().length > 0) ? 'inline-flex' : 'none';
  }

  const searchTerm = (searchInput?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('adminCategorySelect')?.value || 'ALL';

  const filtered = allSystemTransactions.filter(item => {
    const matchesSearch = !searchTerm ||
      item.userEmail.toLowerCase().includes(searchTerm) ||
      item.userName.toLowerCase().includes(searchTerm) ||
      item.uid.toLowerCase().includes(searchTerm) ||
      item.title.toLowerCase().includes(searchTerm) ||
      item.amount.toString().includes(searchTerm);

    const matchesCategory = categoryFilter === 'ALL' || item.type === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  renderAdminTable(filtered);
}

function clearAdminSearchFilter() {
  const input = document.getElementById('adminSearchInput');
  if (input) {
    input.value = '';
    const clearBtn = document.getElementById('clearAdminSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    filterAdminTable();
    input.focus();
  }
}

function filterAdminUsersTable() {
  const searchInput = document.getElementById('adminUserSearchInput');
  const clearBtn = document.getElementById('clearAdminUserSearchBtn');
  if (clearBtn) {
    clearBtn.style.display = (searchInput && searchInput.value.trim().length > 0) ? 'inline-flex' : 'none';
  }

  const term = (searchInput?.value || '').toLowerCase().trim();
  if (!term) {
    renderAdminUsersTable(allSystemUsers);
    return;
  }

  const filtered = allSystemUsers.filter(u =>
    u.uid.toLowerCase().includes(term) ||
    u.email.toLowerCase().includes(term) ||
    u.displayName.toLowerCase().includes(term) ||
    (u.password && u.password.toLowerCase().includes(term))
  );

  renderAdminUsersTable(filtered);
}

function clearAdminUserSearchFilter() {
  const input = document.getElementById('adminUserSearchInput');
  if (input) {
    input.value = '';
    const clearBtn = document.getElementById('clearAdminUserSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    filterAdminUsersTable();
    input.focus();
  }
}

function exportAdminDataExcel() {
  if (!allSystemTransactions || allSystemTransactions.length === 0) {
    showToast("No data to export.", "info");
    return;
  }

  const exportData = [
    ["SMARTFLOW MASTER SYSTEM AUDIT REPORT (ALL USERS)", "", "", "", "", "", ""],
    ["Generated By:", "Admin (hyjano040@gmail.com)", "", "Generated At:", new Date().toLocaleString(), "", ""],
    ["", "", "", "", "", "", ""],
    ["#", "User UID", "User Email", "User Name", "Date & Time", "Title / Source", "Category", "Amount (Rs.)"]
  ];

  allSystemTransactions.forEach((item, idx) => {
    const isIncome = item.type === 'IN';
    const isFixed = item.type === 'PERMANENT';
    const catName = isIncome ? 'Income (Money IN)' : (isFixed ? 'Fixed Monthly Outflow' : 'Expense (Money OUT)');
    const signedAmount = (isIncome ? '+ ' : '- ') + 'Rs. ' + item.amount.toLocaleString();

    exportData.push([
      idx + 1,
      item.uid,
      item.userEmail,
      item.userName,
      item.timestamp,
      item.title,
      catName,
      signedAmount
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, "All Users Ledger");
  XLSX.writeFile(wb, `SmartFlow_Master_All_Users_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast("📊 Master Excel Report downloaded successfully!", "success");
}