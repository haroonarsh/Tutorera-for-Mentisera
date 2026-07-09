import AuditLog from "../models/AuditLog.model";

interface AuditParams {
  action: string;
  actor?: string;        // defaults to "System"
  actorId?: string;
  entity: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event. Never throws — audit logging must never break
 * core functionality if it fails (e.g. DB connection issue).
 */
export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    await AuditLog.create({
      action:     params.action,
      actor:      params.actor || "System",
      actorId:    params.actorId,
      entity:     params.entity,
      targetId:   params.targetId,
      targetName: params.targetName,
      metadata:   params.metadata,
    });
  } catch (err) {
    // Log to console but never propagate — audit failures are non-critical
    console.error("[AuditLog] Failed to write audit log:", err);
  }
};