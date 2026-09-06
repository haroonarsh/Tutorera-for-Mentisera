// src/middlewares/rbac.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { hasPermission, Permission } from "../config/rbac";
import logger from "../config/logger";

/**
 * Middleware enforcing granular RBAC permissions.
 * Gracefully treats legacy role="admin" users as super_admin.
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

    // Default legacy admin to super_admin
    const effectiveAdminRole = req.user.adminRole || "super_admin";
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
