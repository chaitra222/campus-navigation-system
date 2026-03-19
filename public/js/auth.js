// public/js/auth.js
const Auth = {
  key: "cn_user",
  store(user) { localStorage.setItem(this.key, JSON.stringify(user)); },
  get() { try { return JSON.parse(localStorage.getItem(this.key)); } catch { return null; } },
  clear() { localStorage.removeItem(this.key); }
};

function requireAuth() {
  if (!Auth.get()) {
    // optionally, keep intended URL
    const back = encodeURIComponent(location.pathname + location.search);
    location.href = `/login.html?next=${back}`;
  }
}

function logoutIfButton() {
  const btn = document.getElementById("logoutBtn") || document.getElementById("logoutBtnAdmin");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    Auth.clear();
    location.href = "/login.html";
  });
}

window.Auth = Auth;
window.requireAuth = requireAuth;
window.addEventListener("DOMContentLoaded", logoutIfButton);
