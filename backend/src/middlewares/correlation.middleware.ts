/**
 * Correlation Middleware — Milestone 25
 * Generates and propagates:
 *   - requestId:     Unique per-request identifier
 *   - correlationId: Spans multiple services/calls (client-supplied or generated)
 *   - traceId:       Distributed trace identifier (OpenTelemetry-ready)
 *
 * Attaches to req object and sets response headers.
 * Injects into child logger for structured log correlation.
 */

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// ─── Type Augmentation ────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;              // Existing
      correlationId?: string;   // NEW: spans multiple service calls
      traceId?: string;         // NEW: OpenTelemetry-ready trace span
      startTime?: bigint;       // NEW: high-resolution timer (nanoseconds)
      userId?: string;          // Set by auth middleware, used in logging
    }
  }
}

// ─── Correlation Middleware ───────────────────────────────────────────────────

export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Request ID: use client-provided or generate new
  const requestId =
    req.header("x-request-id") ||
    req.header("x-correlation-id") ||
    randomUUID();

  // Correlation ID: for tracing a request across multiple services/calls
  // Client may supply this (e.g. from a frontend tracing library)
  const correlationId =
    req.header("x-correlation-id") ||
    req.header("x-b3-traceid") ||   // B3 format (Zipkin)
    randomUUID();

  // Trace ID: OpenTelemetry W3C trace context format
  // Format: 32 hex chars (128-bit)
  const traceId =
    req.header("traceparent")?.split("-")[1] || // W3C traceparent header
    randomUUID().replace(/-/g, "");              // Fallback: 32-char hex

  // Attach to request object
  req.id = requestId;
  req.correlationId = correlationId;
  req.traceId = traceId;

  // Propagate to response headers (enables client-side correlation)
  res.setHeader("x-request-id", requestId);
  res.setHeader("x-correlation-id", correlationId);
  res.setHeader("x-trace-id", traceId);

  // OpenTelemetry W3C traceparent response header
  // Format: version-traceid-parentid-flags
  const parentId = randomUUID().replace(/-/g, "").slice(0, 16);
  res.setHeader("traceparent", `00-${traceId}-${parentId}-01`);

  next();
}
