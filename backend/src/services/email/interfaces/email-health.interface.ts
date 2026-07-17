export type EmailHealthProvider = "Brevo" | "SES" | "SMTP";
export type EmailHealthStatus = "healthy" | "unhealthy";
export type EmailConnectionStatus = "connected" | "failed";
export type EmailAuthenticationStatus = "authenticated" | "failed" | "not_checked";
export type EmailHealthStepStatus = "passed" | "failed" | "skipped";

export interface EmailHealthStep {
  status: EmailHealthStepStatus;
  latency: number;
  message?: string;
}

export interface EmailHealthReport {
  provider: EmailHealthProvider;
  status: EmailHealthStatus;
  connectionStatus: EmailConnectionStatus;
  authenticationStatus: EmailAuthenticationStatus;
  lastSuccessfulCheck: string | null;
  errorMessage?: string;
  checkedAt: string;
  latency: number;
  checks: {
    dns: EmailHealthStep;
    tcp: EmailHealthStep;
    tls: EmailHealthStep;
    auth: EmailHealthStep;
  };
  details: {
    host: string;
    port: number;
    secure: boolean;
  };
}

export interface IEmailHealthService {
  getEmailHealth(): Promise<EmailHealthReport>;
}
