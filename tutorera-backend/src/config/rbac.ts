// src/config/rbac.ts
// Granular Role-Based Access Control (RBAC) definitions for TUTORERA Admin

export type AdminRole =
  | "super_admin"
  | "marketplace_operations"
  | "student_success"
  | "tutor_operations"
  | "verification_officer"
  | "trust_and_safety"
  | "finance"
  | "support"
  | "growth"
  | "content"
  | "analyst";

export const ALL_PERMISSIONS = [
  // Tutors & Verification
  "tutor.read",
  "tutor.verify",
  "tutor.reject",
  "tutor.suspend",
  "tutor.quality_manage",

  // Students & Demand
  "student.read",
  "request.read",
  "request.extend",
  "request.rematch",
  "request.close",
  "request.escalate",

  // Marketplace & Matching
  "matching.read",
  "matching.configure",
  "matching.simulate",
  "bookings.read",
  "bookings.manage",

  // Finance & Governance
  "payment.read",
  "payment.refund",
  "payout.read",
  "payout.approve",
  "payout.process",
  "finance.reconcile",
  "finance.fee_configure",

  // Trust & Safety
  "safety.read",
  "safety.create",
  "safety.update",
  "safety.resolve",
  "claims.read",
  "claims.manage",

  // Growth & Communications
  "growth.read",
  "growth.manage",
  "broadcast.send",
  "analytics.read",

  // Global Markets
  "market.read",
  "market.configure",

  // System & Users
  "users.read",
  "users.manage",
  "roles.manage",
  "audit.read",
  "system.monitor",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number] | "*";

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ["*"],

  marketplace_operations: [
    "request.read",
    "request.extend",
    "request.rematch",
    "request.close",
    "request.escalate",
    "matching.read",
    "matching.configure",
    "matching.simulate",
    "bookings.read",
    "bookings.manage",
    "market.read",
    "market.configure",
    "analytics.read",
    "system.monitor",
  ],

  student_success: [
    "student.read",
    "request.read",
    "request.extend",
    "request.rematch",
    "request.close",
    "request.escalate",
    "bookings.read",
    "claims.read",
    "analytics.read",
  ],

  tutor_operations: [
    "tutor.read",
    "tutor.quality_manage",
    "tutor.verify",
    "tutor.reject",
    "tutor.suspend",
    "bookings.read",
    "analytics.read",
  ],

  verification_officer: [
    "tutor.read",
    "tutor.verify",
    "tutor.reject",
    "audit.read",
  ],

  trust_and_safety: [
    "safety.read",
    "safety.create",
    "safety.update",
    "safety.resolve",
    "claims.read",
    "claims.manage",
    "users.read",
    "tutor.suspend",
    "audit.read",
  ],

  finance: [
    "payment.read",
    "payment.refund",
    "payout.read",
    "payout.approve",
    "payout.process",
    "finance.reconcile",
    "finance.fee_configure",
    "bookings.read",
    "analytics.read",
  ],

  support: [
    "student.read",
    "tutor.read",
    "request.read",
    "bookings.read",
    "claims.read",
    "safety.create",
    "payment.read",
  ],

  growth: [
    "growth.read",
    "growth.manage",
    "broadcast.send",
    "analytics.read",
    "users.read",
  ],

  content: [
    "growth.read",
    "analytics.read",
  ],

  analyst: [
    "analytics.read",
    "request.read",
    "tutor.read",
    "student.read",
    "bookings.read",
    "payment.read",
    "matching.read",
    "growth.read",
    "market.read",
    "audit.read",
    "system.monitor",
  ],
};

/**
 * Validates if an admin role or custom permission list has the requested capability.
 */
export function hasPermission(
  adminRole?: string,
  userPermissions?: string[],
  requiredPermission?: Permission
): boolean {
  if (!requiredPermission) return true;

  // Super admin wildcard
  if (adminRole === "super_admin" || userPermissions?.includes("*")) {
    return true;
  }

  // Explicit user overrides
  if (userPermissions?.includes(requiredPermission)) {
    return true;
  }

  // Role-based permissions
  if (adminRole && (adminRole in ROLE_PERMISSIONS)) {
    const rolePerms = ROLE_PERMISSIONS[adminRole as AdminRole];
    if (rolePerms.includes("*") || rolePerms.includes(requiredPermission)) {
      return true;
    }
  }

  return false;
}
