import { Response } from "express";
import { AuthRequest } from "../types";
import { hasPermission, AdminRole } from "../config/rbac";
import { ADMIN_AGENT_REGISTRY, planAdminAgentTasks } from "../services/adminAgentSupervisor.service";

function permitted(req: AuthRequest, permission: Parameters<typeof hasPermission>[2]): boolean {
  const role = req.user?.adminRole || "super_admin";
  const valid: AdminRole[] = ["super_admin", "marketplace_operations", "student_success", "tutor_operations", "verification_officer", "trust_and_safety", "finance", "support", "growth", "content", "analyst", "country_admin"];
  return valid.includes(role as AdminRole) && hasPermission(role as AdminRole, req.user?.adminPermissions || [], permission);
}

/** Planning only: does not execute tools or expose customer data to a model. */
export const planAdminSupervisor = (req: AuthRequest, res: Response): void => {
  const message = req.body?.message;
  if (typeof message !== "string" || !message.trim() || message.length > 1000) {
    res.status(400).json({ success: false, message: "A message of 1–1000 characters is required." });
    return;
  }
  const planned = planAdminAgentTasks(message);
  const tasks = planned.filter(task => permitted(req, task.permission));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    success: true,
    mode: "read-only-planning",
    tasks,
    blockedCount: planned.length - tasks.length,
    message: tasks.length ? "Authorized agent tasks prepared. Execution is not enabled." : "No authorized agent tasks match this request.",
  });
};

export const listAdminAgents = (req: AuthRequest, res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, mode: "read-only-planning", agents: ADMIN_AGENT_REGISTRY.filter(task => permitted(req, task.permission)) });
};
