import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Server } from "http";
import { env } from "@/config/env";
import { APP_CONFIG } from "@/config/app.config";
import { DatabaseProvider } from "@/database/provider";
import { correlationMiddleware } from "@/middlewares/correlation.middleware";
import { performanceMiddleware } from "@/middlewares/performance.middleware";
import { requestLoggerMiddleware } from "@/middlewares/request-logger";
import { rateLimiter } from "@/middlewares/rate-limiter";
import { notFoundHandler } from "@/middlewares/not-found";
import { errorHandler } from "@/middlewares/error-handler";
import apiRouter from "@/routes";
import { logger } from "@/utils/logger";

import { ServiceContainer, ServiceFactory } from "@/services";
import { loadSecrets } from "@/config/secrets";

const app = express();

// Trust Proxy for load balancers in production
app.set("trust proxy", 1);

// Security, parsing and compression
app.use(helmet());
app.use(cors(APP_CONFIG.cors));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: APP_CONFIG.requestLimit }));
app.use(express.urlencoded({ extended: true, limit: APP_CONFIG.requestLimit }));

// Correlation IDs: requestId + correlationId + traceId (W3C traceparent ready)
app.use(correlationMiddleware);

// High-resolution performance timer — records to MetricsService on response
app.use(performanceMiddleware);

// Structured JSON request/response logger
app.use(requestLoggerMiddleware);

// Global Rate Limiter
app.use(rateLimiter);

// Versioned APIs
app.use(APP_CONFIG.apiPrefix, apiRouter);

// Fallbacks
app.use(notFoundHandler);
app.use(errorHandler);

let server: Server;

async function startServer() {
  // Step 0: Load secrets from AWS Secrets Manager (production only; no-op in dev)
  await loadSecrets();

  // Initialize and validate all dynamic infrastructure services in dependency order
  await ServiceFactory.initializeAll();

  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  // Connect to database in the background
  DatabaseProvider.connect().catch((err) => {
    logger.error(err as Error, "Background database connection failed");
  });
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // 1. Stop Queue (if active)
  try {
    const queue = ServiceContainer.queue as unknown as Record<string, unknown>;
    if (queue && typeof queue.disconnect === "function") {
      await (queue.disconnect as () => Promise<void>)();
      logger.info("Queue service disconnected.");
    }
  } catch (err) {
    logger.error(err as Error, "Error shutting down Queue service");
  }

  // 2. Disconnect Cache (if active)
  try {
    const cache = ServiceContainer.cache as unknown as Record<string, unknown>;
    if (cache && typeof cache.disconnect === "function") {
      await (cache.disconnect as () => Promise<void>)();
      logger.info("Cache service disconnected.");
    }
  } catch (err) {
    logger.error(err as Error, "Error shutting down Cache service");
  }

  // 3. Close Database
  try {
    await DatabaseProvider.disconnect();
    logger.info("Database connection closed.");
  } catch (err) {
    logger.error(err as Error, "Error closing database connection");
  }

  if (server) {
    logger.info("Stopping HTTP server...");
    server.close(async () => {
      logger.info("HTTP server stopped.");

      // 4. Teardown all other services
      const services = ["storage", "email", "payment", "notification", "certificate", "audit"];
      for (const name of services) {
        try {
          const svc = ServiceContainer.get<Record<string, unknown>>(name);
          if (svc && typeof svc.shutdown === "function") {
            await (svc.shutdown as () => Promise<void>)();
          }
        } catch {
          // Ignore if service not registered
        }
      }

      logger.info("Graceful shutdown complete. Exiting process.");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forcing shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// System shutdown and error listeners
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error(error, "Uncaught Exception detected");
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error(new Error(String(reason)), "Unhandled Rejection detected");
  gracefulShutdown("unhandledRejection");
});

if (env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
  });
}

export default app;
