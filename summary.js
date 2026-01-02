const distance = parseFloat(localStorage.getItem("distance"));
const timeSec = parseInt(localStorage.getItem("time"));
const route = JSON.parse(localStorage.getItem("route"));

document.getElementById("sumDistance").textContent = distance + " km";
document.getElementById("sumTime").textContent = formatTime(timeSec);

// 🔥 Calories (avg running)
const calories = Math.round(distance * 60);
document.getElementById("sumCalories").textContent = calories + " kcal";

// 🗺️ Map
const map = L.map("map").setView(route[0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
const line = L.polyline(route, { color: "red", weight: 4 }).addTo(map);
map.fitBounds(line.getBounds());

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor(sec / 60) % 60).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
