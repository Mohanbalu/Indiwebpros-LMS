/**
 * Error Tracker Service — Milestone 25
 * Centralized error collector with classification, correlation, and CloudWatch integration.
 *
 * Never throws — always non-critical path.
 * Sanitizes sensitive data before logging.
 */

import { logger } from "@/utils/logger";
import { CloudWatchMetrics } from "@/utils/cloudwatch-metrics";
import { MetricsService } from "./metrics.service";
import { env } from "@/config/env";

// ─── Error Classification ─────────────────────────────────────────────────────

export type ErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "database"
  | "external_service"
  | "payment"
  | "storage"
  | "email"
  | "internal_server"
  | "not_found"
  | "rate_limit"
  | "unknown";

// ─── Error Event ──────────────────────────────────────────────────────────────

export interface ErrorEvent {
  // Identity
  errorId: string;
  category: ErrorCategory;
  timestamp: string;
  // Error details
  message: string;
  stack?: string;        // Only in development
  name: string;
  // HTTP context
  statusCode?: number;
  method?: string;
  path?: string;
  // Correlation
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  // User context
  userId?: string;
  ipAddress?: string;
  // Application context
  environment: string;
  version: string;
}

// ─── Sensitive Field Sanitizer ────────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /api[_-]?key/i,
  /credit[_-]?card/i,
  /cvv/i,
  /ssn/i,
];

function sanitizeMessage(message: string): string {
  // Remove potential secret values from error messages
  return message.replace(
    /(password|secret|token|key)\s*[:=]\s*\S+/gi,
    "$1: [REDACTED]"
  );
}

// ─── Error Classifier ─────────────────────────────────────────────────────────

export function classifyError(err: Error, statusCode?: number): ErrorCategory {
  const msg = err.message.toLowerCase();
  const name = err.name.toLowerCase();

  // Status code based
  if (statusCode === 400) return "validation";
  if (statusCode === 401) return "authentication";
  if (statusCode === 403) return "authorization";
  if (statusCode === 404) return "not_found";
  if (statusCode === 429) return "rate_limit";

  // Name based
  if (name.includes("validation") || name.includes("zod")) return "validation";
  if (name.includes("unauthorized") || name.includes("jwt") || name.includes("token")) return "authentication";
  if (name.includes("forbidden") || name.includes("rbac")) return "authorization";
  if (name.includes("payment") || name.includes("razorpay") || name.includes("stripe")) return "payment";
  if (name.includes("storage") || name.includes("s3")) return "storage";
  if (name.includes("email") || name.includes("ses") || name.includes("smtp")) return "email";
  if (name.includes("database") || name.includes("prisma")) return "database";

  // Message based
  if (msg.includes("prisma") || msg.includes("database") || msg.includes("query") || msg.includes("constraint")) return "database";
  if (msg.includes("s3") || msg.includes("storage") || msg.includes("bucket")) return "storage";
  if (msg.includes("payment") || msg.includes("razorpay") || msg.includes("signature")) return "payment";
  if (msg.includes("email") || msg.includes("ses") || msg.includes("smtp")) return "email";
  if (msg.includes("unauthorized") || msg.includes("invalid token") || msg.includes("expired")) return "authentication";
  if (msg.includes("forbidden") || msg.includes("permission")) return "authorization";
  if (msg.includes("timeout") || msg.includes("network") || msg.includes("econnrefused")) return "external_service";

  if (statusCode && statusCode >= 500) return "internal_server";

  return "unknown";
}

// ─── Error Tracker Service (Singleton) ───────────────────────────────────────

class ErrorTrackerClass {
  // In-memory ring buffer of recent errors (last 100)
  private readonly MAX_BUFFER = 100;
  private recentErrors: ErrorEvent[] = [];
  private readonly version = env.npm_package_version || "1.0.0";

  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ─── Main Track Method ────────────────────────────────────────────────────

