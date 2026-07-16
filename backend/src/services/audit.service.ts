import { prisma } from "@/database/client";
import { logger } from "@/utils/logger";

export interface AuditLogPayload {
  userId?: string;
  eventType: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod: string;
  requestPath: string;
  statusCode: number;
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export class AuditService {
  static async log(payload: AuditLogPayload): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId || null,
          eventType: payload.eventType,
          action: payload.action,
          entity: payload.entity,
          entityId: payload.entityId || null,
          ipAddress: payload.ipAddress || null,
          userAgent: payload.userAgent || null,
          requestMethod: payload.requestMethod,
          requestPath: payload.requestPath,
          statusCode: payload.statusCode,
          success: payload.success,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata: (payload.metadata as any) || null,
        },
      });
    } catch (error) {
      // Do not crash the application if secondary telemetry write fails
      logger.error(error as Error, "Audit logging failed to database write");
    }
  }
}
