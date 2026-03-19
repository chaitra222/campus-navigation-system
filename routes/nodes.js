import express from "express";
import { prisma } from "../prisma/client.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const nodes = await prisma.node.findMany();
    res.json(nodes);
  } catch (e) {
    console.error("GET /nodes error:", e);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});


// GET all nodes
// routes/nodes.js
router.get("/", async (_req, res) => {
  const nodes = await prisma.node.findMany({
    where: { isVirtual: false },   // 👈 hide virtual nodes from UI
    orderBy: { id: "asc" }
  });
  res.json(nodes);
});

// POST create node
router.post("/", async (req, res) => {
  const { code, name, lat, lng, building, floor, type } = req.body;
  if (code == null || name == null || lat == null || lng == null) {
    return res.status(400).json({ error: "code, name, lat, lng are required" });
  }
  try {
    const node = await prisma.node.create({
      data: { code, name, lat, lng, building, floor, type }
    });
    res.status(201).json(node);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT update node
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const node = await prisma.node.update({ where: { id }, data: req.body });
    res.json(node);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE node (also deletes connected edges)
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.edge.deleteMany({ where: { OR: [{ fromId: id }, { toId: id }] } });
  await prisma.node.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
