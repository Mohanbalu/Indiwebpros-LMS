import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/client";
import { NotFoundError } from "@/errors/custom-errors";
import { PermissionDeniedException } from "../errors/authorization-exceptions";
import { UserPolicy } from "../policies/user.policy";
import { AuthorizationService } from "../services/authorization.service";

export class UserGuard {
  static check(action: "read" | "create" | "update" | "delete") {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const targetUserId = (req.params.userId || req.params.id) as string;
        if (!targetUserId) {
          return next();
        }

        const user = (await prisma.user.findUnique({
          where: { id: targetUserId },
        })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!user) {
          throw new NotFoundError("User not found");
        }

        if (!req.user) {
          throw new PermissionDeniedException("User not authenticated");
        }

        const userId = req.user.userId;
        const role = req.user.role;

        let allowed = false;
        if (action === "read") {
          allowed = UserPolicy.canRead(userId, role, targetUserId);
        } else if (action === "create") {
          allowed = UserPolicy.canCreate(userId, role);
        } else if (action === "update") {
          allowed = UserPolicy.canUpdate(userId, role, targetUserId);
        } else if (action === "delete") {
          allowed = UserPolicy.canDelete(userId, role, targetUserId);
        }

        if (!allowed) {
          const userAgent = req.headers["user-agent"];
          const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
          await AuthorizationService.logViolation(
            userId,
            `USER_${action.toUpperCase()}_DENIED`,
            "User",
            targetUserId,
            req.ip,
            device,
            req.originalUrl,
            req.method
          );
          throw new PermissionDeniedException(`Access denied: Cannot ${action} user profile`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).targetUser = user;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
