import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;        // e.g. "tutor_approved", "plan_changed", "user_registered"
  actor: string;         // "System" or admin/user name
  actorId?: string;      // user ID of who performed the action
  entity: string;        // "User" | "Booking" | "TutorProfile" | "Auth" | "GuaranteeClaim"
  targetId?: string;     // ID of the affected record
  targetName?: string;   // human-readable name (e.g. tutor's name)
  metadata?: Record<string, unknown>; // extra context (e.g. { from: "free", to: "premium" })
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action:     { type: String, required: true, index: true },
    actor:      { type: String, default: "System" },
    actorId:    { type: String },
    entity:     { type: String, required: true, index: true },
    targetId:   { type: String },
    targetName: { type: String },
    metadata:   { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt needed
  }
);

// Index for efficient filtering and sorting
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);