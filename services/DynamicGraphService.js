// services/DynamicGraphService.js
import { polylineLengthMeters } from "./RouteService.js"; // we'll provide this helper below

/**
 * Build an in-memory graph from DB edges.
 * IMPORTANT: uses edge.pathCoords EXACTLY as stored.
 */
export async function buildGraph(prisma) {
  // load nodes & edges
  const [nodes, edges] = await Promise.all([
    prisma.node.findMany(),
    prisma.edge.findMany({
      include: { from: true, to: true } // assumes relation fields "from"/"to"
    })
  ]);

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const graph = {
    nodes,
    nodeById,
    edges: [],          // directed edges
    out: new Map(),     // adjacency: nodeId -> edges array
  };

  function addAdj(fromId, edge) {
    if (!graph.out.has(fromId)) graph.out.set(fromId, []);
    graph.out.get(fromId).push(edge);
  }

  for (const e of edges) {
    // 1) take pathCoords exactly, or fallback to straight line if missing
    const shape = (Array.isArray(e.pathCoords) && e.pathCoords.length >= 2)
      ? e.pathCoords.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }))
      : [
          { lat: e.from.lat, lng: e.from.lng },
          { lat: e.to.lat,   lng: e.to.lng   }
        ];

    const lengthMeters = e.lengthMeters ?? polylineLengthMeters(shape);

    // forward edge (from -> to)
    const fwd = {
      id: e.id,
      fromId: e.fromId,
      toId: e.toId,
      type: e.type,
      accessible: e.accessible,
      shape,
      lengthMeters
    };
    graph.edges.push(fwd);
    addAdj(e.fromId, fwd);

    // optional reverse edge with REVERSED SHAPE
    if (e.bidirectional) {
      const rev = {
        id: e.id + ":rev",         // synthetic id
        fromId: e.toId,
        toId: e.fromId,
        type: e.type,
        accessible: e.accessible,
        shape: [...shape].reverse(),
        lengthMeters
      };
      graph.edges.push(rev);
      addAdj(e.toId, rev);
    }
  }

  return graph;
}
