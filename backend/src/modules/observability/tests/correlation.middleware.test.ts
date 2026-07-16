/**
 * Correlation Middleware Tests — Milestone 25
 */

import { correlationMiddleware } from "@/middlewares/correlation.middleware";
import { Request, Response } from "express";

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

// Mocking express Request and Response
function createMockRequest(headers: Record<string, string> = {}): Partial<Request> {
  return {
    headers,
    header: (name: string) => headers[name.toLowerCase()] || undefined,
  } as unknown as Partial<Request>;
}

function createMockResponse(): Partial<Response> {
  const headers = new Map<string, string>();
  const res = {
    setHeader: (name: string, value: string) => {
      headers.set(name.toLowerCase(), value);
      return res;
    },
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    headersSent: false,
  } as unknown as Partial<Response>;
  return res;
}

// ── Test 1: New Traces Generation ─────────────────────────────────────────────

function testNewTraces() {
  console.log("\n── New Traces Generation ──");

  const req = createMockRequest() as Request;
  const res = createMockResponse() as Response;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  correlationMiddleware(req, res, next);

  assert(nextCalled, "Calls next()");
  assert(typeof req.id === "string" && req.id.length > 0, "Generates request ID");
  assert(typeof req.correlationId === "string" && req.correlationId.length > 0, "Generates correlation ID");
  assert(typeof req.traceId === "string" && req.traceId.length === 32, "Generates 32-char hex trace ID");

  assert(res.getHeader("x-request-id") === req.id, "Sets x-request-id response header");
  assert(res.getHeader("x-correlation-id") === req.correlationId, "Sets x-correlation-id response header");
  assert(res.getHeader("x-trace-id") === req.traceId, "Sets x-trace-id response header");
  assert(typeof res.getHeader("traceparent") === "string" && (res.getHeader("traceparent") as string).includes(req.traceId!), "Sets traceparent response header conforming to W3C standards");
}

// ── Test 2: Headers Propagation ───────────────────────────────────────────────

function testHeadersPropagation() {
  console.log("\n── Headers Propagation ──");

  const req = createMockRequest({
    "x-request-id": "client-req-id-123",
    "x-correlation-id": "client-corr-id-456",
    "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  }) as Request;
  const res = createMockResponse() as Response;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  correlationMiddleware(req, res, next);

  assert(nextCalled, "Calls next()");
  assert(req.id === "client-req-id-123", "Propagates client-provided request ID");
  assert(req.correlationId === "client-corr-id-456", "Propagates client-provided correlation ID");
  assert(req.traceId === "4bf92f3577b34da6a3ce929d0e0e4736", "Extracts W3C trace ID from traceparent");

  assert(res.getHeader("x-request-id") === "client-req-id-123", "Response has correct x-request-id");
  assert(res.getHeader("x-correlation-id") === "client-corr-id-456", "Response has correct x-correlation-id");
  assert(res.getHeader("x-trace-id") === "4bf92f3577b34da6a3ce929d0e0e4736", "Response has correct x-trace-id");
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log("🔗 Correlation Middleware Tests\n" + "─".repeat(40));

  testNewTraces();
  testHeadersPropagation();

  console.log("\n" + "─".repeat(40));
  console.log(`📊 Correlation Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

export { run as runCorrelationTests };
