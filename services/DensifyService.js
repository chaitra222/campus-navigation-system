// services/DensifyService.js
import { prisma } from "../prisma/client.js";

// --- geo helpers (good enough at campus scale) ---
function toRad(d){ return d*Math.PI/180; }
function haversine(a,b){
  const R=6371000, φ1=toRad(a.lat), φ2=toRad(b.lat), dφ=toRad(b.lat-a.lat), dλ=toRad(b.lng-a.lng);
  const s=Math.sin(dφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function segmentLength(coords){
  let L=0;
  for(let i=0;i<coords.length-1;i++) L+=haversine(coords[i],coords[i+1]);
  return L;
}
// Linear interpolation on small segments (OK for ~50 m spacing)
function lerp(a,b,t){ return { lat: a.lat + (b.lat-a.lat)*t, lng: a.lng + (b.lng-a.lng)*t }; }

/**
 * Given a polyline [{lat,lng},...], return a densified array that includes:
 * start, points every ~stepMeters, and the end.
 */
function densifyPolyline(poly, stepMeters){
  if (!poly || poly.length < 2) return poly || [];
  const out = [poly[0]];
  let cursor = 0;                 // index of current segment start
  let from = poly[0];
  let distToNext = haversine(from, poly[1]);
  let acc = 0;
  let remaining = distToNext;
  let i = 1;

  let traveledOnSeg = 0;

  while (i < poly.length) {
    if (remaining + acc >= stepMeters) {
      const need = stepMeters - acc; // how far from 'from' we need to move
      const t = need / remaining;    // fraction along current segment
      const p = lerp(from, poly[i], t);
      out.push(p);
      // reset accumulators from the new point
      from = p;
      remaining = haversine(from, poly[i]);
      acc = 0;
    } else {
      // advance to next vertex
      acc += remaining;
      from = poly[i];
      i++;
      if (i < poly.length) {
        remaining = haversine(from, poly[i]);
      }
    }
  }

  const last = poly[poly.length-1];
  const lastOut = out[out.length-1];
  if (haversine(lastOut, last) > 1) out.push(last);
  return out;
}

export class DensifyService {
  /**
   * For every active, non-densified edge with pathCoords,
   * create hidden virtual nodes every `stepMeters` along the shape,
   * replace the original edge by chaining small edges, and mark original inactive/densified.
   */
  static async densifyAll(stepMeters = 50) {
    // load candidate edges
    const edges = await prisma.edge.findMany({
      where: { isActive: true, isDensified: false },
      include: { from: true, to: true }
    });

    let processed = 0, createdNodes = 0, createdEdges = 0;

    for (const e of edges) {
      const poly = Array.isArray(e.pathCoords) && e.pathCoords.length >= 2
        ? e.pathCoords
        : [{lat: e.from.lat, lng: e.from.lng}, {lat: e.to.lat, lng: e.to.lng}];

      // make sure endpoints are exactly at Node positions
      const full = [{lat: e.from.lat, lng: e.from.lng}, ...poly.slice(1, -1), {lat: e.to.lat, lng: e.to.lng}];

      const dense = densifyPolyline(full, stepMeters);
      if (dense.length < 2) continue;

      // Build the list of vertices (start node id, virtual node ids..., end node id)
      const virtuals = [];

      // Create/ensure virtual nodes (skip the first and last because they are real nodes)
      for (let i=1; i<dense.length-1; i++) {
        const code = `V-${e.id}-${i}`; // unique code per edge/position
        const v = await prisma.node.upsert({
          where: { code },
          update: { lat: dense[i].lat, lng: dense[i].lng },
          create: {
            code,
            name: `V-${e.id}-${i}`,
            lat: dense[i].lat,
            lng: dense[i].lng,
            type: "virtual",
            isVirtual: true
          }
        });
        virtuals.push(v);
      }

      // Prepare chain of node ids: fromId -> v1 -> v2 -> ... -> toId
      const chainIds = [e.fromId, ...virtuals.map(v => v.id), e.toId];

      // Create new small edges along the chain
      for (let i=0; i<chainIds.length-1; i++) {
        const a = dense[i], b = dense[i+1];
        const L = haversine(a,b);
        await prisma.edge.create({
          data: {
            fromId: chainIds[i],
            toId: chainIds[i+1],
            lengthMeters: L,
            pathCoords: [a, b],         // small straight segment (good enough at 50 m)
            type: e.type,
            bidirectional: e.bidirectional,
            isIndoor: e.isIndoor,
            accessible: e.accessible,
            isActive: true,
            isDensified: true
          }
        });
        createdEdges++;
      }

      // deactivate the original coarse edge
      await prisma.edge.update({
        where: { id: e.id },
        data: { isActive: false, isDensified: true }
      });

      processed++;
      createdNodes += virtuals.length;
    }

    return { processedEdges: processed, createdVirtualNodes: createdNodes, createdEdges };
  }
}
