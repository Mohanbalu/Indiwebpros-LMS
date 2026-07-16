import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError, UnauthorizedError, ForbiddenError } from "@/errors/custom-errors";
import { ResponseBuilder } from "@/utils/response-builder";
import { logger, securityLogger } from "@/utils/logger";
import { env } from "@/config/env";
import { ErrorTracker } from "@/modules/observability/services/error-tracker.service";
import { MetricsService } from "@/modules/observability/services/metrics.service";

// ─── Error Handler Middleware — Milestone 25 ──────────────────────────────────
// Enhanced with:
//  - Error classification via ErrorTracker
//  - Security event routing (401/403 → securityLogger)
//  - CloudWatch 5xx metric on error
//  - Sanitized production responses (no stack trace leakage)

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const ctx = {
    statusCode: undefined as number | undefined,
    method: req.method,
    path: req.path,
    requestId: req.id,
    correlationId: req.correlationId,
    traceId: req.traceId,
    userId: req.userId,
    ipAddress: req.ip || req.header("x-forwarded-for")?.split(",")[0]?.trim(),
  };

  // ── Zod Validation Error ───────────────────────────────────────────────────
  if (err instanceof z.ZodError) {
    const validationErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    ctx.statusCode = 400;
    ErrorTracker.track(err, ctx);
    MetricsService.increment("http.errors.4xx");
    ResponseBuilder.failure(res, 400, "Validation failed", validationErrors);
    return;
  }

  // ── Custom App Error ───────────────────────────────────────────────────────
  if (err instanceof AppError) {
    ctx.statusCode = err.statusCode;
    ErrorTracker.track(err, ctx);

    // Route security-relevant errors to security logger
    if (err instanceof UnauthorizedError) {
      securityLogger.warn({
        requestId: req.id,
        correlationId: req.correlationId,
        userId: req.userId,
        ipAddress: ctx.ipAddress,
        path: req.path,
        method: req.method,
      }, `[AUTH_FAILURE] ${err.message}`);
      MetricsService.recordAuthFailure("unauthorized");
    } else if (err instanceof ForbiddenError) {
      securityLogger.warn({
        requestId: req.id,
        correlationId: req.correlationId,
        userId: req.userId,
        path: req.path,
      }, `[RBAC_VIOLATION] ${err.message}`);
      MetricsService.recordSecurityEvent("rbac_violation");
    }

    // 5xx tracking
    if (err.statusCode >= 500) {
      MetricsService.increment("http.errors.5xx");
    } else {
      MetricsService.increment("http.errors.4xx");
    }

    ResponseBuilder.failure(res, err.statusCode, err.message, err.errors);
    return;
  }

  // ── Unhandled / Unknown Error ──────────────────────────────────────────────
  ctx.statusCode = 500;
  ErrorTracker.track(err, ctx);
  MetricsService.increment("http.errors.5xx");

  logger.error({
    requestId: req.id,
    correlationId: req.correlationId,
    traceId: req.traceId,
    userId: req.userId,
    path: req.path,
    method: req.method,
    errorName: err.name,
    // Stack only in non-production
    ...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  }, `[INTERNAL_ERROR] ${err.message}`);

  // NEVER expose internal error details in production
  const message =
    env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  ResponseBuilder.failure(res, 500, message);
}
