import { EmailConfig, InfrastructureConfig } from "./config.schema";
import { ProviderInitializationException } from "./infrastructure-exceptions";
import { ServiceContainer } from "./service-container";
import { ServiceRegistry } from "./service-registry";

import { DatabaseAuditProvider } from "../audit";
import { MemoryCacheProvider, RedisCacheProvider } from "../cache";
import { PDFCertificateProvider } from "../certificate";
import { BrevoSMTPProvider, SESProvider, SMTPProvider } from "../email";
import { PinoLoggerProvider } from "../logger";
import { DatabaseNotificationProvider } from "../notification";
import { RazorpayProvider, StripeProvider } from "../payment";
import { BullMQProvider } from "../queue";
import { S3StorageProvider } from "../storage";

export function createEmailProvider(config: EmailConfig) {
  const provider = config.provider.toLowerCase();

  if (provider === "ses") {
    return new SESProvider(config);
  }

  if (provider === "brevo") {
    return new BrevoSMTPProvider(config);
  }

  return new SMTPProvider(config);
}

export class ServiceFactory {
  static async initializeAll(): Promise<void> {
    try {
      // Load and validate configurations via Zod
      const config = InfrastructureConfig.load();

      // 1. Logger (initialized first to establish service telemetry)
      const loggerProvider = new PinoLoggerProvider(config.logger);
      await loggerProvider.initialize();
      ServiceContainer.register("logger", loggerProvider);
      ServiceRegistry.register("logger", {
        name: "logger",
        version: "1.0.0",
        providerName: "PinoLoggerProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("logger", true);

      // 2. Audit (Database logger connection)
      const auditProvider = new DatabaseAuditProvider();
      await auditProvider.initialize();
      ServiceContainer.register("audit", auditProvider);
      ServiceRegistry.register("audit", {
        name: "audit",
        version: "1.0.0",
        providerName: "DatabaseAuditProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("audit", true);

      // 3. Cache
      let cacheProvider;
      if (config.cache.provider.toLowerCase() === "redis") {
        cacheProvider = new RedisCacheProvider(config.cache);
      } else {
        cacheProvider = new MemoryCacheProvider(config.cache);
      }
      await cacheProvider.initialize();
      ServiceContainer.register("cache", cacheProvider);
      ServiceRegistry.register("cache", {
        name: "cache",
        version: "1.0.0",
        providerName: cacheProvider instanceof RedisCacheProvider ? "RedisCacheProvider" : "MemoryCacheProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("cache", true);

      // 4. Storage
      const storageProvider = new S3StorageProvider(config.storage);
      await storageProvider.initialize();
      ServiceContainer.register("storage", storageProvider);
      ServiceRegistry.register("storage", {
        name: "storage",
        version: "1.0.0",
        providerName: "S3StorageProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("storage", true);

      // 5. Email
      const emailProvider = createEmailProvider(config.email);
      await emailProvider.initialize();
      ServiceContainer.register("email", emailProvider);
      ServiceRegistry.register("email", {
        name: "email",
        version: "1.0.0",
        providerName: emailProvider instanceof SESProvider ? "SESProvider" : emailProvider instanceof BrevoSMTPProvider ? "BrevoSMTPProvider" : "SMTPProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("email", true);

      // 6. Queue
      const queueProvider = new BullMQProvider(config.queue);
      await queueProvider.initialize();
      ServiceContainer.register("queue", queueProvider);
      ServiceRegistry.register("queue", {
        name: "queue",
        version: "1.0.0",
        providerName: "BullMQProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("queue", true);

      // 7. Notification
      const notificationProvider = new DatabaseNotificationProvider(config.notification);
      await notificationProvider.initialize();
      ServiceContainer.register("notification", notificationProvider);
      ServiceRegistry.register("notification", {
        name: "notification",
        version: "1.0.0",
        providerName: "DatabaseNotificationProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("notification", true);

      // 8. Certificate
      const certificateProvider = new PDFCertificateProvider(config.certificate);
      await certificateProvider.initialize();
      ServiceContainer.register("certificate", certificateProvider);
      ServiceRegistry.register("certificate", {
        name: "certificate",
        version: "1.0.0",
        providerName: "PDFCertificateProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("certificate", true);

      // 9. Payment
      let paymentProvider;
      if (config.payment.provider.toLowerCase() === "stripe") {
        paymentProvider = new StripeProvider(config.payment);
      } else {
        paymentProvider = new RazorpayProvider(config.payment);
      }
      await paymentProvider.initialize();
      ServiceContainer.register("payment", paymentProvider);
      ServiceRegistry.register("payment", {
        name: "payment",
        version: "1.0.0",
        providerName: paymentProvider instanceof StripeProvider ? "StripeProvider" : "RazorpayProvider",
        supportsHealth: true,
        supportsLifecycle: true,
        supportsMetrics: true,
      });
      ServiceRegistry.setInitialized("payment", true);

      // Auto-lock container registry outside testing cycles
      if (process.env.NODE_ENV !== "test") {
        ServiceContainer.lock();
      }
    } catch (error) {
      const errMsg = `Service layer initialization failed: ${(error as Error).message}`;
      try {
        ServiceContainer.logger.error(errMsg, { error: (error as Error).message });
      } catch {
        console.error("❌ " + errMsg);
        if (error instanceof Error && error.stack) {
          console.error(error.stack);
        }
      }
      throw new ProviderInitializationException(errMsg, [error]);
    }
  }
}
