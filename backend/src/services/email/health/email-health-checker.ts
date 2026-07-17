import dns from "dns";
import net from "net";
import nodemailer from "nodemailer";
import { EmailConfig } from "../../shared/config.schema";
import {
  EmailAuthenticationStatus,
  EmailConnectionStatus,
  EmailHealthProvider,
  EmailHealthReport,
  EmailHealthStep,
  EmailHealthStatus,
} from "../interfaces/email-health.interface";

type DnsResolver = (hostname: string) => Promise<unknown>;
type TcpConnector = (options: { host: string; port: number; timeout: number }) => Promise<void>;
type SmtpVerifier = () => Promise<void>;

interface EmailHealthCheckerDependencies {
  resolveDns?: DnsResolver;
  connectTcp?: TcpConnector;
  verifySmtp?: SmtpVerifier;
  now?: () => Date;
}

const DEFAULT_TIMEOUT_MS = 5000;

export class EmailHealthChecker {
  private lastSuccessfulCheck: string | null = null;

  constructor(
    private readonly config: EmailConfig,
    private readonly provider: EmailHealthProvider,
    private readonly dependencies: EmailHealthCheckerDependencies = {}
  ) {}

  async check(_transporter?: nodemailer.Transporter): Promise<EmailHealthReport> {
    const startedAt = Date.now();
    const secure = this.config.smtpSecure || this.config.smtpPort === 465;
    const checks: EmailHealthReport["checks"] = {
      dns: this.emptyStep("skipped"),
      tcp: this.emptyStep("skipped"),
      tls: this.emptyStep("skipped"),
      auth: this.emptyStep("skipped"),
    };

    let errorMessage: string | undefined;

    checks.dns = await this.runStep(() => this.resolveDns(this.config.smtpHost));
    if (checks.dns.status === "passed") {
      checks.tcp = await this.runStep(() => this.connectTcp({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        timeout: DEFAULT_TIMEOUT_MS,
      }));
    }

    if (checks.tcp.status === "passed") {
      const verifyStep = await this.runStep(() => this.verifySmtp());
      checks.tls = verifyStep;
      checks.auth = verifyStep.status === "passed"
        ? verifyStep
        : { ...verifyStep, message: "SMTP verification failed before authentication could be confirmed" };
    }

    const status: EmailHealthStatus = this.allPassed(checks) ? "healthy" : "unhealthy";
    const connectionStatus: EmailConnectionStatus = checks.dns.status === "passed" && checks.tcp.status === "passed" && checks.tls.status === "passed"
      ? "connected"
      : "failed";
    const authenticationStatus: EmailAuthenticationStatus = checks.auth.status === "passed"
      ? "authenticated"
      : checks.auth.status === "failed"
        ? "failed"
        : "not_checked";

    if (status === "healthy") {
      this.lastSuccessfulCheck = this.now().toISOString();
    } else {
      errorMessage = this.firstError(checks);
    }

    return {
      provider: this.provider,
      status,
      connectionStatus,
      authenticationStatus,
      lastSuccessfulCheck: this.lastSuccessfulCheck,
      errorMessage,
      checkedAt: this.now().toISOString(),
      latency: Date.now() - startedAt,
      checks,
      details: {
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure,
      },
    };
  }

  private async resolveDns(hostname: string): Promise<unknown> {
    if (this.dependencies.resolveDns) {
      return this.dependencies.resolveDns(hostname);
    }

    return dns.promises.lookup(hostname);
  }

  private async connectTcp(options: { host: string; port: number; timeout: number }): Promise<void> {
    if (this.dependencies.connectTcp) {
      return this.dependencies.connectTcp(options);
    }

    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host: options.host, port: options.port });
      const cleanup = () => {
        socket.removeAllListeners();
        socket.destroy();
      };

      socket.setTimeout(options.timeout);
      socket.once("connect", () => {
        cleanup();
        resolve();
      });
      socket.once("timeout", () => {
        cleanup();
        reject(new Error("SMTP TCP connection timed out"));
      });
      socket.once("error", (error) => {
        cleanup();
        reject(error);
      });
    });
  }

  private async verifySmtp(): Promise<void> {
    if (this.dependencies.verifySmtp) {
      return this.dependencies.verifySmtp();
    }

    const healthTransporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpSecure || this.config.smtpPort === 465,
      requireTLS: this.config.smtpPort !== 25,
      auth: {
        user: this.config.smtpUsername,
        pass: this.config.smtpPassword,
      },
    });

    await healthTransporter.verify();
    healthTransporter.close();
  }

  private async runStep(action: () => Promise<unknown>): Promise<EmailHealthStep> {
    const startedAt = Date.now();
    try {
      await action();
      return { status: "passed", latency: Date.now() - startedAt };
    } catch (error) {
      return {
        status: "failed",
        latency: Date.now() - startedAt,
        message: this.sanitizeError(error),
      };
    }
  }

  private emptyStep(status: "skipped"): EmailHealthStep {
    return { status, latency: 0 };
  }

  private allPassed(checks: EmailHealthReport["checks"]): boolean {
    return Object.values(checks).every((check) => check.status === "passed");
  }

  private firstError(checks: EmailHealthReport["checks"]): string {
    return Object.values(checks).find((check) => check.status === "failed")?.message ?? "Email health check failed";
  }

  private sanitizeError(error: unknown): string {
    let message = error instanceof Error ? error.message : String(error);
    for (const secret of [this.config.smtpPassword, this.config.smtpUsername]) {
      if (secret) {
        message = message.replaceAll(secret, "[REDACTED]");
      }
    }
    return message;
  }

  private now(): Date {
    return this.dependencies.now ? this.dependencies.now() : new Date();
  }
}
