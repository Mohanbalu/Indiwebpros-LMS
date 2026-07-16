import { Request, Response, NextFunction } from "express";
import { Permission } from "../constants/permissions";
import { AuthorizationService } from "../services/authorization.service";
import { PermissionDeniedException } from "../errors/authorization-exceptions";

const authService = new AuthorizationService();

export function requireRole(requiredRole: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new PermissionDeniedException("User not authenticated");
      }

      if (!authService.hasRole(req.user.role, requiredRole)) {
        const userAgent = req.headers["user-agent"];
        const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
        await AuthorizationService.logViolation(
          req.user.userId,
          `ROLE_${requiredRole.toUpperCase()}_DENIED`,
          "Role",
          undefined,
          req.ip,
          device,
          req.originalUrl,
          req.method
        );
        throw new PermissionDeniedException(`Role [${requiredRole}] required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(permission: Permission) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new PermissionDeniedException("User not authenticated");
      }

      if (!authService.hasPermission(req.user.role, permission)) {
        const userAgent = req.headers["user-agent"];
        const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
        await AuthorizationService.logViolation(
          req.user.userId,
          `PERMISSION_${permission}_DENIED`,
          "Permission",
          undefined,
          req.ip,
          device,
          req.originalUrl,
          req.method
        );
        throw new PermissionDeniedException(`Permission [${permission}] required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAllPermissions(permissions: Permission[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new PermissionDeniedException("User not authenticated");
      }

      for (const permission of permissions) {
        if (!authService.hasPermission(req.user.role, permission)) {
          const userAgent = req.headers["user-agent"];
          const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
          await AuthorizationService.logViolation(
            req.user.userId,
            `PERMISSION_ALL_${permission}_DENIED`,
            "Permission",
            undefined,
            req.ip,
            device,
            req.originalUrl,
            req.method
          );
          throw new PermissionDeniedException(`All required permissions [${permissions.join(", ")}] not satisfied`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new PermissionDeniedException("User not authenticated");
      }

      let hasAny = false;
      for (const permission of permissions) {
        if (authService.hasPermission(req.user.role, permission)) {
          hasAny = true;
          break;
        }
      }

      if (!hasAny) {
        const userAgent = req.headers["user-agent"];
        const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
        await AuthorizationService.logViolation(
          req.user.userId,
          `PERMISSION_ANY_DENIED`,
          "Permission",
          undefined,
          req.ip,
          device,
          req.originalUrl,
          req.method
        );
        throw new PermissionDeniedException(`At least one permission from [${permissions.join(", ")}] is required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
