import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/client";
import { NotFoundError } from "@/errors/custom-errors";
import { PermissionDeniedException } from "../errors/authorization-exceptions";
import { CertificatePolicy } from "../policies/certificate.policy";
import { AuthorizationService } from "../services/authorization.service";

export class CertificateGuard {
  static check(action: "read" | "create" | "update" | "delete") {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const certificateId = (req.params.certificateId || req.params.id) as string;
        if (!certificateId) {
          return next();
        }

        const certificate = (await prisma.certificate.findUnique({
          where: { id: certificateId },
        })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!certificate) {
          throw new NotFoundError("Certificate not found");
        }

        if (!req.user) {
          throw new PermissionDeniedException("User not authenticated");
        }

        const userId = req.user.userId;
        const role = req.user.role;
        const studentId = certificate.userId;

        let allowed = false;
        if (action === "read") {
          allowed = CertificatePolicy.canRead(userId, role, studentId);
        } else if (action === "create") {
          allowed = CertificatePolicy.canCreate(userId, role, studentId);
        } else if (action === "update") {
          allowed = CertificatePolicy.canUpdate(userId, role);
        } else if (action === "delete") {
          allowed = CertificatePolicy.canDelete(userId, role);
        }

        if (!allowed) {
          const userAgent = req.headers["user-agent"];
          const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
          await AuthorizationService.logViolation(
            userId,
            `CERTIFICATE_${action.toUpperCase()}_DENIED`,
            "Certificate",
            certificateId,
            req.ip,
            device,
            req.originalUrl,
            req.method
          );
          throw new PermissionDeniedException(`Access denied: Cannot ${action} certificate`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).certificate = certificate;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
