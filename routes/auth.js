// routes/auth.js
import express from "express";
import { prisma } from "../prisma/client.js";   // from routes/*
const router = express.Router();

// demo users (replace with DB later)
const DEMO_USERS = [
  { name: "Admin", email: "admin@gat.local", password: "Admin@123", role: "Admin" },
  { name: "Student", email: "user@gat.local", password: "User@123", role: "User" }
];

router.post("/login", (req, res) => {
  const { email, password, role } = req.body || {};
  const found = DEMO_USERS.find(u => u.email === email && u.password === password && u.role === role);
  if (!found) return res.status(401).json({ error: "Invalid credentials" });

  // minimal session payload
  const user = { name: found.name, email: found.email, role: found.role };
  return res.json({ user, token: "demo-token" });
});

export default router;