import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { IEmailService } from "../interfaces/email-service.interface";
import { EmailConfig } from "../../shared/config.schema";
import { ServiceContainer } from "../../shared/service-container";
import { EmailSendException, ProviderException } from "../errors/email-exceptions";
import { TemplateEngine } from "../templates/template-engine";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";

export class SESProvider implements IEmailService, ILifecycleService, IHealthCheckService {
  private sesClient: SESClient | null = null;

  constructor(private config: EmailConfig) {}

  async initialize(): Promise<void> {
    try {
      this.sesClient = new SESClient({
        region: this.config.awsRegion,
        // Authentication uses AWS environment variables directly or IAM roles in production
      });

      ServiceContainer.logger.info("SESProvider initialized successfully");
    } catch (error) {
      throw new ProviderException("Failed to initialize SESProvider", [error]);
    }
  }

  async shutdown(): Promise<void> {
    if (this.sesClient) {
      this.sesClient.destroy();
      this.sesClient = null;
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      if (!this.sesClient) throw new Error("SESClient not initialized");
      return { service: "EmailModule", status: "healthy", latency: 0, message: "SESClient initialized", timestamp: new Date().toISOString() };
    } catch (error) {
      return { service: "EmailModule", status: "unhealthy", latency: 0, message: (error as Error).message, timestamp: new Date().toISOString() };
    }
  }

  async send(to: string, subject: string, body: string, options?: Record<string, unknown>): Promise<void> {
    if (!this.sesClient) throw new ProviderException("SESProvider is not initialized");

    try {
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: body,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
        },
        Source: `"${this.config.smtpFromName}" <${this.config.awsSesFromEmail}>`,
        // ── Milestone 24: Configuration Set for CloudWatch metrics + bounce handling ──
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET || "indiwebpros-lms",
        // ── Message tags for filtering in CloudWatch ──
        Tags: [
          { Name: "emailType", Value: (options?.emailType as string) || "transactional" },
          { Name: "app", Value: "indiwebpros-lms" },
        ],
        ...options,
      });

      await this.sesClient.send(command);

      ServiceContainer.logger.info(`Email sent successfully via SES to ${to}`);
      
      // Audit log success
      await ServiceContainer.audit.log({
        userId: "system",
        action: "EMAIL_SENT",
        resource: "EmailModule",
        resourceId: to,
        details: { provider: "ses", subject },
        status: "SUCCESS"
      });
    } catch (error) {
      ServiceContainer.logger.error(`Failed to send email to ${to} via SES`, { error });
      
      // Audit log failure
      await ServiceContainer.audit.log({
        userId: "system",
        action: "EMAIL_FAILED",
        resource: "EmailModule",
        resourceId: to,
        details: { provider: "ses", subject, error: (error as Error).message },
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
