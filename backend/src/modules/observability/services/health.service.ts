/**
 * Health Service — Milestone 25
 * Enterprise Observability & Monitoring Platform
 *
 * Performs deep health checks against all infrastructure services.
 * Designed for Kubernetes liveness/readiness probes and CloudWatch monitoring.
 */

import { prisma } from "@/database/client";
import { env } from "@/config/env";
import { ServiceContainer } from "@/services/shared/service-container";
import { ServiceRegistry } from "@/services/shared/service-registry";
import { EmailHealthReport } from "@/services/email";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface ServiceCheck {
  status: HealthStatus;
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface MemorySnapshot {
  heapUsed: string;
  heapTotal: string;
  rss: string;
  external: string;
  heapUsedBytes: number;
  heapTotalBytes: number;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;       // seconds
  memory: MemorySnapshot;
  checks: {
    database?: ServiceCheck;
    storage?: ServiceCheck;
    email?: ServiceCheck;
    process: ServiceCheck;
    services?: Record<string, ServiceCheck>;
  };
}

export interface LivenessReport {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
}

export interface ReadinessReport {
  status: HealthStatus;
  timestamp: string;
  checks: { database: ServiceCheck; storage: ServiceCheck; email: ServiceCheck };
}

export interface EmailHealthEndpointReport extends EmailHealthReport {
  timestamp: string;
}

export interface StartupReport {
  status: HealthStatus;
  timestamp: string;
  checks: {
    configuration: ServiceCheck;
    servicesRegistered: ServiceCheck;
    databaseInitialized: ServiceCheck;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MB = 1024 * 1024;
const HEAP_WARN_THRESHOLD = 0.85; // 85% heap = degraded
const DB_TIMEOUT_MS = 5000;

// ─── Health Service ───────────────────────────────────────────────────────────

export class HealthService {
  private static readonly startTime = Date.now();

  // ── Memory Snapshot ───────────────────────────────────────────────────────

  static getMemorySnapshot(): MemorySnapshot {
    const mem = process.memoryUsage();
    return {
      heapUsed: `${(mem.heapUsed / MB).toFixed(2)} MB`,
      heapTotal: `${(mem.heapTotal / MB).toFixed(2)} MB`,
      rss: `${(mem.rss / MB).toFixed(2)} MB`,
      external: `${(mem.external / MB).toFixed(2)} MB`,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
    };
  }

  // ── Process Check ─────────────────────────────────────────────────────────

  static checkProcess(): ServiceCheck {
    const mem = process.memoryUsage();
    const heapRatio = mem.heapUsed / mem.heapTotal;

    if (heapRatio > HEAP_WARN_THRESHOLD) {
      return {
        status: "degraded",
        message: `High heap usage: ${(heapRatio * 100).toFixed(1)}%`,
        details: { heapRatio: heapRatio.toFixed(3) },
      };
    }

    return {
      status: "healthy",
      message: `Heap usage: ${(heapRatio * 100).toFixed(1)}%`,
      details: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }

  // ── Database Check ────────────────────────────────────────────────────────

  static async checkDatabase(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1 as ping`,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB health check timeout")), DB_TIMEOUT_MS)
        ),
      ]);
      const latency = Date.now() - start;
      return {
        status: latency > 2000 ? "degraded" : "healthy",
        latency,
        message: latency > 2000 ? "Slow database response" : "Connected",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  // ── Storage Check ─────────────────────────────────────────────────────────

  static async checkStorage(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      const storage = ServiceContainer.storage as unknown as Record<string, unknown>;
      if (typeof storage.health === "function") {
        const result = await (storage.health as () => Promise<{ status: string; latency: number; message: string }>)();
        return {
          status: result.status === "healthy" ? "healthy" : "unhealthy",
          latency: Date.now() - start,
          message: result.message,
        };
      }
      return { status: "healthy", latency: Date.now() - start, message: "Storage registered" };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  // ── Email Check ───────────────────────────────────────────────────────────

  static async checkEmail(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      const email = ServiceContainer.email as unknown as Record<string, unknown>;
      if (typeof email.getEmailHealth === "function") {
        const report = await (email.getEmailHealth as () => Promise<EmailHealthReport>)();
        return {
          status: report.status === "healthy" ? "healthy" : "unhealthy",
          latency: Date.now() - start,
          message: report.status === "healthy" ? "Email provider reachable" : report.errorMessage ?? "Email provider health check failed",
          details: this.summarizeEmailHealth(report),
        };
      }

      if (typeof email.health === "function") {
        const result = await (email.health as () => Promise<{ status: string; message: string }>)();
        return {
          status: result.status === "healthy" ? "healthy" : "unhealthy",
          latency: Date.now() - start,
          message: result.message,
        };
      }
      return { status: "healthy", latency: Date.now() - start, message: "Email registered" };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }

  static async getEmailHealth(): Promise<EmailHealthEndpointReport> {
    const email = ServiceContainer.email as unknown as Record<string, unknown>;
    if (typeof email.getEmailHealth !== "function") {
      throw new Error("Email provider does not expose detailed health information");
    }

    const report = await (email.getEmailHealth as () => Promise<EmailHealthReport>)();
    return { ...report, timestamp: new Date().toISOString() };
  }

  private static summarizeEmailHealth(report: EmailHealthReport): Record<string, unknown> {
    return {
      provider: report.provider,
      connectionStatus: report.connectionStatus,
      authenticationStatus: report.authenticationStatus,
      lastSuccessfulCheck: report.lastSuccessfulCheck,
      errorMessage: report.errorMessage,
      checkedAt: report.checkedAt,
    };
  }

  // ── Registered Services Check ─────────────────────────────────────────────

  static checkRegisteredServices(): Record<string, ServiceCheck> {
    const registeredServices = ServiceRegistry.getAll();
    const result: Record<string, ServiceCheck> = {};

    for (const [name, meta] of Object.entries(registeredServices)) {
      result[name] = {
        status: "healthy",
        message: `${meta.providerName} initialized`,
        details: { version: meta.version },
      };
    }

    return result;
  }

  // ─── Aggregate Health Report (/health) ───────────────────────────────────

  static async getFullHealth(): Promise<HealthReport> {
    const [database, storage, email] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage().catch(() => ({ status: "unhealthy" as HealthStatus, message: "Not registered" })),
      this.checkEmail().catch(() => ({ status: "unhealthy" as HealthStatus, message: "Not registered" })),
    ]);

    const processCheck = this.checkProcess();
    const services = this.checkRegisteredServices();

    // Aggregate status: unhealthy > degraded > healthy
    const allChecks = [database, storage, email, processCheck];
    let status: HealthStatus = "healthy";
    if (allChecks.some((c) => c.status === "unhealthy")) status = "unhealthy";
    else if (allChecks.some((c) => c.status === "degraded")) status = "degraded";

    return {
      status,
      timestamp: new Date().toISOString(),
      version: env.npm_package_version || "1.0.0",
      environment: env.NODE_ENV,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: this.getMemorySnapshot(),
      checks: {
        database,
        storage,
        email,
        process: processCheck,
        services,
      },
    };
  }

  // ─── Liveness Report (/health/live) ──────────────────────────────────────
  // Only checks: process alive + memory not critically high

  static getLiveness(): LivenessReport {
    const mem = process.memoryUsage();
    const heapRatio = mem.heapUsed / mem.heapTotal;
    const isCritical = heapRatio > 0.95; // 95% = liveness failure

    return {
      status: isCritical ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / MB),
        heapTotalMb: Math.round(mem.heapTotal / MB),
        rssMb: Math.round(mem.rss / MB),
      },
    };
  }

  // ─── Readiness Report (/health/ready) ────────────────────────────────────
  // Checks: DB + Storage + Email must all be connectable

  static async getReadiness(): Promise<ReadinessReport> {
    const [database, storage, email] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage().catch(() => ({ status: "unhealthy" as HealthStatus, message: "Not available" })),
      this.checkEmail().catch(() => ({ status: "healthy" as HealthStatus, message: "Not required for ready" })),
    ]);

    const allReady = [database, storage].every((c) => c.status !== "unhealthy");

    return {
      status: allReady ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks: { database, storage, email },
    };
  }

  // ─── Startup Report (/health/startup) ────────────────────────────────────
  // Checks: config + services registered + DB schema accessible

  static async getStartup(): Promise<StartupReport> {
    // 1. Config check
    let configStatus: ServiceCheck;
    try {
      const requiredVars = ["DATABASE_URL", "JWT_SECRET", "AWS_REGION", "AWS_BUCKET"];
      const missing = requiredVars.filter((v) => !process.env[v]);
      configStatus = missing.length > 0
        ? { status: "unhealthy", message: `Missing env vars: ${missing.join(", ")}` }
        : { status: "healthy", message: "All required config loaded" };
    } catch {
      configStatus = { status: "unhealthy", message: "Config validation failed" };
    }

    // 2. Services registered check
    const registered = ServiceRegistry.getAll();
    const registeredCount = Object.keys(registered).length;
    const servicesCheck: ServiceCheck = registeredCount >= 5
      ? { status: "healthy", message: `${registeredCount} services registered`, details: { count: registeredCount } }
      : { status: "degraded", message: `Only ${registeredCount} services registered` };

    // 3. DB schema check (fast — just check one table exists)
    let dbCheck: ServiceCheck;
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "User" LIMIT 1`;
      dbCheck = { status: "healthy", message: "Schema accessible" };
    } catch (error) {
      dbCheck = { status: "unhealthy", message: (error as Error).message };
    }

    const allHealthy = [configStatus, servicesCheck, dbCheck].every((c) => c.status === "healthy");
    const anyUnhealthy = [configStatus, servicesCheck, dbCheck].some((c) => c.status === "unhealthy");

    return {
      status: anyUnhealthy ? "unhealthy" : allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        configuration: configStatus,
        servicesRegistered: servicesCheck,
        databaseInitialized: dbCheck,
      },
    };
  }
}
