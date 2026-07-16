/**
 * Health Controller — Milestone 25
 * Handles all health check endpoints.
 *
 * Routes:
 *   GET /health          → Full aggregate health report
 *   GET /health/live     → Liveness probe (process alive)
 *   GET /health/ready    → Readiness probe (DB + S3 + SES)
 *   GET /health/startup  → Startup probe (config + services)
 */

import { Request, Response } from "express";
import { HealthService } from "../services/health.service";
import { MetricsService } from "../services/metrics.service";

export class HealthController {
  /**
   * GET /health
   * Full aggregate health report — all services.
   */
  static async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const report = await HealthService.getFullHealth();
      const statusCode = report.status === "unhealthy" ? 503 : 200;
      res.status(statusCode).json({ success: report.status !== "unhealthy", ...report });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
        error: (error as Error).message,
      });
    }
  }

  /**
   * GET /health/live
   * Kubernetes liveness probe — is the process alive and not OOM?
   * Fast — no external calls. Returns 200 or 503.
   */
  static getLiveness(_req: Request, res: Response): void {
    const report = HealthService.getLiveness();
    const statusCode = report.status === "unhealthy" ? 503 : 200;
    res.status(statusCode).json({ success: report.status !== "unhealthy", ...report });
  }

  /**
   * GET /health/ready
   * Kubernetes readiness probe — can the app serve traffic?
   * Checks: DB + Storage + Email connectivity.
   */
  static async getReadiness(_req: Request, res: Response): Promise<void> {
    try {
      const report = await HealthService.getReadiness();
      const statusCode = report.status === "unhealthy" ? 503 : 200;
      res.status(statusCode).json({ success: report.status !== "unhealthy", ...report });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        message: "Readiness check failed",
      });
    }
  }

  /**
   * GET /health/startup
   * Kubernetes startup probe — has the app finished initializing?
   * Checks: config loaded, services registered, DB schema migrated.
   */
  static async getStartup(_req: Request, res: Response): Promise<void> {
    try {
      const report = await HealthService.getStartup();
      const statusCode = report.status === "unhealthy" ? 503 : 200;
      res.status(statusCode).json({ success: report.status !== "unhealthy", ...report });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        message: "Startup check failed",
      });
    }
  }

  /**
   * GET /metrics
   * Returns current metrics snapshot.
   * In production: admin only.
   * In development: public.
   */
  static getMetrics(_req: Request, res: Response): void {
    const snapshot = MetricsService.getSnapshot();
    res.status(200).json({
      success: true,
      data: snapshot,
    });
  }
}
