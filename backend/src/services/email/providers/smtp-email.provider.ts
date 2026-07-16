import nodemailer from "nodemailer";
import { IEmailService } from "../interfaces/email-service.interface";
import { EmailConfig } from "../../shared/config.schema";
import { ServiceContainer } from "../../shared/service-container";
import { EmailSendException, ProviderException } from "../errors/email-exceptions";
import { TemplateEngine } from "../templates/template-engine";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";

export class SMTPProvider implements IEmailService, ILifecycleService, IHealthCheckService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: EmailConfig) {}

  async initialize(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
        auth: {
          user: this.config.smtpUsername,
          pass: this.config.smtpPassword,
        },
      });

      // Verify connection
      try {
        await this.transporter.verify();
        ServiceContainer.logger.info("SMTPProvider initialized successfully");
      } catch (verifyError) {
        ServiceContainer.logger.warn(`SMTPProvider connection verification failed: ${(verifyError as Error).message}`);
      }
    } catch (error) {
      throw new ProviderException("Failed to initialize SMTPProvider", [error]);
    }
  }

  async shutdown(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      if (!this.transporter) throw new Error("Transporter not initialized");
      await this.transporter.verify();
      return { service: "EmailModule", status: "healthy", latency: 0, message: "SMTP connection established", timestamp: new Date().toISOString() };
    } catch (error) {
      return { service: "EmailModule", status: "unhealthy", latency: 0, message: (error as Error).message, timestamp: new Date().toISOString() };
    }
  }

  async send(to: string, subject: string, body: string, options?: Record<string, unknown>): Promise<void> {
    if (!this.transporter) throw new ProviderException("SMTPProvider is not initialized");

    try {
      await this.transporter.sendMail({
        from: `"${this.config.smtpFromName}" <${this.config.smtpFromEmail}>`,
        to,
        subject,
        html: body,
        ...options,
      });

      ServiceContainer.logger.info(`Email sent successfully via SMTP to ${to}`);
      
      // Audit log success
      await ServiceContainer.audit.log({
        userId: "system",
        action: "EMAIL_SENT",
        resource: "EmailModule",
        resourceId: to,
        details: { provider: "smtp", subject },
        status: "SUCCESS"
      });
    } catch (error) {
      ServiceContainer.logger.error(`Failed to send email to ${to} via SMTP`, { error });
      
      // Audit log failure
      await ServiceContainer.audit.log({
        userId: "system",
        action: "EMAIL_FAILED",
        resource: "EmailModule",
        resourceId: to,
        details: { provider: "smtp", subject, error: (error as Error).message },
        status: "FAILURE"
      });

      throw new EmailSendException(`Failed to send email to ${to}`, [error]);
    }
  }

  async sendTemplate(to: string, templateName: string, data: Record<string, unknown>, options?: Record<string, unknown>): Promise<void> {
    const { html, subject } = TemplateEngine.render(templateName, data);
    await this.send(to, subject, html, options);
  }

  async sendVerification(to: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    await this.sendTemplate(to, "verification", { name: to.split("@")[0], verificationLink });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.sendTemplate(to, "password-reset", { name: to.split("@")[0], resetLink });
  }

  async sendWelcome(to: string, data: Record<string, unknown>): Promise<void> {
    const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    await this.sendTemplate(to, "welcome", { name: data.name || to.split("@")[0], dashboardLink });
  }

  async sendPurchaseConfirmation(to: string, data: Record<string, unknown>): Promise<void> {
    const courseLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${data.courseId}`;
    await this.sendTemplate(to, "purchase-confirmation", { name: data.name || to.split("@")[0], ...data, courseLink });
  }

  async sendCertificateIssued(to: string, data: Record<string, unknown>): Promise<void> {
    const certificateLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/${data.certificateId}`;
    await this.sendTemplate(to, "certificate-issued", { name: data.name || to.split("@")[0], ...data, certificateLink });
  }

  async sendNotification(to: string, data: Record<string, unknown>): Promise<void> {
    await this.sendTemplate(to, "notification", { name: data.name || to.split("@")[0], ...data });
  }
}
