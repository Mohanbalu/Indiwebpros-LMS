export interface IMetricsService {
  metrics(): Promise<Record<string, unknown>>;
  resetMetrics(): Promise<void>;
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
}
