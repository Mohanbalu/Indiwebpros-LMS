import { ILoggerService } from "../interfaces/logger-service.interface";
   import { ILifecycleService } from "../../shared/lifecycle.interface";
   import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
   import { IMetricsService } from "../../shared/metrics.interface";
   import { LoggerConfig } from "../../shared/config.schema";
   import { logger } from "@/utils/logger";

   export class PinoLoggerProvider implements ILoggerService, ILifecycleService, IHealthCheckService, IMetricsService {
     private config: LoggerConfig;
     private metricsRecord: Record<string, number> = { logs_info: 0, logs_warn: 0, logs_error: 0 };

     constructor(config: LoggerConfig) {
       this.config = config;
     }

     async initialize(): Promise<void> {
       logger.info(`PinoLoggerProvider initialized in env=${this.config.env} level=${this.config.level}`);
     }

     info(message: string, context?: Record<string, unknown>): void {
       this.metricsRecord.logs_info++;
       if (context) {
         logger.info(context, message);
       } else {
         logger.info(message);
       }
     }

     warn(message: string, context?: Record<string, unknown>): void {
       this.metricsRecord.logs_warn++;
       if (context) {
         logger.warn(context, message);
       } else {
         logger.warn(message);
       }
     }

     error(message: string | Error, context?: Record<string, unknown>): void {
       this.metricsRecord.logs_error++;
       if (message instanceof Error) {
         logger.error(message, message.message, context);
       } else if (context) {
         logger.error(context, message);
       } else {
         logger.error(message);
       }
     }

     debug(message: string, context?: Record<string, unknown>): void {
       if (context) {
         logger.debug(context, message);
       } else {
         logger.debug(message);
       }
     }

     audit(message: string, context?: Record<string, unknown>): void {
       const auditContext = { ...context, isAuditEvent: true };
       logger.info(auditContext, `[AUDIT] ${message}`);
     }

     // Health Check
     async health(): Promise<HealthStatus> {
       return {
         service: "logger",
         status: "healthy",
         latency: 0,
         message: "Pino logger ready",
         timestamp: new Date().toISOString(),
       };
     }

     // Metrics
     async metrics(): Promise<Record<string, unknown>> {
       return { ...this.metricsRecord };
     }

     async resetMetrics(): Promise<void> {
       this.metricsRecord = { logs_info: 0, logs_warn: 0, logs_error: 0 };
     }

     async recordMetric(name: string, value: number): Promise<void> {
       this.metricsRecord[name] = value;
     }
   }
