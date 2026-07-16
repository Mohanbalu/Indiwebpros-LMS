/**
 * Observability Module — Barrel Export
 * Milestone 25
 */

export { HealthService } from "./services/health.service";
export type { HealthReport, LivenessReport, ReadinessReport, StartupReport, ServiceCheck, HealthStatus as ObservabilityHealthStatus } from "./services/health.service";

export { MetricsService } from "./services/metrics.service";
export type { MetricsSnapshot, HistogramStats } from "./services/metrics.service";

export { ErrorTracker, classifyError } from "./services/error-tracker.service";
export type { ErrorEvent, ErrorCategory } from "./services/error-tracker.service";

export { HealthController } from "./controllers/health.controller";

export { default as observabilityRouter } from "./routes/health.routes";
