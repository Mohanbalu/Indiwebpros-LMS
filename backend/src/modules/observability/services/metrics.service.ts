/**
 * Metrics Service — Milestone 25
 * In-memory metrics aggregator with CloudWatch publishing.
 *
 * Tracks: counters, histograms (p50/p95/p99), gauges.
 * In production: publishes to CloudWatch every 60 seconds.
 * Future-ready: OpenTelemetry / Prometheus export.
 */

import { CloudWatchMetrics } from "@/utils/cloudwatch-metrics";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistogramStats {
  count: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface MetricsSnapshot {
  timestamp: string;
  uptime: number;
  counters: Record<string, number>;
  histograms: Record<string, HistogramStats>;
  gauges: Record<string, number>;
  rates: {
    requestsPerMinute: number;
    errorsPerMinute: number;
    errorRate: string;
  };
}

// ─── Histogram Implementation (reservoir sampling) ───────────────────────────

class Histogram {
  private readonly RESERVOIR_SIZE = 1028;
  private samples: number[] = [];
  private count = 0;
  private sum = 0;
  private min = Infinity;
  private max = -Infinity;

  record(value: number): void {
    this.count++;
    this.sum += value;
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;

    // Reservoir sampling: keep last RESERVOIR_SIZE samples for percentiles
    if (this.samples.length < this.RESERVOIR_SIZE) {
      this.samples.push(value);
    } else {
      const idx = Math.floor(Math.random() * this.count);
      if (idx < this.RESERVOIR_SIZE) {
        this.samples[idx] = value;
      }
    }
  }

  getStats(): HistogramStats {
    if (this.count === 0) {
      return { count: 0, min: 0, max: 0, sum: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const percentile = (p: number) => {
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    };

    return {
      count: this.count,
      min: this.min === Infinity ? 0 : this.min,
      max: this.max === -Infinity ? 0 : this.max,
      sum: Math.round(this.sum),
      mean: Math.round(this.sum / this.count),
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  reset(): void {
    this.samples = [];
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }
}

// ─── Rate Tracker (sliding 60-second window) ──────────────────────────────────

class RateTracker {
  private readonly WINDOW_MS = 60_000;
  private events: number[] = []; // timestamps

  record(): void {
    const now = Date.now();
    this.events.push(now);
    // Prune old events
    const cutoff = now - this.WINDOW_MS;
    this.events = this.events.filter((t) => t > cutoff);
  }

  getRate(): number {
    const now = Date.now();
    const cutoff = now - this.WINDOW_MS;
    return this.events.filter((t) => t > cutoff).length;
  }
}

// ─── Metrics Service (Singleton) ──────────────────────────────────────────────

class MetricsServiceClass {
  private counters = new Map<string, number>();
  private histograms = new Map<string, Histogram>();
  private gauges = new Map<string, number>();
  private requestRateTracker = new RateTracker();
  private errorRateTracker = new RateTracker();
  private startTime = Date.now();
  private publishInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize known counters at 0
    const knownCounters = [
      "http.requests.total",
      "http.errors.4xx",
      "http.errors.5xx",
      "auth.failures",
      "auth.successes",
      "payment.failures",
      "payment.successes",
      "enrollment.created",
      "email.sent",
      "s3.uploads",
      "certificate.generated",
      "security.events",
      "rbac.violations",
      "webhook.received",
    ];
    for (const key of knownCounters) {
      this.counters.set(key, 0);
    }

    // Start CloudWatch publishing in production
    if (process.env.NODE_ENV === "production") {
      this.startCloudWatchPublisher();
    }
  }

  // ── Counters ──────────────────────────────────────────────────────────────

  increment(key: string, by = 1): void {
    this.counters.set(key, (this.counters.get(key) ?? 0) + by);
  }

  getCounter(key: string): number {
    return this.counters.get(key) ?? 0;
  }

  // ── Histograms ────────────────────────────────────────────────────────────

  recordDuration(key: string, ms: number): void {
    if (!this.histograms.has(key)) {
      this.histograms.set(key, new Histogram());
    }
    this.histograms.get(key)!.record(ms);
  }

  getHistogram(key: string): HistogramStats {
    return this.histograms.get(key)?.getStats() ?? {
      count: 0, min: 0, max: 0, sum: 0, mean: 0, p50: 0, p95: 0, p99: 0,
    };
  }

  // ── Gauges ────────────────────────────────────────────────────────────────

  setGauge(key: string, value: number): void {
    this.gauges.set(key, value);
  }

  getGauge(key: string): number {
    return this.gauges.get(key) ?? 0;
  }

  // ── HTTP Convenience Methods ──────────────────────────────────────────────

  recordRequest(method: string, statusCode: number, durationMs: number, path?: string): void {
    this.increment("http.requests.total");
    this.requestRateTracker.record();

    if (statusCode >= 500) {
      this.increment("http.errors.5xx");
      this.errorRateTracker.record();
    } else if (statusCode >= 400) {
      this.increment("http.errors.4xx");
    }

    this.recordDuration("http.response_time_ms", durationMs);

    // Per-method histograms
    this.recordDuration(`http.response_time_ms.${method.toLowerCase()}`, durationMs);

    // Path-specific for key routes (avoid cardinality explosion)
    if (path) {
      const normalizedPath = this.normalizePath(path);
      if (normalizedPath) {
        this.recordDuration(`http.response_time_ms.path.${normalizedPath}`, durationMs);
      }
    }
  }

  recordAuthFailure(reason: string): void {
    this.increment("auth.failures");
    this.increment(`auth.failures.${reason}`);
  }

  recordPaymentFailure(provider: string): void {
    this.increment("payment.failures");
    this.increment(`payment.failures.${provider}`);
  }

  recordPaymentSuccess(provider: string): void {
    this.increment("payment.successes");
    this.increment(`payment.successes.${provider}`);
  }

  recordSecurityEvent(type: string): void {
    this.increment("security.events");
    this.increment(`security.events.${type}`);
  }

  recordDbQuery(durationMs: number, operation: string): void {
    this.recordDuration("db.query_time_ms", durationMs);
    this.recordDuration(`db.query_time_ms.${operation}`, durationMs);
  }

  // ── Snapshot ──────────────────────────────────────────────────────────────

  getSnapshot(): MetricsSnapshot {
    const countersObj: Record<string, number> = {};
    for (const [k, v] of this.counters) {
      countersObj[k] = v;
    }

    const histogramsObj: Record<string, HistogramStats> = {};
    for (const [k, h] of this.histograms) {
      histogramsObj[k] = h.getStats();
    }

    const gaugesObj: Record<string, number> = {};
    for (const [k, v] of this.gauges) {
      gaugesObj[k] = v;
    }

    // Live memory gauges
    const mem = process.memoryUsage();
    gaugesObj["process.heap_used_mb"] = Math.round(mem.heapUsed / (1024 * 1024));
    gaugesObj["process.heap_total_mb"] = Math.round(mem.heapTotal / (1024 * 1024));
    gaugesObj["process.rss_mb"] = Math.round(mem.rss / (1024 * 1024));

    const totalRequests = this.getCounter("http.requests.total");
    const totalErrors = this.getCounter("http.errors.5xx");
    const errorRate = totalRequests > 0
      ? `${((totalErrors / totalRequests) * 100).toFixed(2)}%`
      : "0.00%";

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      counters: countersObj,
      histograms: histogramsObj,
      gauges: gaugesObj,
      rates: {
        requestsPerMinute: this.requestRateTracker.getRate(),
        errorsPerMinute: this.errorRateTracker.getRate(),
        errorRate,
      },
    };
  }

  // ── CloudWatch Publisher ──────────────────────────────────────────────────

  private startCloudWatchPublisher(): void {
    this.publishInterval = setInterval(async () => {
      try {
        const snapshot = this.getSnapshot();
        const hist = snapshot.histograms["http.response_time_ms"];
        if (hist && hist.count > 0) {
          await CloudWatchMetrics.apiLatency("aggregate", hist.p99);
        }
        // Individual counters
        const authFailures = snapshot.counters["auth.failures"] ?? 0;
        if (authFailures > 0) {
          await CloudWatchMetrics.authFailed("aggregate");
        }
      } catch {
        // Non-critical — never throw from background publisher
      }
    }, 60_000); // Every 60 seconds

    // Don't hold process open
    if (this.publishInterval.unref) {
      this.publishInterval.unref();
    }
  }

  stopPublisher(): void {
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private normalizePath(path: string): string {
    // Map dynamic paths to static keys to avoid cardinality explosion
    const patterns: Array<[RegExp, string]> = [
      [/\/purchases/, "purchases"],
      [/\/payments/, "payments"],
      [/\/enrollments/, "enrollments"],
      [/\/courses/, "courses"],
      [/\/auth/, "auth"],
      [/\/health/, "health"],
      [/\/player/, "player"],
      [/\/certificates/, "certificates"],
      [/\/dashboard/, "dashboard"],
    ];

    for (const [regex, label] of patterns) {
      if (regex.test(path)) return label;
    }
    return ""; // Skip unknown paths (avoid cardinality explosion)
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const MetricsService = new MetricsServiceClass();
export type { MetricsServiceClass };
