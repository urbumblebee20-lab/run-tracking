// 🌙 Apply saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Dark mode toggle
document.getElementById("darkBtn").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

// Load run data
const distance = localStorage.getItem("distance");
const time = localStorage.getItem("time");
const route = JSON.parse(localStorage.getItem("route"));

document.getElementById("sd").textContent = distance + " km";
document.getElementById("st").textContent =
  new Date(time * 1000).toISOString().substring(11, 19);
document.getElementById("sc").textContent =
  Math.round(distance * 60) + " kcal";

// Map
const map = L.map("map").setView(route[0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
const line = L.polyline(route, { color: "#ef4444", weight: 4 }).addTo(map);
map.fitBounds(line.getBounds());

// 🔁 New Run button
document.getElementById("newRunBtn").onclick = () => {
  window.location.href = "index.html";
};
