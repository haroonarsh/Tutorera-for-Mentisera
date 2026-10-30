import { Router } from "express";
import mongoose from "mongoose";

/** Readiness checks MongoDB, not simply whether the HTTP port is open. */
export function createHealthRouter(checkDatabase: () => Promise<boolean> = async () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return false;
  await mongoose.connection.db.command({ ping: 1, maxTimeMS: 750 }, { timeoutMS: 1000 });
  return true;
}): Router {
  const router = Router();
  router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
  router.get("/live", (_req, res) => { res.json({ status: "alive" }); });
  router.get(["/", "/ready"], async (_req, res) => {
    try {
      const ready = await checkDatabase();
      res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  return router;
}
