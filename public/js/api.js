// public/js/api.js
const API_ORIGIN = location.origin;            // e.g. http://localhost:5000
const API_BASE = `${API_ORIGIN}/api`;          // /api/*

const CN_API = {
  async login(email, password, role) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role })
    });
    if (!res.ok) {
      let err;
      try { err = await res.json(); } catch {}
      throw err || { error: "Login failed" };
    }
    return res.json();
  }
};

// Lightweight wrapper for authed calls
async function authFetch(url, opts = {}) {
  const token = Auth.get()?.token;
  const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) {
    Auth.clear();
    location.href = "/login.html";
    return;
  }
  return res;
}

window.CN_API = CN_API;
window.authFetch = authFetch;
