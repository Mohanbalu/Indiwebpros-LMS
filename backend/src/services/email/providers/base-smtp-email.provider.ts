import nodemailer from "nodemailer";
import { EmailConfig } from "../../shared/config.schema";
import { HealthStatus, IHealthCheckService } from "../../shared/health.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { ServiceContainer } from "../../shared/service-container";
import { EmailSendException, ProviderException } from "../errors/email-exceptions";
import { EmailHealthChecker } from "../health/email-health-checker";
import { EmailHealthProvider, EmailHealthReport, IEmailHealthService } from "../interfaces/email-health.interface";
import { IEmailService } from "../interfaces/email-service.interface";
import { TemplateEngine } from "../templates/template-engine";

type EmailSendOptions = Record<string, unknown> & {
  messageType?: string;
  retryAttempts?: number;
};

export abstract class BaseSMTPEmailProvider implements IEmailService, ILifecycleService, IHealthCheckService, IEmailHealthService {
  protected transporter: nodemailer.Transporter | null = null;
  private readonly healthChecker: EmailHealthChecker;
  private emailHealthReport: EmailHealthReport | null = null;

  protected constructor(
    protected config: EmailConfig,
    private readonly providerName: string,
    private readonly providerKey: string,
    healthProvider: EmailHealthProvider
  ) {
    this.healthChecker = new EmailHealthChecker(config, healthProvider);
  }

