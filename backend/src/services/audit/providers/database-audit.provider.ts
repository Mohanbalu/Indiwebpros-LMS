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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async log(payload: Record<string, any>): Promise<void> {
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
          requestMethod: payload.requestMethod || "N/A",
          requestPath: payload.requestPath || "N/A",
          statusCode: payload.statusCode || 200,
          success: payload.success !== undefined ? payload.success : true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata: (payload.metadata as any) || null,
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
