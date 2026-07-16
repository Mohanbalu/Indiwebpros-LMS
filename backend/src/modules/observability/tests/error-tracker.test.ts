/**
 * Error Tracker Tests — Milestone 25
 */

import { ErrorTracker, classifyError } from "../services/error-tracker.service";
import { AppError, UnauthorizedError, ForbiddenError, NotFoundError } from "@/errors/custom-errors";
import { z } from "zod";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  } else {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  }
}

// ── Test 1: Error Classification ──────────────────────────────────────────────

function testClassification() {
  console.log("\n── Error Classification ──");

  assert(classifyError(new ZodErrorMock("validation error"), 400) === "validation", "400 status -> validation");
  assert(classifyError(new UnauthorizedError("login failed"), 401) === "authentication", "401 status -> authentication");
  assert(classifyError(new ForbiddenError("no permission"), 403) === "authorization", "403 status -> authorization");
  assert(classifyError(new NotFoundError("not found"), 404) === "not_found", "404 status -> not_found");
  assert(classifyError(new Error("rate limit"), 429) === "rate_limit", "429 status -> rate_limit");

  assert(classifyError(new Error("Prisma client failed")) === "database", "Prisma in message -> database");
  assert(classifyError(new Error("connect ECONNREFUSED")) === "external_service", "ECONNREFUSED -> external_service");
  assert(classifyError(new Error("unhandled error"), 500) === "internal_server", "500 status -> internal_server");
}

class ZodErrorMock extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ZodError";
  }
}

// ── Test 2: Error Event Creation & Ring Buffer ───────────────────────────────

function testErrorTracking() {
  console.log("\n── Error Tracking & Ring Buffer ──");

  const err = new Error("Database query timeout");
  const ctx = {
    statusCode: 500,
    method: "POST",
    path: "/api/v1/courses",
    requestId: "req-123",
    correlationId: "corr-123",
    traceId: "trace-123",
    userId: "user-123",
    ipAddress: "127.0.0.1",
  };

  const event = ErrorTracker.track(err, ctx);

  assert(event.errorId.startsWith("err_"), "Generates error ID starting with err_");
  assert(event.category === "database", "Classifies query timeout as database error");
  assert(event.message === "Database query timeout", "Extracts error message");
  assert(event.method === "POST", "Captures HTTP method");
  assert(event.path === "/api/v1/courses", "Captures HTTP path");
  assert(event.requestId === "req-123", "Captures Request ID");
  assert(event.correlationId === "corr-123", "Captures Correlation ID");
  assert(event.traceId === "trace-123", "Captures Trace ID");
  assert(event.userId === "user-123", "Captures User ID");

  // Verify ring buffer contains the event
  const recent = ErrorTracker.getRecent(5);
  assert(recent.some(e => e.errorId === event.errorId), "Event exists in recent errors ring buffer");
}

// ── Test 3: Sensitive Data Sanitization ──────────────────────────────────────

function testSanitization() {
  console.log("\n── Sensitive Data Sanitization ──");

  const sensitiveErr = new Error("Failed validation for password=secret123 and token: confidentialKey");
  const event = ErrorTracker.track(sensitiveErr);

  assert(!event.message.includes("secret123"), "Redacts secret password from message");
  assert(!event.message.includes("confidentialKey"), "Redacts confidential token from message");
  assert(event.message.includes("password: [REDACTED]") || event.message.includes("password: [redacted]") || event.message.includes("[REDACTED]"), "Includes REDACTED placeholder");
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log("🔍 Error Tracker Tests\n" + "─".repeat(40));

  testClassification();
  testErrorTracking();
  testSanitization();

  console.log("\n" + "─".repeat(40));
  console.log(`📊 Error Tracker Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

export { run as runErrorTrackerTests };
