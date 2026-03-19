// optional: auto-redirect if already logged in (e.g., from login page)
(function () {
  const path = location.pathname.toLowerCase();
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const user = session.user;

  // if you're on login but already logged in, go to role home
  if (path.endsWith("/login.html") && user?.role) {
    location.href = user.role === "Admin" ? "admin.html" : "navigation.html";
  }

  // protect admin page
  if (path.endsWith("/admin.html") && user?.role !== "Admin") {
    alert("Admins only.");
    location.href = "login.html";
  }

  // bind logout if present
  const logoutBtn = document.getElementById("logoutBtnAdmin");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("session");
      location.href = "login.html";
    });
  }
})();