  async initialize(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure || this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUsername,
          pass: this.config.smtpPassword,
        },
      });

      this.emailHealthReport = await this.healthChecker.check(this.transporter);
      const logContext = {
        provider: this.providerKey,
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure || this.config.smtpPort === 465,
        connectionStatus: this.emailHealthReport.connectionStatus,
        authenticationStatus: this.emailHealthReport.authenticationStatus,
        error: this.emailHealthReport.errorMessage,
      };

      if (this.emailHealthReport.status === "healthy") {
        ServiceContainer.logger.info(`${this.providerName} initialized successfully`, logContext);
      } else {
        ServiceContainer.logger.warn(`${this.providerName} startup health check failed`, logContext);
      }
    } catch (error) {
      throw new ProviderException(`Failed to initialize ${this.providerName}`, [error]);
    }
  }

  async shutdown(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }

  async health(): Promise<HealthStatus> {
    const report = await this.getEmailHealth();
    return {
      service: "EmailModule",
      status: report.status,
      latency: report.latency,
      message: report.status === "healthy"
        ? `${this.providerName} connection established`
        : report.errorMessage ?? `${this.providerName} health check failed`,
      timestamp: report.checkedAt,
    };
  }

  async getEmailHealth(): Promise<EmailHealthReport> {
    if (!this.transporter) {
      this.emailHealthReport = await this.healthChecker.check();
      return this.emailHealthReport;
    }

    this.emailHealthReport = await this.healthChecker.check(this.transporter);
    return this.emailHealthReport;
  }

  async send(to: string, subject: string, body: string, options?: Record<string, unknown>): Promise<void> {
    const sendOptions = (options ?? {}) as EmailSendOptions;
    const { messageType: explicitMessageType, retryAttempts, ...nodemailerOptions } = sendOptions;
    const messageType = this.resolveMessageType(subject, body, explicitMessageType);
    const recipient = to.trim();
    const startedAt = Date.now();

    if (!this.isValidRecipient(recipient)) {
      const error = new EmailSendException(`Invalid recipient address: ${recipient}`);
      await this.logFailure(recipient, messageType, error, 0, false, 0);
      await this.logAudit("FAILURE", recipient, subject, messageType, 0, error);
      throw error;
    }

    const totalAttempts = this.resolveRetryAttempts(retryAttempts);
    let lastError: unknown;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        this.ensureTransporter();
        await this.transporter!.sendMail({
          from: `"${this.config.smtpFromName}" <${this.config.smtpFromEmail}>`,
          to: recipient,
          subject,
          html: body,
          ...nodemailerOptions,
        });

        await this.logSuccess(recipient, messageType, attempt - 1, Date.now() - startedAt);
        await this.logAudit("SUCCESS", recipient, subject, messageType, attempt - 1);
        return;
      } catch (error) {
        lastError = error;
        const retryable = this.isRetryableError(error);
        const elapsedMs = Date.now() - startedAt;

        if (attempt < totalAttempts && retryable) {
          await this.logRetry(recipient, messageType, attempt, totalAttempts, error, elapsedMs);
          await this.delay(this.getRetryDelayMs(attempt));
          continue;
        }

        await this.logFailure(recipient, messageType, error, attempt - 1, retryable, elapsedMs);
        await this.logAudit("FAILURE", recipient, subject, messageType, attempt - 1, error);
        throw new EmailSendException(`Failed to send email to ${recipient}`, [error]);
      }
    }

    throw new EmailSendException(`Failed to send email to ${recipient}`, [lastError]);
  }

  async sendTemplate(to: string, templateName: string, data: Record<string, unknown>, options?: Record<string, unknown>): Promise<void> {
    const { html, subject } = TemplateEngine.render(templateName, data);
    await this.send(to, subject, html, { ...options, messageType: (options?.messageType as string) ?? templateName });
  }

  async sendVerification(to: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    await this.sendTemplate(to, "verification", { name: to.split("@")[0], verificationLink }, { messageType: "verification" });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await this.sendTemplate(to, "password-reset", { name: to.split("@")[0], resetLink }, { messageType: "password-reset" });
  }

  async sendWelcome(to: string, data: Record<string, unknown>): Promise<void> {
    const dashboardLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`;
    await this.sendTemplate(to, "welcome", { name: data.name || to.split("@")[0], dashboardLink }, { messageType: "welcome" });
  }

  async sendPurchaseConfirmation(to: string, data: Record<string, unknown>): Promise<void> {
    const courseLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/courses/${data.courseId}`;
    await this.sendTemplate(to, "purchase-confirmation", { name: data.name || to.split("@")[0], ...data, courseLink }, { messageType: "enrollment" });
  }

  async sendCertificateIssued(to: string, data: Record<string, unknown>): Promise<void> {
    const certificateLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/certificates/${data.certificateId}`;
    await this.sendTemplate(to, "certificate-issued", { name: data.name || to.split("@")[0], ...data, certificateLink }, { messageType: "certificate-ready" });
  }

  async sendNotification(to: string, data: Record<string, unknown>): Promise<void> {
    await this.sendTemplate(to, "notification", { name: data.name || to.split("@")[0], ...data }, { messageType: "notification" });
  }

  private ensureTransporter(): void {
    if (!this.transporter) {
      throw new ProviderException(`${this.providerName} is not initialized`);
    }
  }

  private resolveRetryAttempts(retryAttempts?: number): number {
    if (typeof retryAttempts === "number" && Number.isFinite(retryAttempts) && retryAttempts > 0) {
      return Math.min(Math.floor(retryAttempts), 5);
    }

    return 3;
  }

  private resolveMessageType(subject: string, body: string, explicitMessageType?: string): string {
    if (explicitMessageType && explicitMessageType.trim()) {
      return explicitMessageType.trim().toLowerCase();
    }

    const normalizedSubject = subject.toLowerCase();
    const normalizedBody = body.toLowerCase();

    if (normalizedSubject.includes("otp") || normalizedSubject.includes("verification code") || normalizedBody.includes("otp")) {
      return "otp";
    }

    if (normalizedSubject.includes("verify") || normalizedBody.includes("verify-email")) {
      return "verification";
    }

    if (normalizedSubject.includes("password reset") || normalizedSubject.includes("reset your password") || normalizedBody.includes("reset-password")) {
      return "password-reset";
    }

    if (normalizedSubject.includes("welcome")) {
      return "welcome";
    }

    if (normalizedSubject.includes("certificate")) {
      return "certificate-ready";
    }

    if (normalizedSubject.includes("enrollment") || normalizedSubject.includes("purchase") || normalizedSubject.includes("receipt") || normalizedSubject.includes("access granted")) {
      return "enrollment";
    }

    if (normalizedSubject.includes("notification")) {
      return "notification";
    }

    return "transactional";
  }

  private isValidRecipient(recipient: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  }

  private isRetryableError(error: unknown): boolean {
    const normalizedError = error as { code?: string; responseCode?: number; message?: string };
    const retryableCodes = new Set(["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ECONNREFUSED", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH"]);

    if (normalizedError.code && retryableCodes.has(normalizedError.code)) {
      return true;
    }

    if (typeof normalizedError.responseCode === "number" && [421, 450, 451, 452, 454].includes(normalizedError.responseCode)) {
      return true;
    }

    const message = (normalizedError.message || "").toLowerCase();
    return message.includes("timeout") || message.includes("rate limit") || message.includes("too many requests");
  }

  private getRetryDelayMs(attempt: number): number {
    return Math.min(1000, 150 * 2 ** Math.max(0, attempt - 1));
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async logSuccess(recipient: string, messageType: string, retryAttempts: number, latencyMs: number): Promise<void> {
    ServiceContainer.logger.info(`${this.providerName} email sent successfully`, {
      provider: this.providerKey,
      recipient,
      messageType,
      success: true,
      retryAttempts,
      latencyMs,
      sender: {
        fromName: this.config.smtpFromName,
        fromEmail: this.config.smtpFromEmail,
      },
    });
  }

  private async logRetry(recipient: string, messageType: string, attempt: number, totalAttempts: number, error: unknown, latencyMs: number): Promise<void> {
    const normalizedError = error as { code?: string; responseCode?: number; message?: string };
    ServiceContainer.logger.warn(`${this.providerName} retrying email send`, {
      provider: this.providerKey,
      recipient,
      messageType,
      success: false,
      retryAttempts: attempt - 1,
      nextAttempt: attempt + 1,
      totalAttempts,
      latencyMs,
      errorCode: normalizedError.code,
      responseCode: normalizedError.responseCode,
      errorMessage: normalizedError.message,
    });
  }

  private async logFailure(recipient: string, messageType: string, error: unknown, retryAttempts: number, retryable: boolean, latencyMs: number): Promise<void> {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    ServiceContainer.logger.error(normalizedError, {
      provider: this.providerKey,
      recipient,
      messageType,
      success: false,
      retryAttempts,
      retryable,
      latencyMs,
      sender: {
        fromName: this.config.smtpFromName,
        fromEmail: this.config.smtpFromEmail,
      },
    });
  }

  private async logAudit(status: "SUCCESS" | "FAILURE", recipient: string, subject: string, messageType: string, retryAttempts: number, error?: unknown): Promise<void> {
    try {
      await ServiceContainer.audit.log({
        userId: "system",
        action: status === "SUCCESS" ? "EMAIL_SENT" : "EMAIL_FAILED",
        resource: "EmailModule",
        resourceId: recipient,
        details: {
          provider: this.providerKey,
          recipient,
          subject,
          messageType,
          retryAttempts,
          error: error instanceof Error ? error.message : undefined,
        },
        status,
      });
    } catch {
      // Audit logging is best effort and must not block email delivery.
    }
  }
}