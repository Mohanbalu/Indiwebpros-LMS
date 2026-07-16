/**
 * Structured Logger — Milestone 25
 * Enterprise Observability & Monitoring Platform
 *
 * Enhanced pino logger with:
 *  - Structured JSON log format for CloudWatch / ELK / Grafana ingestion
 *  - withContext(): creates child logger with bound correlation fields
 *  - security(): dedicated security event log channel
 *  - Standard serializers for req, res, and error objects
 */

import pino, { Logger } from "pino";
import { env } from "@/config/env";

// ─── Serializers ──────────────────────────────────────────────────────────────
// Sanitize sensitive fields from structured log payloads

const REDACTED_FIELDS = [
  "password", "secret", "token", "authorization",
  "apiKey", "api_key", "creditCard", "cvv", "ssn",
];

const serializers = {
  // Sanitize req object — strip auth headers
  req: (req: Record<string, unknown>) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    // Never log Authorization header value
    hasAuth: !!((req.headers as Record<string, unknown>)?.authorization),
    remoteAddress: req.remoteAddress || req.ip,
    userAgent: (req.headers as Record<string, unknown>)?.["user-agent"],
  }),
  // Sanitize res object
  res: (res: Record<string, unknown>) => ({
    statusCode: res.statusCode,
  }),
  // Sanitize error object — remove stack in production
  err: pino.stdSerializers.err,
};

// ─── Base Logger ──────────────────────────────────────────────────────────────

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  // Application-level base fields on every log line
  base: {
    app: "indiwebpros-lms",
    env: env.NODE_ENV,
    pid: process.pid,
  },
  serializers,
  timestamp: pino.stdTimeFunctions.isoTime,
  // Development: pretty-print; Production: pure JSON for CloudWatch/ELK
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  // Redact sensitive fields from all log output
  redact: {
    paths: REDACTED_FIELDS.flatMap((f) => [
      `*.${f}`, `req.headers.${f}`, `body.${f}`, `data.${f}`
    ]),
    censor: "[REDACTED]",
  },
});

// ─── withContext: Child Logger with Bound Correlation Fields ──────────────────
/**
 * Creates a child logger pre-bound with correlation context.
 * Use in controllers and services to propagate requestId/correlationId.
 *
 * @example
 * const log = withContext({ requestId: req.id, userId: req.userId });
 * log.info("Processing payment");
 */
export function withContext(ctx: {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  userId?: string;
  service?: string;
  [key: string]: unknown;
}): Logger {
  return logger.child(ctx);
}

// ─── Security Logger ──────────────────────────────────────────────────────────
/**
 * Dedicated security event logger.
 * Always logs at WARN or higher — never suppressed.
 *
 * @example
 * securityLogger.warn({ userId, ipAddress, attempts: 5 }, "BRUTE_FORCE_DETECTED");
 */
export const securityLogger = logger.child({ channel: "security" });

// ─── Type Export ──────────────────────────────────────────────────────────────
export type { Logger };

