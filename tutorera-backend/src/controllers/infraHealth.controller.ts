// src/controllers/infraHealth.controller.ts
//
// Thin controller that exposes the infrastructure probe report via a
// dedicated endpoint callable by the operations agent or monitoring tools.

import { Response } from "express";
import { AuthRequest as Request } from "../types";
import { runInfrastructureProbes } from "../services/infrastructureProbe.service";
import logger from "../config/logger";

export async function getInfrastructureHealth(req: Request, res: Response): Promise<void> {
  try {
    const report = await runInfrastructureProbes();
    const status = report.overallStatus === "healthy" ? 200 : 503;
    res.status(status).json(report);
  } catch (err) {
    logger.error({ err }, "[InfraHealth] probe run failed unexpectedly");
    res.status(500).json({ error: "Infrastructure health check failed" });
  }
}
