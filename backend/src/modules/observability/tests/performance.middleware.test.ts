/**
 * Performance Middleware Tests — Milestone 25
 */

import { performanceMiddleware, getElapsedMs } from "@/middlewares/performance.middleware";
import { MetricsService } from "@/modules/observability/services/metrics.service";
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

// Mocking Express Response with events
class MockResponse {
  private headers = new Map<string, string>();
  private listeners: Record<string, Array<() => void>> = {};
  public statusCode = 200;

  setHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }

  getHeader(name: string) {
    return this.headers.get(name.toLowerCase());
  }

  on(event: string, cb: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(cb);
    return this;
  }

  emit(event: string) {
    const list = this.listeners[event] || [];
    for (const cb of list) {
      cb();
    }
  }
}

// ── Test 1: Performance Timer Recording ────────────────────────────────────────

async function testPerformanceTimer() {
  console.log("\n── Performance Timer Recording ──");

  MetricsService.reset();

  const req = {
    method: "GET",
    path: "/api/v1/courses",
  } as unknown as Request;
  const res = new MockResponse() as unknown as Response;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  performanceMiddleware(req, res, next);

  assert(nextCalled, "Calls next()");
  assert(typeof req.startTime === "bigint", "Attaches startTime as bigint to req");

  // Sleep/Wait for 10ms to simulate response duration
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Trigger finish event
  (res as unknown as MockResponse).emit("finish");

  const elapsed = getElapsedMs(req);
  assert(elapsed >= 9, `getElapsedMs returned correct time range: ${elapsed}ms`);

  const responseTimeHeader = res.getHeader("x-response-time") as string;
  assert(typeof responseTimeHeader === "string" && responseTimeHeader.endsWith("ms"), `Sets response time header: ${responseTimeHeader}`);

  const snapshot = MetricsService.getSnapshot();
  assert(snapshot.counters["http.requests.total"] === 1, "Registers request in metrics counters");
  assert(snapshot.histograms["http.response_time_ms"]?.count === 1, "Registers duration in metrics histograms");
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log("⏱️ Performance Middleware Tests\n" + "─".repeat(40));

  await testPerformanceTimer();

  console.log("\n" + "─".repeat(40));
  console.log(`📊 Performance Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

export { run as runPerformanceTests };
