// 🧭 LOGIN VALIDATION
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const role = document.getElementById("role").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const users = JSON.parse(localStorage.getItem("users")) || [];
      const found = users.find(u => u.email === email && u.password === password && u.role === role);

      if (found) {
        if (role === "Admin") window.location.href = "admin.html";
        else window.location.href = "navigation.html";
      } else alert("Invalid credentials!");
    });
  }

  // 🆕 SIGNUP
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      const name = signupName.value.trim();
      const email = signupEmail.value.trim();
      const pass = signupPassword.value;
      const confirm = confirmPassword.value;
      const role = signupRole.value;

      if (!name || !email || !pass || !confirm) {
        alert("All fields are required!");
        return;
      }
      if (pass !== confirm) {
        alert("Passwords do not match!");
        return;
      }

      const users = JSON.parse(localStorage.getItem("users")) || [];
      users.push({ name, email, password: pass, role });
      localStorage.setItem("users", JSON.stringify(users));
      alert("Registered successfully!");
      window.location.href = "login.html";
    });
  }

  // 🔐 FORGOT PASSWORD
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const email = forgotEmail.value.trim();
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const found = users.find(u => u.email === email);
      if (found) alert("Reset link sent to " + email);
      else alert("Email not found!");
    });
  }

  // 🗺️ NAVIGATION → ROUTE PAGE
  const findRouteBtn = document.getElementById("findRouteBtn");
  if (findRouteBtn) {
    findRouteBtn.addEventListener("click", () => {
      const start = document.getElementById("start").value.trim();
      const end = document.getElementById("end").value.trim();
      const lang = document.getElementById("language").value;

      if (!start || !end) {
        alert("Please enter both locations!");
        return;
      }

      localStorage.setItem("startLocation", start);
      localStorage.setItem("endLocation", end);
      localStorage.setItem("selectedLang", lang);
      window.location.href = "route.html";
    });
  }

  // 🎤 VOICE INPUT
  const voiceBtn = document.getElementById("voiceBtn");
  if (voiceBtn) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-IN";
    voiceBtn.addEventListener("click", () => recognition.start());
    recognition.onresult = (e) => {
      document.getElementById("start").value = e.results[0][0].transcript;
    };
  }

  // 🗺️ ROUTE PAGE DISPLAY
  const mapDiv = document.getElementById("map");
  if (mapDiv) {
    const start = localStorage.getItem("startLocation");
    const end = localStorage.getItem("endLocation");
    const lang = localStorage.getItem("selectedLang");

    const map = L.map("map").setView([12.97, 77.59], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const points = [[12.9716, 77.5946], [12.975, 77.59]];
    const route = L.polyline(points, { color: "#00aaff", weight: 5 }).addTo(map);
    map.fitBounds(route.getBounds());

    document.getElementById("distance").textContent = "287.4 meters";
    document.getElementById("time").textContent = "3.4 minutes";

    const speakBtn = document.getElementById("speakRoute");
    if (speakBtn) {
      speakBtn.addEventListener("click", () => {
        const msg = new SpeechSynthesisUtterance(`Starting from ${start} to ${end}. Estimated distance 287 meters, time 3 minutes.`);
        msg.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : lang === "ta" ? "ta-IN" : "en-IN";
        speechSynthesis.speak(msg);
      });
    }

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "navigation.html";
    });
  }
});
// -------------------- NAVIGATION PAGE LOGIC --------------------
document.addEventListener("DOMContentLoaded", () => {
  const findRouteBtn = document.getElementById("findRouteBtn");
  if (findRouteBtn) {
    findRouteBtn.addEventListener("click", () => {
      const start = document.getElementById("start").value.trim();
      const end = document.getElementById("end").value.trim();

      if (!start || !end) {
        alert("Please enter both Start and Destination!");
        return;
      }

      localStorage.setItem("startLocation", start);
      localStorage.setItem("endLocation", end);

      window.location.href = "route.html";
    });
  }
});

// -------------------- ROUTE PAGE LOGIC --------------------
document.addEventListener("DOMContentLoaded", () => {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  const start = localStorage.getItem("startLocation");
  const end = localStorage.getItem("endLocation");

  if (!start || !end) {
    alert("No route data found! Please go back and enter details again.");
    window.location.href = "navigation.html";
    return;
  }

  // Initialize map (centered on GAT area as example)
  const map = L.map("map").setView([12.97, 77.59], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Demo coordinates — replace with real geocoding or backend coordinates later
  const startCoords = [12.9716, 77.5946]; // start marker
  const endCoords = [12.975, 77.59]; // destination marker

  // Create red start marker
  const startMarker = L.marker(startCoords, {
    icon: L.icon({
      iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      iconSize: [35, 35],
      iconAnchor: [17, 34]
    })
  }).addTo(map);
  startMarker.bindPopup(`<b>Start:</b> ${start}`).openPopup();

  // Create red destination marker
  const endMarker = L.marker(endCoords, {
    icon: L.icon({
      iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      iconSize: [35, 35],
      iconAnchor: [17, 34]
    })
  }).addTo(map);
  endMarker.bindPopup(`<b>Destination:</b> ${end}`);

  // Draw route line
  const routeLine = L.polyline([startCoords, endCoords], {
    color: "#00aaff",
    weight: 5,
    opacity: 0.7,
    dashArray: "10,10"
  }).addTo(map);

  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

  // Distance & time (demo)
  const distance = 287.4;
  const time = 3.4;
  document.getElementById("distance").textContent = `${distance} meters`;
  document.getElementById("time").textContent = `${time} minutes`;

  // Voice guide
  const speakBtn = document.getElementById("speakRoute");
  if (speakBtn) {
    speakBtn.addEventListener("click", () => {
      const message = `Starting from ${start}, head towards ${end}. 
      The total distance is ${distance} meters and will take around ${time} minutes.`;
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = "en-IN";
      speech.rate = 1;
      window.speechSynthesis.speak(speech);
    });
  }

  // Back button
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "navigation.html";
  });
});