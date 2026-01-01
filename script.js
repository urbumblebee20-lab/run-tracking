let map;
let polyline;
let watchId = null;
let path = [];
let totalDistance = 0;
let lastPosition = null;

const distanceEl = document.getElementById("distance");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

/* 🔹 1. LOAD MAP ON PAGE OPEN */
window.onload = () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      initMap(lat, lng);
    },
    () => {
      alert("Please allow location to load the map");
    }
  );
};

/* 🔹 2. INITIALIZE MAP */
function initMap(lat, lng) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat, lng },
    zoom: 16,
  });

  polyline = new google.maps.Polyline({
    map: map,
    path: [],
    strokeColor: "#ff0000",
    strokeWeight: 4,
  });

  new google.maps.Marker({
    position: { lat, lng },
    map: map,
    title: "You are here",
  });
}

/* 🔹 3. START TRACKING */
startBtn.addEventListener("click", () => {
  statusEl.textContent = "Running...";
  startBtn.disabled = true;
  stopBtn.disabled = false;

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const currentPoint = new google.maps.LatLng(lat, lng);
      path.push(currentPoint);
      polyline.setPath(path);
      map.setCenter(currentPoint);

      if (lastPosition) {
        totalDistance += calculateDistance(
          lastPosition.lat,
          lastPosition.lng,
          lat,
          lng
        );
        distanceEl.textContent = totalDistance.toFixed(2) + " km";
      }

      lastPosition = { lat, lng };
    },
    () => alert("Location error"),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000,
    }
  );
});

/* 🔹 4. STOP TRACKING */
stopBtn.addEventListener("click", () => {
  navigator.geolocation.clearWatch(watchId);
  statusEl.textContent = "Stopped";
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

/* 🔹 DISTANCE CALCULATION */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
