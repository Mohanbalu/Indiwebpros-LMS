export interface HealthStatus {
  service: string;
  status: "healthy" | "unhealthy";
  latency: number;
  message: string;
  timestamp: string;
}

export interface IHealthCheckService {
  health(): Promise<HealthStatus>;
}
