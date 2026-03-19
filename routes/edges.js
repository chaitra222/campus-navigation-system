// routes/edges.js
import express from "express";
import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

const router = express.Router();

// GET /api/edges  -> all stored edges with pathCoords
router.get("/", async (req, res) => {
  const edges = await prisma.edge.findMany({
    include: { from: true, to: true },
    orderBy: { id: "asc" }
  });
  res.json(edges);
});




// GET all edges
router.get("/", async (_req, res) => {
  const edges = await prisma.edge.findMany({ orderBy: { id: "asc" } });
  res.json(edges);
});

// POST create edge
router.post("/", async (req, res) => {
  const { fromId, toId, weight, type = "road", bidirectional = true, isIndoor = false } = req.body;
  if (fromId == null || toId == null || weight == null) {
    return res.status(400).json({ error: "fromId, toId, weight are required" });
  }
  try {
    const edge = await prisma.edge.create({
      data: { fromId, toId, weight, type, bidirectional, isIndoor }
    });
    res.status(201).json(edge);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE edge
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.edge.delete({ where: { id } });
  res.json({ ok: true });
});
router.post("/densify", async (req, res) => {
  const step = Number(req.body?.stepMeters) || 50;
  try {
    const result = await DensifyService.densifyAll(step);
    res.json({ ok: true, stepMeters: step, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
export default router;
