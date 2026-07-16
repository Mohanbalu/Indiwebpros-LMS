/**
 * Structured Request Logger Middleware — Milestone 25
 * Replaces basic pino-http wrapper with a rich structured log on every response.
 *
 * Logs on response finish (not request start) to capture full context including
 * status code, duration, and response size.
 *
 * Log shape:
 * {
 *   level: "info",
 *   timestamp: "2026-07-14T10:00:00Z",
 *   requestId: "uuid",
 *   correlationId: "uuid",
 *   traceId: "32-hex-chars",
 *   userId: "user-123",
 *   method: "POST",
 *   path: "/api/v1/purchases",
 *   statusCode: 201,
 *   durationMs: 145,
 *   requestSize: 512,
 *   responseSize: 1024,
 *   ipAddress: "1.2.3.4",
 *   userAgent: "Mozilla/5.0"
 * }
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";

// Paths to suppress from verbose logging (health probes cause log noise)
const SILENT_PATHS = ["/health", "/health/live", "/health/ready", "/health/startup"];

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();
  const requestSize = parseInt(req.header("content-length") ?? "0", 10);

  res.on("finish", () => {
    // Skip health probes to avoid log noise
    if (SILENT_PATHS.some((p) => req.path === p)) {
      return;
    }

    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Math.round(Number(durationNs) / 1_000_000);
    const responseSize = parseInt(res.getHeader("content-length") as string ?? "0", 10);

    const logPayload = {
      requestId: req.id,
      correlationId: req.correlationId,
      traceId: req.traceId,
      userId: req.userId,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      statusCode: res.statusCode,
      durationMs,
      requestSize,
      responseSize: responseSize || undefined,
      ipAddress: req.ip || req.header("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: req.header("user-agent"),
    };

    // Choose log level by status code
    if (res.statusCode >= 500) {
      logger.error(logPayload, `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
    } else if (res.statusCode >= 400) {
      logger.warn(logPayload, `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
    } else {
      logger.info(logPayload, `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
    }
  });

  next();
}
