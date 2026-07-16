/**
 * Health & Metrics Routes — Milestone 25
 * Registers all observability endpoints on the Express router.
 */

import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { env } from "@/config/env";

const healthRouter = Router();

// ── Health Endpoints (All Public — no auth required) ──────────────────────────

/**
 * GET /health
 * Full aggregate health check — all services.
 */
healthRouter.get("/health", HealthController.getHealth);

/**
 * GET /health/live
 * Liveness probe — process alive + memory.
 */
healthRouter.get("/health/live", HealthController.getLiveness);

/**
 * GET /health/ready
 * Readiness probe — DB + S3 + SES.
 */
healthRouter.get("/health/ready", HealthController.getReadiness);

/**
 * GET /health/startup
 * Startup probe — config + services + schema.
 */
healthRouter.get("/health/startup", HealthController.getStartup);

// ── Metrics Endpoint ──────────────────────────────────────────────────────────

/**
 * GET /metrics
 * In development: public.
 * In production: returns 403 (protect with admin auth if needed).
 */
healthRouter.get("/metrics", (req, res, next) => {
  if (env.NODE_ENV === "production") {
    // In production, require admin authorization header
    // For now: block unless internal (can be extended with RBAC middleware)
    const internalKey = req.header("x-internal-key");
    const expectedKey = process.env.INTERNAL_METRICS_KEY;
    if (expectedKey && internalKey !== expectedKey) {
      res.status(403).json({
        success: false,
        message: "Metrics endpoint requires authentication in production",
      });
      return;
    }
  }
  next();
}, HealthController.getMetrics);

export default healthRouter;
