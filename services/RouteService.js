// services/RouteService.js
// Minimal helpers + a simple Dijkstra using edge.lengthMeters.
// This file exposes router functions used by routes/route.js (or app.js).

export function toRad(d) { return d * Math.PI / 180; }
export function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function polylineLengthMeters(coords) {
  if (!coords || coords.length < 2) return 0;
  let L = 0;
  for (let i = 0; i < coords.length - 1; i++) L += haversineMeters(coords[i], coords[i+1]);
  return L;
}

function nearestNodeId(graph, pt) {
  let best = null, bestD = Infinity;
  for (const n of graph.nodes) {
    const d = haversineMeters({lat:n.lat, lng:n.lng}, pt);
    if (d < bestD) { bestD = d; best = n.id; }
  }
  return best;
}

function dijkstra(graph, startId, goalId) {
  const dist = new Map();
  const prev = new Map();
  const Q = new Set(graph.nodes.map(n => n.id));

  for (const n of Q) dist.set(n, Infinity);
  dist.set(startId, 0);

  while (Q.size) {
    // pick u with smallest dist
    let u = null, best = Infinity;
    for (const id of Q) {
      const d = dist.get(id);
      if (d < best) { best = d; u = id; }
    }
    if (u === null) break;
    Q.delete(u);
    if (u === goalId) break;

    const outs = graph.out.get(u) || [];
    for (const e of outs) {
      const alt = dist.get(u) + (e.lengthMeters ?? 1);
      if (alt < dist.get(e.toId)) {
        dist.set(e.toId, alt);
        prev.set(e.toId, e); // store edge
      }
    }
  }

  if (!prev.has(goalId)) return null;

  // reconstruct as list of edges
  const edges = [];
  let cur = goalId;
  while (cur !== startId) {
    const edge = prev.get(cur);
    if (!edge) break;
    edges.push(edge);
    cur = edge.fromId;
  }
  edges.reverse();
  return edges;
}

function stitchRouteGeometry(edgeList) {
  if (!edgeList || !edgeList.length) return [];
  const out = [];
  for (const e of edgeList) {
    if (!e.shape || e.shape.length < 2) continue;
    if (out.length === 0) {
      out.push(...e.shape);
    } else {
      // avoid duplicate join point
      const last = out[out.length - 1];
      const first = e.shape[0];
      if (last.lat === first.lat && last.lng === first.lng) {
        out.push(...e.shape.slice(1));
      } else {
        out.push(...e.shape);
      }
    }
  }
  return out;
}

// Build a plain JS handler you can mount inside routes/route.js
export function makeWalkLLHandler({ buildGraph, prisma }) {
  return async function walkLL(req, res) {
    try {
      // 1) parse inputs
      const start = { lat: Number(req.query.startLat), lng: Number(req.query.startLng) };
      const end   = { lat: Number(req.query.endLat),   lng: Number(req.query.endLng)  };
      if (Number.isNaN(start.lat) || Number.isNaN(end.lat)) {
        return res.status(400).json({ error: "Bad lat/lng" });
      }

      // 2) build graph (uses pathCoords exactly)
      const graph = await buildGraph(prisma);

      // 3) snap to nearest nodes (simple)
      const sId = nearestNodeId(graph, start);
      const tId = nearestNodeId(graph, end);

      // 4) route (Dijkstra)
      const routeEdges = dijkstra(graph, sId, tId);
      if (!routeEdges) return res.status(404).json({ error: "No path" });

      // 5) stitch geometry from edge shapes (NO recompute)
      const path = stitchRouteGeometry(routeEdges);
      const distance = polylineLengthMeters(path);

      return res.json({
        summary: { distanceMeters: distance },
        edges: routeEdges.map(e => ({ id: e.id, fromId: e.fromId, toId: e.toId, length: e.lengthMeters })),
        path    // [{lat,lng}, ...]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Routing failed" });
    }
  };
}
