import { IAuditService } from "../interfaces/audit-service.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
import { IMetricsService } from "../../shared/metrics.interface";
import { prisma } from "@/database/client";
import { logger } from "@/utils/logger";
import { ServiceContainer } from "../../shared/service-container";

export class DatabaseAuditProvider implements IAuditService, ILifecycleService, IHealthCheckService, IMetricsService {
  private logsCount = 0;

  async initialize(): Promise<void> {
    ServiceContainer.logger.info("DatabaseAuditProvider initialized");
  }

  private getEventTypeFromPayload(payload: Record<string, any>): string {
    if (payload.eventType && typeof payload.eventType === "string") {
      return payload.eventType;
    }
    
    const action = String(payload.action || "").toUpperCase();
    const entity = String(payload.entity || payload.resource || "").toUpperCase();

    if (action.includes("LOGIN") || action.includes("LOGOUT") || action.includes("PASSWORD") || action.includes("VERIFY") || action.includes("SECURITY")) {
      return "SECURITY";
    }
    
    if (entity.includes("COURSE") || entity.includes("MODULE") || entity.includes("LESSON") || action.startsWith("COURSE_") || action.startsWith("MODULE_") || action.startsWith("LESSON_")) {
      return "COURSE";
    }

    if (entity.includes("PAYMENT") || entity.includes("ENROLLMENT") || entity.includes("COUPON") || action.startsWith("ENROLLMENT_") || action.startsWith("PAYMENT_") || action.startsWith("COUPON_")) {
      return "PAYMENT";
    }

    if (entity.includes("QUIZ") || entity.includes("ASSIGNMENT") || action.startsWith("QUIZ_") || action.startsWith("ASSIGNMENT_")) {
      return "ASSESSMENT";
    }

    if (entity.includes("CERTIFICATE") || action.startsWith("CERTIFICATE_")) {
      return "CERTIFICATE";
    }

    if (entity.includes("NOTIFICATION") || action.startsWith("NOTIFICATION_")) {
      return "NOTIFICATION";
    }

    if (action.startsWith("ADMIN_") || action === "ADMIN") {
      return "ADMIN";
    }

    return "GENERAL";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async log(payload: Record<string, any>): Promise<void> {
    try {
      const derivedEventType = this.getEventTypeFromPayload(payload);
      const derivedAction = payload.action || "UNKNOWN";
      const derivedEntity = payload.entity || payload.resource || "System";
      const derivedEntityId = payload.entityId || payload.resourceId || null;
      const derivedSuccess = payload.success !== undefined 
        ? payload.success 
        : (payload.status !== undefined ? payload.status === "SUCCESS" : true);
      const derivedStatusCode = payload.statusCode || (derivedSuccess ? 200 : 400);
      const derivedMetadata = payload.metadata || payload.details || null;

      // Ensure userId is a valid UUID, otherwise default to null to prevent database driver constraint errors.
      const isUuid = (val: string) => {
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
      };
      const cleanUserId = (payload.userId && typeof payload.userId === "string" && isUuid(payload.userId))
        ? payload.userId
        : null;

      await prisma.auditLog.create({
        data: {
          userId: cleanUserId,
          eventType: derivedEventType,
          action: derivedAction,
          entity: derivedEntity,
          entityId: derivedEntityId,
          ipAddress: payload.ipAddress || null,
          userAgent: payload.userAgent || null,
          requestMethod: payload.requestMethod || "N/A",
          requestPath: payload.requestPath || "N/A",
          statusCode: derivedStatusCode,
          success: derivedSuccess,
          metadata: (derivedMetadata as any) || null,
        },
      });
      this.logsCount++;
    } catch (error) {
      logger.error(error as Error, "DatabaseAuditProvider log failed");
    }
  }

  async login(userId: string, status: boolean, ip?: string, ua?: string): Promise<void> {
    await this.log({
      userId,
      eventType: "SECURITY",
      action: status ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
      entity: "User",
      entityId: userId,
      ipAddress: ip,
      userAgent: ua,
      statusCode: status ? 200 : 401,
      success: status,
    });
  }

  async logout(userId: string, ip?: string, ua?: string): Promise<void> {
    await this.log({
      userId,
      eventType: "SECURITY",
      action: "LOGOUT",
      entity: "User",
      entityId: userId,
      ipAddress: ip,
      userAgent: ua,
      statusCode: 200,
      success: true,
    });
  }

  async passwordReset(userId: string, action: string, ip?: string, ua?: string): Promise<void> {
    await this.log({
      userId,
      eventType: "SECURITY",
      action: `PASSWORD_RESET_${action.toUpperCase()}`,
      entity: "User",
      entityId: userId,
      ipAddress: ip,
      userAgent: ua,
      statusCode: 200,
      success: true,
    });
  }

  async courseAction(userId: string, action: string, courseId: string, ip?: string, ua?: string): Promise<void> {
    await this.log({
      userId,
      eventType: "COURSE",
      action: action.toUpperCase(),
      entity: "Course",
      entityId: courseId,
      ipAddress: ip,
      userAgent: ua,
      statusCode: 200,
      success: true,
    });
  }

  async adminAction(userId: string, action: string, targetId?: string, ip?: string, ua?: string): Promise<void> {
    await this.log({
      userId,
      eventType: "ADMIN",
      action: action.toUpperCase(),
      entity: "System",
      entityId: targetId,
      ipAddress: ip,
      userAgent: ua,
      statusCode: 200,
      success: true,
    });
  }

  async securityEvent(eventType: string, action: string, userId?: string, ip?: string, ua?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      userId,
      eventType,
      action: action.toUpperCase(),
      entity: "Security",
      ipAddress: ip,
      userAgent: ua,
      statusCode: 400,
      success: false,
      metadata,
    });
  }

  async health(): Promise<HealthStatus> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        service: "audit-database",
        status: "healthy",
        latency: 0,
        message: "Database connection active",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: "audit-database",
        status: "unhealthy",
        latency: 0,
        message: `Database query failed: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async metrics(): Promise<Record<string, unknown>> {
    return { audit_logs_written: this.logsCount };
  }

  async resetMetrics(): Promise<void> {
    this.logsCount = 0;
  }

  async recordMetric(name: string, value: number): Promise<void> {
    if (name === "audit_logs_written") this.logsCount = value;
  }
}
