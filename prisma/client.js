// prisma/client.js  (ESM)
import { PrismaClient } from "@prisma/client";

// Reuse a single client in dev to avoid "too many connections"/hot-reload issues
export const prisma = globalThis.__prisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
export default prisma;