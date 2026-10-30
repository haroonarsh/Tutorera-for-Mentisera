import mongoose from "mongoose";
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
 * Log an audit event. When called without a session, errors are swallowed so
 * audit logging never breaks core functionality. When called with a session the
 * write participates in the caller's transaction and errors propagate so the
 * transaction can roll back — the caller owns the invariant guarantee.
 */
export const logAudit = async (params: AuditParams, session?: mongoose.ClientSession): Promise<void> => {
  const doc = [{
    action:     params.action,
    actor:      params.actor || "System",
    actorId:    params.actorId,
    entity:     params.entity,
    targetId:   params.targetId,
    targetName: params.targetName,
    metadata:   params.metadata,
  }];
  if (session) {
    await AuditLog.create(doc, { session });
  } else {
    try {
      await AuditLog.create(doc);
    } catch (err) {
      console.error("[AuditLog] Failed to write audit log:", err);
    }
  }
};