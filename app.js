// Import Firebase Modular SDK melalui CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ================= 1. KONFIGURASI FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyAWy2xob6HveeK-jt4zIO8t5B9_k48Vvhg",
  authDomain: "smartpjuiot.firebaseapp.com",
  databaseURL: "https://smartpjuiot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartpjuiot",
  storageBucket: "smartpjuiot.firebasestorage.app",
  messagingSenderId: "713928225011",
  appId: "1:713928225011:web:ef0a92bc9de2882fbb0786"
};

// Inisialisasi Aplikasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Elemen DOM
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

// DOM Telemetri
const valLux = document.getElementById("val-lux");
const valVoltage = document.getElementById("val-voltage");
const valCurrent = document.getElementById("val-current");
const valPower = document.getElementById("val-power");
const badgeRelay = document.getElementById("badge-relay");
const badgeHealth = document.getElementById("badge-health");
const alertBanner = document.getElementById("alert-banner");

// DOM Kontrol
const btnModeAuto = document.getElementById("btn-mode-auto");
const btnModeManual = document.getElementById("btn-mode-manual");
const btnLampOn = document.getElementById("btn-lamp-on");
const btnLampOff = document.getElementById("btn-lamp-off");

// ================= 2. AUTENTIKASI (LOGIN / LOGOUT) =================
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginError.innerText = "";
    })
    .catch((err) => {
      loginError.innerText = "Login gagal: Email atau Password salah!";
    });
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// Pantau Status Session User
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    dashboardScreen.classList.remove("hidden");
    initRealtimeListeners(); // Jalankan listener saat user terbukti login
  } else {
    dashboardScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  }
});

// ================= 3. LISTENER TELEMETRI REAL-TIME =================
function initRealtimeListeners() {
  const pjuRef = ref(db, 'PJU_001');

  onValue(pjuRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // A. Update Tampilan Telemetri
    const telemetry = data.telemetry || {};
    valLux.innerText = telemetry.lux !== undefined ? telemetry.lux.toFixed(1) : "0";
    valVoltage.innerText = telemetry.voltage !== undefined ? telemetry.voltage.toFixed(1) : "0";
    valCurrent.innerText = telemetry.current !== undefined ? telemetry.current.toFixed(2) : "0";
    valPower.innerText = telemetry.power !== undefined ? telemetry.power.toFixed(1) : "0";

    // B. Update Status Relay
    if (telemetry.relay_status === "ON") {
      badgeRelay.innerText = "ON";
      badgeRelay.className = "status-badge bg-success";
    } else {
      badgeRelay.innerText = "OFF";
      badgeRelay.className = "status-badge bg-secondary";
    }

    // C. Update Kesehatan & Notifikasi Kerusakan
    if (telemetry.health === "BROKEN_LAMP") {
      badgeHealth.innerText = "Lampu Rusak / Putus";
      badgeHealth.className = "status-badge bg-danger";
      alertBanner.classList.remove("hidden");
    } else {
      badgeHealth.innerText = "NORMAL";
      badgeHealth.className = "status-badge bg-success";
      alertBanner.classList.add("hidden");
    }

    // D. Update Status Tombol Kontrol UI
    const control = data.control || {};
    if (control.mode === "auto") {
      btnModeAuto.className = "btn btn-outline btn-active";
      btnModeManual.className = "btn btn-outline";
    } else {
      btnModeManual.className = "btn btn-outline btn-active";
      btnModeAuto.className = "btn btn-outline";
    }
  });
}

// ================= 4. MEMASUKKAN PERINTAH KONTROL KE FIREBASE =================
btnModeAuto.addEventListener("click", () => {
  set(ref(db, 'PJU_001/control/mode'), "auto");
});

btnModeManual.addEventListener("click", () => {
  set(ref(db, 'PJU_001/control/mode'), "manual");
});

btnLampOn.addEventListener("click", () => {
  set(ref(db, 'PJU_001/control/manual_state'), "ON");
});

btnLampOff.addEventListener("click", () => {
  set(ref(db, 'PJU_001/control/manual_state'), "OFF");
});