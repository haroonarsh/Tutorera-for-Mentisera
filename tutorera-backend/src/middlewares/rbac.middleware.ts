// src/middlewares/rbac.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { hasPermission, Permission, AdminRole } from "../config/rbac";
import logger from "../config/logger";

const VALID_ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "marketplace_operations",
  "student_success",
  "tutor_operations",
  "verification_officer",
  "trust_and_safety",
  "finance",
  "support",
  "growth",
  "content",
  "analyst",
  "country_admin",
];

/**
 * Middleware enforcing granular RBAC permissions.
 * Gracefully treats legacy role="admin" users as super_admin only when adminRole is absent.
 * Rejects requests with an invalid adminRole value.
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access forbidden: administrative privileges required",
      });
      return;
    }

    // Gracefully treat legacy role="admin" users as super_admin when adminRole is absent
    const effectiveAdminRole: AdminRole = (req.user.adminRole as AdminRole) || "super_admin";

    // Reject explicitly invalid adminRole values (prevents privilege escalation)
    if (!VALID_ADMIN_ROLES.includes(effectiveAdminRole)) {
      logger.warn(
        { userId: req.user._id, adminRole: req.user.adminRole, path: req.originalUrl },
        "RBAC: rejected request with unknown adminRole"
      );
      res.status(403).json({
        success: false,
        code: "INVALID_ADMIN_ROLE",
        message: "Your administrative role is not recognized. Contact your system administrator to assign you a role.",
      });
      return;
    }

    const userPerms = req.user.adminPermissions || [];

    if (!hasPermission(effectiveAdminRole, userPerms, permission)) {
      logger.warn(
        {
          userId: req.user._id,
          role: effectiveAdminRole,
          required: permission,
          path: req.originalUrl,
        },
        "RBAC Permission Denied"
      );
      res.status(403).json({
        success: false,
        code: "PERMISSION_DENIED",
        message: `Your administrative role '${effectiveAdminRole}' does not possess '${permission}' permission.`,
      });
      return;
    }

    next();
  };
};
