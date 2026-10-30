import { Router } from "express";
import { timingSafeEqual } from "crypto";
import { JOB_SCHEDULES, ScheduledJobName } from "../config/scheduledJobs";
import { runScheduledJob } from "../services/schedulerRuntime.service";
import express from "express";

export function createInternalJobsRouter(run = runScheduledJob): Router {
  const router = Router();
  router.use(express.json());
  router.post("/:name", async (req, res) => {
    const expected = process.env.INTERNAL_JOB_TOKEN || "";
    const supplied = req.get("X-Tutorera-Job-Token") || "";
    if (process.env.SCHEDULER_MODE !== "external" || expected.length < 32 ||
      Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      res.status(403).json({ success: false });
      return;
    }
    if (!JOB_SCHEDULES.some((job) => job.name === req.params.name)) {
      res.status(404).json({ success: false });
      return;
    }
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!reason) {
      res.status(400).json({ success: false, error: "reason is required for manual replay" });
      return;
    }
    const result = await run(req.params.name as ScheduledJobName, req.app.get("io"), {
      triggeredBy: "manual_replay",
      reason,
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, acquired: result.acquired });
  });
  return router;
}
