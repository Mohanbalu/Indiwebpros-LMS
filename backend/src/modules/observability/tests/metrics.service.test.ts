/**
 * Metrics Service Tests — Milestone 25
 */

import { MetricsService } from "../services/metrics.service";

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

// ── Test 1: Counter Operations ─────────────────────────────────────────────────

function testCounters() {
  console.log("\n── Counter Operations ──");

  MetricsService.reset();

  MetricsService.increment("test.counter");
  assert(MetricsService.getCounter("test.counter") === 1, "Increment by 1");

  MetricsService.increment("test.counter", 5);
  assert(MetricsService.getCounter("test.counter") === 6, "Increment by 5");

  assert(MetricsService.getCounter("non.existent") === 0, "Non-existent counter returns 0");

  MetricsService.increment("test.counter");
  MetricsService.increment("test.counter");
  assert(MetricsService.getCounter("test.counter") === 8, "Multiple increments accumulate");
}

// ── Test 2: Histogram Operations ──────────────────────────────────────────────

function testHistograms() {
  console.log("\n── Histogram Operations ──");

  MetricsService.reset();

  // Record a set of durations
  const durations = [10, 20, 30, 40, 50, 100, 200, 300, 400, 500];
  for (const d of durations) {
    MetricsService.recordDuration("test.histogram", d);
  }

  const stats = MetricsService.getHistogram("test.histogram");

  assert(stats.count === 10, "Count is correct");
  assert(stats.min === 10, "Min is correct");
  assert(stats.max === 500, "Max is correct");
  assert(stats.sum === 1650, "Sum is correct");
  assert(stats.mean === 165, "Mean is correct");
  assert(stats.p50 > 0, "p50 is computed");
  assert(stats.p95 >= stats.p50, "p95 >= p50");
  assert(stats.p99 >= stats.p95, "p99 >= p95");
  assert(stats.p99 <= 500, "p99 <= max value");

  // Non-existent histogram returns zeroed stats
  const empty = MetricsService.getHistogram("non.existent");
  assert(empty.count === 0, "Non-existent histogram returns count=0");
  assert(empty.p99 === 0, "Non-existent histogram returns p99=0");
}

// ── Test 3: Gauge Operations ───────────────────────────────────────────────────

function testGauges() {
  console.log("\n── Gauge Operations ──");

  MetricsService.reset();

  MetricsService.setGauge("test.gauge", 42);
  assert(MetricsService.getGauge("test.gauge") === 42, "Gauge set correctly");

  MetricsService.setGauge("test.gauge", 100);
  assert(MetricsService.getGauge("test.gauge") === 100, "Gauge overwritten correctly");

  assert(MetricsService.getGauge("non.existent") === 0, "Non-existent gauge returns 0");
}

// ── Test 4: Request Recording ──────────────────────────────────────────────────

function testRequestRecording() {
  console.log("\n── Request Recording ──");

  MetricsService.reset();

  MetricsService.recordRequest("GET", 200, 45, "/api/v1/health");
  MetricsService.recordRequest("POST", 201, 150, "/api/v1/purchases");
  MetricsService.recordRequest("GET", 404, 10, "/api/v1/notfound");
  MetricsService.recordRequest("POST", 500, 200, "/api/v1/payments");

  assert(MetricsService.getCounter("http.requests.total") === 4, "Total request count = 4");
  assert(MetricsService.getCounter("http.errors.4xx") === 1, "4xx error count = 1");
  assert(MetricsService.getCounter("http.errors.5xx") === 1, "5xx error count = 1");

  const hist = MetricsService.getHistogram("http.response_time_ms");
  assert(hist.count === 4, "Response time histogram has 4 entries");
  assert(hist.min === 10, "Min duration = 10ms");
  assert(hist.max === 200, "Max duration = 200ms");
}

// ── Test 5: Security Event Recording ──────────────────────────────────────────

function testSecurityEvents() {
  console.log("\n── Security Event Recording ──");

  MetricsService.reset();

  MetricsService.recordAuthFailure("wrong_password");
  MetricsService.recordAuthFailure("wrong_password");
  MetricsService.recordAuthFailure("expired_token");

  assert(MetricsService.getCounter("auth.failures") === 3, "Auth failure counter = 3");
  assert(MetricsService.getCounter("auth.failures.wrong_password") === 2, "Per-reason counter = 2");
  assert(MetricsService.getCounter("auth.failures.expired_token") === 1, "Per-reason counter = 1");

  MetricsService.recordPaymentFailure("razorpay");
  MetricsService.recordPaymentSuccess("razorpay");
  assert(MetricsService.getCounter("payment.failures") === 1, "Payment failure counter");
  assert(MetricsService.getCounter("payment.successes") === 1, "Payment success counter");
}

// ── Test 6: Metrics Snapshot ───────────────────────────────────────────────────

function testSnapshot() {
  console.log("\n── Metrics Snapshot ──");

  MetricsService.reset();
  MetricsService.recordRequest("GET", 200, 100);
  MetricsService.recordRequest("POST", 500, 250);

  const snapshot = MetricsService.getSnapshot();

  assert(typeof snapshot.timestamp === "string", "Snapshot has timestamp");
  assert(typeof snapshot.uptime === "number", "Snapshot has uptime");
  assert(typeof snapshot.counters === "object", "Snapshot has counters object");
  assert(typeof snapshot.histograms === "object", "Snapshot has histograms object");
  assert(typeof snapshot.gauges === "object", "Snapshot has gauges object");
  assert(typeof snapshot.rates === "object", "Snapshot has rates object");
  assert(typeof snapshot.rates.requestsPerMinute === "number", "Snapshot has requestsPerMinute");
  assert(typeof snapshot.rates.errorRate === "string", "Snapshot has errorRate (string)");

  // Live memory gauges should be in snapshot
  assert(typeof snapshot.gauges["process.heap_used_mb"] === "number", "Live heap_used_mb gauge");
  assert(snapshot.gauges["process.heap_used_mb"] > 0, "heap_used_mb > 0");

  // Error rate calculation
  assert(snapshot.rates.errorRate.endsWith("%"), "Error rate formatted as percentage");
}

// ── Test 7: DB Query Recording ────────────────────────────────────────────────

function testDbQueryRecording() {
  console.log("\n── DB Query Recording ──");

  MetricsService.reset();

  MetricsService.recordDbQuery(15, "findMany");
  MetricsService.recordDbQuery(25, "findMany");
  MetricsService.recordDbQuery(100, "create");

  const stats = MetricsService.getHistogram("db.query_time_ms");
  assert(stats.count === 3, "DB query count = 3");

  const findManyStats = MetricsService.getHistogram("db.query_time_ms.findMany");
  assert(findManyStats.count === 2, "findMany-specific histogram = 2");
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log("📊 Metrics Service Tests\n" + "─".repeat(40));

  testCounters();
  testHistograms();
  testGauges();
  testRequestRecording();
  testSecurityEvents();
  testSnapshot();
  testDbQueryRecording();

  console.log("\n" + "─".repeat(40));
  console.log(`📊 Metrics Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

export { run as runMetricsTests };