  track(
    err: Error,
    ctx: {
      statusCode?: number;
      method?: string;
      path?: string;
      requestId?: string;
      correlationId?: string;
      traceId?: string;
      userId?: string;
      ipAddress?: string;
    } = {}
  ): ErrorEvent {
    try {
      const category = classifyError(err, ctx.statusCode);
      const errorId = this.generateErrorId();

      const event: ErrorEvent = {
        errorId,
        category,
        timestamp: new Date().toISOString(),
        message: sanitizeMessage(err.message),
        // Only include stack in non-production for security
        stack: env.NODE_ENV !== "production" ? err.stack : undefined,
        name: err.name,
        statusCode: ctx.statusCode,
        method: ctx.method,
        path: ctx.path,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        traceId: ctx.traceId,
        userId: ctx.userId,
        ipAddress: ctx.ipAddress,
        environment: env.NODE_ENV,
        version: this.version,
      };

      // Log with appropriate level
      this.logEvent(event);

      // Track in metrics
      this.trackMetrics(event);

      // CloudWatch for 5xx errors
      if (ctx.statusCode && ctx.statusCode >= 500) {
        CloudWatchMetrics.serverError(ctx.path || "unknown", ctx.statusCode).catch(() => {});
      }

      // Add to ring buffer
      this.recentErrors.push(event);
      if (this.recentErrors.length > this.MAX_BUFFER) {
        this.recentErrors.shift();
      }

      return event;
    } catch {
      // ErrorTracker must never throw
      return {
        errorId: "error-tracker-failure",
        category: "unknown",
        timestamp: new Date().toISOString(),
        message: err.message,
        name: err.name,
        environment: env.NODE_ENV,
        version: this.version,
      };
    }
  }

  // ─── Track Security Events ────────────────────────────────────────────────

  trackSecurity(
    event: string,
    ctx: {
      requestId?: string;
      userId?: string;
      ipAddress?: string;
      path?: string;
      details?: Record<string, unknown>;
    } = {}
  ): void {
    MetricsService.recordSecurityEvent(event);

    const logData = {
      securityEvent: event,
      requestId: ctx.requestId,
      userId: ctx.userId,
      ipAddress: ctx.ipAddress,
      path: ctx.path,
      details: ctx.details,
      timestamp: new Date().toISOString(),
    };

    // Security events always go to WARN or ERROR level
    if (event.includes("brute") || event.includes("injection") || event.includes("compromise")) {
      logger.error(logData, `[SECURITY] Critical security event: ${event}`);
    } else {
      logger.warn(logData, `[SECURITY] Security event: ${event}`);
    }

    CloudWatchMetrics.custom("SecurityEvents", 1, "Count", { EventType: event }).catch(() => {});
  }

  // ─── Get Recent Errors (for /metrics endpoint) ────────────────────────────

  getRecent(limit = 10): ErrorEvent[] {
    return this.recentErrors.slice(-limit);
  }

  getCountByCategory(): Record<ErrorCategory, number> {
    const counts = {} as Record<ErrorCategory, number>;
    for (const event of this.recentErrors) {
      counts[event.category] = (counts[event.category] ?? 0) + 1;
    }
    return counts;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private logEvent(event: ErrorEvent): void {
    const logPayload = {
      errorId: event.errorId,
      category: event.category,
      requestId: event.requestId,
      correlationId: event.correlationId,
      userId: event.userId,
      path: event.path,
      method: event.method,
      statusCode: event.statusCode,
      // Never log stack in production
      ...(event.stack ? { stack: event.stack } : {}),
    };

    if (event.category === "authentication" || event.category === "authorization") {
      logger.warn({ ...logPayload, securityRelevant: true }, `[${event.category.toUpperCase()}] ${event.message}`);
    } else if (event.category === "validation" || event.category === "not_found") {
      logger.warn(logPayload, `[${event.category.toUpperCase()}] ${event.message}`);
    } else {
      logger.error(logPayload, `[${event.category.toUpperCase()}] ${event.message}`);
    }
  }

  private trackMetrics(event: ErrorEvent): void {
    MetricsService.increment(`errors.${event.category}`);

    if (event.category === "authentication") MetricsService.recordAuthFailure("tracked");
    if (event.category === "payment") MetricsService.recordPaymentFailure("tracked");
    if (event.category === "authorization") MetricsService.recordSecurityEvent("rbac_violation");
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const ErrorTracker = new ErrorTrackerClass();
