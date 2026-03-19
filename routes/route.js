// routes/route.js
import express from "express";
import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

// Optional: keep your graph-based handler (walk-ll) if you still need it
import { buildGraph } from "../services/DynamicGraphService.js";
import { makeWalkLLHandler } from "../services/RouteService.js";

const router = express.Router();

/**
 * Direct edge route:
 * Returns exactly the pathCoords you stored in the DB for that edge,
 * with no graph search or detours. If the edge is bidirectional, we
 * also accept (to, from) order.
 *
 * GET /api/route/edge?from=main_entrance&to=main_building
 */
router.get("/edge", async (req, res) => {
  try {
    const fromCode = String(req.query.from || "").trim();
    const toCode   = String(req.query.to || "").trim();

    if (!fromCode || !toCode) {
      return res.status(400).json({ error: "from and to query params are required (node codes)" });
    }

    // Try forward edge first
    let edge = await prisma.edge.findFirst({
      where: {
        from: { code: fromCode },
        to:   { code: toCode },
      },
      include: { from: true, to: true },
    });

    // If not found, try reverse only if bidirectional
    if (!edge) {
      const reverse = await prisma.edge.findFirst({
        where: {
          from: { code: toCode },
          to:   { code: fromCode },
          bidirectional: true,
        },
        include: { from: true, to: true },
      });
      if (reverse) {
        // Flip coordinates so the path runs from `fromCode` to `toCode`
        edge = {
          ...reverse,
          pathCoords: [...reverse.pathCoords].reverse(),
          from: reverse.to,
          to: reverse.from,
        };
      }
    }

    if (!edge) {
      return res.status(404).json({ error: `No direct edge found between ${fromCode} and ${toCode}. Make sure it exists in seed.js and you re-seeded.` });
    }

    const path = edge.pathCoords || [];
    const length = edge.lengthMeters ?? (
      path.length > 1
        ? path.slice(1).reduce((acc, p, i) => {
            const a = path[i], b = p;
            const toRad = d => d * Math.PI / 180;
            const R = 6371000;
            const dLat = toRad(b.lat - a.lat);
            const dLng = toRad(b.lng - a.lng);
            const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
            return acc + 2 * R * Math.asin(Math.sqrt(s));
          }, 0)
        : 0
    );

    const durationMin = Math.max(1, Math.round(length / (1.3 * 60)));

    return res.json({
      summary: {
        type: "direct-edge",
        from: edge.from.code,
        to: edge.to.code,
        distanceMeters: Math.round(length),
        durationMin,
      },
      path, // [{lat,lng}, ...] exactly what you stored
    });
  } catch (err) {
    console.error("GET /api/route/edge failed:", err);
    return res.status(500).json({ error: "Direct edge routing failed" });
  }
});

/**
 * Keep your graph-based route (optional). This one can still be used
 * when you want normal shortest-path over the whole campus.
 *
 * GET /api/route/walk-ll?startLat=..&startLng=..&endLat=..&endLng=..&step=10
 */
router.get("/walk-ll", makeWalkLLHandler({ buildGraph, prisma }));

export default router;
