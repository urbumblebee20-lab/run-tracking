// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbIffq1kXSpwmAL8Q-Jv9lyPXdOfx7jK8",
  authDomain: "live-run-tracking.firebaseapp.com",
  databaseURL: "https://live-run-tracking-default-rtdb.firebaseio.com",
  projectId: "live-run-tracking",
  storageBucket: "live-run-tracking.firebasestorage.app",
  messagingSenderId: "740131513256",
  appId: "1:740131513256:web:4eed9299eae062c139339d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= VARIABLES =================
let map;
let polyline;
let watchId = null;

let totalDistance = 0;
let lastPosition = null;
let route = [];

let startTime = null;
let timerInterval = null;
let runId = null;

// ================= UI ELEMENTS =================
const distanceEl = document.getElementById("distance");
const timerEl = document.getElementById("timer");
const speedEl = document.getElementById("speed");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const finishBtn = document.getElementById("finishBtn");
const darkBtn = document.getElementById("darkBtn");

// ================= DARK MODE (GLOBAL) =================

// Apply saved theme on load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Toggle theme
darkBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

// ================= MAP INIT =================
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;

    map = L.map("map").setView([latitude, longitude], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);

    polyline = L.polyline([], {
      color: "#ef4444",
      weight: 4
    }).addTo(map);

    L.marker([latitude, longitude]).addTo(map)
      .bindPopup("You are here")
      .openPopup();
  },
  () => alert("Please allow location access")
);

// ================= START RUN =================
startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  finishBtn.disabled = true;

  totalDistance = 0;
  lastPosition = null;
  route = [];
  polyline.setLatLngs([]);

  distanceEl.textContent = "0.00 km";
  speedEl.textContent = "0.0 km/h";
  timerEl.textContent = "00:00:00";

  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  // Create Firebase run
  runId = push(ref(db, "runs")).key;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, speed } = pos.coords;

      route.push([latitude, longitude]);
      polyline.addLatLng([latitude, longitude]);
      map.setView([latitude, longitude]);

      if (lastPosition) {
        totalDistance += calculateDistance(
          lastPosition.lat,
          lastPosition.lng,
          latitude,
          longitude
        );
      }

      lastPosition = { lat: latitude, lng: longitude };

      distanceEl.textContent = totalDistance.toFixed(2) + " km";
      speedEl.textContent = speed
        ? (speed * 3.6).toFixed(1) + " km/h"
        : "0.0 km/h";

      // Save LIVE data
      set(ref(db, `runs/${runId}/live`), {
        latitude,
        longitude,
        distance: totalDistance.toFixed(2),
        speed: speed ? (speed * 3.6).toFixed(1) : 0,
        time: Math.floor((Date.now() - startTime) / 1000),
        timestamp: Date.now()
      });
    },
    (err) => alert("Tracking error: " + err.message),
    { enableHighAccuracy: true }
  );
});

// ================= STOP RUN =================
stopBtn.addEventListener("click", () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  clearInterval(timerInterval);

  stopBtn.disabled = true;
  finishBtn.disabled = false;
});

// ================= FINISH RUN =================
finishBtn.addEventListener("click", () => {
  if (!startTime || route.length === 0) {
    alert("No run data available");
    return;
  }

  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  const calories = Math.round(totalDistance * 60);

  // Save SUMMARY to Firebase
  set(ref(db, `runs/${runId}/summary`), {
    distance: totalDistance.toFixed(2),
    time: totalTime,
    calories,
    route
  });

  // Save for summary page
  localStorage.setItem("distance", totalDistance.toFixed(2));
  localStorage.setItem("time", totalTime);
  localStorage.setItem("route", JSON.stringify(route));

  // Reset buttons
  startBtn.disabled = false;
  stopBtn.disabled = true;
  finishBtn.disabled = true;

  window.location.href = "summary.html";
});

// ================= TIMER =================
function updateTimer() {
  const diff = Date.now() - startTime;

  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor(diff / 60000) % 60).padStart(2, "0");
  const s = String(Math.floor(diff / 1000) % 60).padStart(2, "0");

  timerEl.textContent = `${h}:${m}:${s}`;
}

// ================= DISTANCE FORMULA =================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
