import { z } from "zod";
import { ConfigurationException } from "./infrastructure-exceptions";

export const loggerConfigSchema = z.object({
  env: z.string().default(process.env.NODE_ENV || "development"),
  level: z.string().default(process.env.LOG_LEVEL || "info"),
});

export const storageConfigSchema = z.object({
  provider: z.string().default(process.env.STORAGE_PROVIDER || "s3"),
  region: z.string().default(process.env.AWS_REGION || "us-east-1"),
  bucket: z.string().default(process.env.AWS_S3_BUCKET || "indiwebpros-lms-assets"),
  accessKeyId: z.string().default(process.env.AWS_ACCESS_KEY_ID || "mock-access-key"),
  secretAccessKey: z.string().default(process.env.AWS_SECRET_ACCESS_KEY || "mock-secret-key"),
});

export const emailConfigSchema = z.object({
  provider: z.string().default(process.env.EMAIL_PROVIDER || "smtp"),
  smtpHost: z.string().default(process.env.SMTP_HOST || "localhost"),
  smtpPort: z.coerce.number().default(Number(process.env.SMTP_PORT) || 587),
  smtpUsername: z.string().default(process.env.SMTP_USERNAME || process.env.SMTP_USER || "mock-user"),
  smtpPassword: z.string().default(process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "mock-pass"),
  smtpSecure: z.coerce.boolean().default(process.env.SMTP_SECURE === "true"),
  smtpFromName: z.string().default(process.env.SMTP_FROM_NAME || "IndiWebPros LMS"),
  smtpFromEmail: z.string().email().default(process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || "noreply@indiwebpros.com"),
  awsRegion: z.string().default(process.env.AWS_REGION || "us-east-1"),
  awsSesFromEmail: z.string().email().default(process.env.AWS_SES_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || "noreply@indiwebpros.com"),
});

export const paymentConfigSchema = z.object({
  provider: z.string().default(process.env.PAYMENT_PROVIDER || "razorpay"),
  razorpayKeyId: z.string().default(process.env.RAZORPAY_KEY_ID || "mock-rzp-key"),
  razorpaySecret: z.string().default(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "mock-rzp-secret"),
  razorpayWebhookSecret: z.string().default(process.env.RAZORPAY_WEBHOOK_SECRET || "mock-rzp-webhook-secret"),
  stripeSecretKey: z.string().default(process.env.STRIPE_SECRET_KEY || "mock-stripe-secret"),
});

export const cacheConfigSchema = z.object({
  provider: z.string().default(process.env.CACHE_PROVIDER || "memory"),
  redisUrl: z.string().url().default(process.env.REDIS_URL || "redis://localhost:6379"),
});

export const queueConfigSchema = z.object({
  provider: z.string().default(process.env.QUEUE_PROVIDER || "bullmq"),
  redisUrl: z.string().url().default(process.env.REDIS_URL || "redis://localhost:6379"),
});

export const notificationConfigSchema = z.object({
  provider: z.string().default("database"),
});

export const certificateConfigSchema = z.object({
  provider: z.string().default("pdf"),
});

export type LoggerConfig = z.infer<typeof loggerConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type PaymentConfig = z.infer<typeof paymentConfigSchema>;
export type CacheConfig = z.infer<typeof cacheConfigSchema>;
export type QueueConfig = z.infer<typeof queueConfigSchema>;
export type NotificationConfig = z.infer<typeof notificationConfigSchema>;
export type CertificateConfig = z.infer<typeof certificateConfigSchema>;

export class InfrastructureConfig {
  static load() {
    try {
      return {
        logger: loggerConfigSchema.parse(process.env),
        storage: storageConfigSchema.parse(process.env),
        email: emailConfigSchema.parse(process.env),
        payment: paymentConfigSchema.parse(process.env),
        cache: cacheConfigSchema.parse(process.env),
        queue: queueConfigSchema.parse(process.env),
        notification: notificationConfigSchema.parse(process.env),
        certificate: certificateConfigSchema.parse(process.env),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationException(
          "Infrastructure Configuration Validation Failed",
          error.errors
        );
      }
      throw new ConfigurationException("Failed to load infrastructure configuration");
    }
  }
}
