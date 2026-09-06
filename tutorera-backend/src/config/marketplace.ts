// src/config/marketplace.ts
// Centralized configuration for TUTORERA Tuition Request Expiry, Archival & Retention Engine

export const MARKETPLACE_REQUEST_EXPIRY_DAYS = parseInt(process.env.MARKETPLACE_REQUEST_EXPIRY_DAYS || "7", 10);
export const MAX_REQUEST_EXTENSIONS = parseInt(process.env.MAX_REQUEST_EXTENSIONS || "2", 10);
export const REQUEST_EXTENSION_DAYS = parseInt(process.env.REQUEST_EXTENSION_DAYS || "7", 10);
export const NEGOTIATION_GRACE_HOURS = parseInt(process.env.NEGOTIATION_GRACE_HOURS || "24", 10);
export const EXPIRY_WARNING_HOURS = parseInt(process.env.EXPIRY_WARNING_HOURS || "24", 10);
export const DAY_5_INTERVENTION_HOURS = parseInt(process.env.DAY_5_INTERVENTION_HOURS || "48", 10);
export const ARCHIVE_INACTIVE_DAYS = parseInt(process.env.ARCHIVE_INACTIVE_DAYS || "30", 10);
export const ABANDONED_DRAFT_RETENTION_DAYS = parseInt(process.env.ABANDONED_DRAFT_RETENTION_DAYS || "30", 10);
export const REQUEST_EXPIRY_ENABLED = process.env.REQUEST_EXPIRY_ENABLED !== "false";

export const ACTIVE_REQUEST_STATUSES = [
  "open",
  "published",
  "receiving_offers",
  "negotiating",
] as const;

export const NON_EXPIRABLE_STATUSES = [
  "offer_accepted",
  "awaiting_payment",
  "booked",
  "in_progress",
  "completed",
  "disputed",
] as const;
