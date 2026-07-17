/**
 * Health & Metrics Routes — Milestone 25
 * Registers all observability endpoints on the Express router.
 */

import { NextFunction, Request, Response, Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { env } from "@/config/env";
import { authGuard, authorize } from "@/middlewares/auth";

const healthRouter = Router();

const allowInternalOrAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const expectedKey = process.env.INTERNAL_EMAIL_HEALTH_KEY || process.env.INTERNAL_METRICS_KEY;
  const internalKey = req.header("x-internal-key");

  if (expectedKey && internalKey === expectedKey) {
    next();
    return;
  }

  await authGuard(req, res, (authError?: unknown) => {
    if (authError) {
      next(authError);
      return;
    }

    authorize(["Admin"])(req, res, next);
  });
};

// ── Health Endpoints (All Public — no auth required) ──────────────────────────

/**
 * GET /health
 * Full aggregate health check — all services.
 */
healthRouter.get("/health", HealthController.getHealth);


/**
 * GET /health/email
 * Detailed email provider health. Requires Admin auth or x-internal-key.
 */
healthRouter.get("/health/email", allowInternalOrAdmin, HealthController.getEmailHealth);

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
