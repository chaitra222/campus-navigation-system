// app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Route modules
import authRoutes from "./routes/auth.js";
import nodesRoutes from "./routes/nodes.js";
import edgesRoutes from "./routes/edges.js";
import routeRoutes from "./routes/route.js";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * Core middleware
 */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Static assets (frontend)
app.use(express.static(path.join(__dirname, "public")));

/**
 * API routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodesRoutes);
app.use("/api/edges", edgesRoutes);
app.use("/api/route", routeRoutes);

// Simple server health check
app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * 404 for unknown API routes (kept after all .use above)
 */
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

/**
 * Central error handler
 */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);

export default app;
