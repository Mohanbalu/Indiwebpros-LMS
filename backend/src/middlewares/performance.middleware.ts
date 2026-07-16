/**
 * Performance Middleware — Milestone 25
 * Measures request duration, records to MetricsService, and exposes X-Response-Time header.
 *
 * Uses process.hrtime.bigint() for nanosecond precision.
 * Records to histogram: http.response_time_ms
 */

import { Request, Response, NextFunction } from "express";
import { MetricsService } from "@/modules/observability/services/metrics.service";

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // High-resolution start time in nanoseconds
  req.startTime = process.hrtime.bigint();

  // Intercept writeHead to set the x-response-time header before bytes are sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function (statusCode: number, ...args: any[]) {
    if (req.startTime && !res.headersSent) {
      const durationNs = process.hrtime.bigint() - req.startTime;
      const durationMs = Math.round(Number(durationNs) / 1_000_000);
      res.setHeader("x-response-time", `${durationMs}ms`);
    }
    return originalWriteHead.apply(this, [statusCode, ...args] as any);
  };

  // Hook into response finish event to record metrics
  res.on("finish", () => {
    if (!req.startTime) return;

    const endTime = process.hrtime.bigint();
    const durationNs = endTime - req.startTime;
    const durationMs = Math.round(Number(durationNs) / 1_000_000);

    // Record in metrics service
    MetricsService.recordRequest(
      req.method,
      res.statusCode,
      durationMs,
      req.path
    );
  });

  next();
}

/**
 * Helper: get elapsed milliseconds from request start.
 * Use in controllers to measure sub-operation latency.
 */
export function getElapsedMs(req: Request): number {
  if (!req.startTime) return 0;
  const durationNs = process.hrtime.bigint() - req.startTime;
  return Math.round(Number(durationNs) / 1_000_000);
}
