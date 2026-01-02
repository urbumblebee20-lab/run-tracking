// 🔥 Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// 🔹 Firebase config (YOUR CONFIG)
const firebaseConfig = {
  apiKey: "AIzaSyAbIffq1kXSpwmAL8Q-Jv9lyPXdOfx7jK8",
  authDomain: "live-run-tracking.firebaseapp.com",
  databaseURL: "https://live-run-tracking-default-rtdb.firebaseio.com",
  projectId: "live-run-tracking",
  storageBucket: "live-run-tracking.firebasestorage.app",
  messagingSenderId: "740131513256",
  appId: "1:740131513256:web:4eed9299eae062c139339d",
  measurementId: "G-XBHCM1E518"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================================
// 🏃 RUN TRACKER VARIABLES
// ================================
let map, polyline;
let watchId = null;
let totalDistance = 0;
let lastPos = null;
let route = [];
let startTime = null;
let timerInterval = null;
let runId = null;

// UI elements
const distanceEl = document.getElementById("distance");
const timerEl = document.getElementById("timer");
const speedEl = document.getElementById("speed");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const finishBtn = document.getElementById("finishBtn");
const darkBtn = document.getElementById("darkModeBtn");

// 🌙 Dark mode
darkBtn.onclick = () => document.body.classList.toggle("dark");

// 🗺️ Load map
window.onload = () => {
  navigator.geolocation.getCurrentPosition(
    pos => initMap(pos.coords.latitude, pos.coords.longitude),
    () => alert("Allow location access")
  );
};

function initMap(lat, lng) {
  map = L.map("map").setView([lat, lng], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  polyline = L.polyline([], { color: "red", weight: 4 }).addTo(map);
}

// ▶ START RUN
startBtn.onclick = () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  // 🔥 Create new run entry in Firebase
  runId = push(ref(db, "runs")).key;

  watchId = navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude, speed } = pos.coords;

      route.push([latitude, longitude]);
      polyline.addLatLng([latitude, longitude]);
      map.setView([latitude, longitude]);

      if (lastPos) {
        totalDistance += getDistance(
          lastPos.lat, lastPos.lng,
          latitude, longitude
        );
      }

      lastPos = { lat: latitude, lng: longitude };

      distanceEl.textContent = totalDistance.toFixed(2) + " km";
      speedEl.textContent = speed ? (speed * 3.6).toFixed(1) + " km/h" : "0.0 km/h";

      // 🔥 SAVE LIVE DATA TO FIREBASE
      set(ref(db, `runs/${runId}/live`), {
        latitude,
        longitude,
        speed: speed ? (speed * 3.6).toFixed(1) : 0,
        distance: totalDistance.toFixed(2),
        time: Math.floor((Date.now() - startTime) / 1000),
        timestamp: Date.now()
      });
    },
    () => alert("Tracking error"),
    { enableHighAccuracy: true }
  );
};

// ⏹ STOP RUN
stopBtn.onclick = () => {
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerInterval);
  stopBtn.disabled = true;
  finishBtn.disabled = false;
};

// 📊 FINISH RUN
finishBtn.onclick = () => {
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  const calories = Math.round(totalDistance * 60);

  // 🔥 SAVE FINAL RUN DATA
  set(ref(db, `runs/${runId}/summary`), {
    distance: totalDistance.toFixed(2),
    time: totalTime,
    calories,
    route
  });

  localStorage.setItem("distance", totalDistance.toFixed(2));
  localStorage.setItem("time", totalTime);
  localStorage.setItem("route", JSON.stringify(route));

  window.location.href = "summary.html";
};

// ⏱ TIMER
function updateTimer() {
  const diff = Date.now() - startTime;
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor(diff / 60000) % 60).padStart(2, "0");
  const s = String(Math.floor(diff / 1000) % 60).padStart(2, "0");
  timerEl.textContent = `${h}:${m}:${s}`;
}

// 📏 DISTANCE CALCULATION
function getDistance(lat1, lon1, lat2, lon2) {
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
