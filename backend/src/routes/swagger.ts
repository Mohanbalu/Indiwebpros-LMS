import { Router } from "express";

const router = Router();

// Placeholder for Swagger UI setup. Will render Swagger documentation in future milestones.
router.get("/docs", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Swagger API Documentation Placeholder",
    documentationUrl: "/api/v1/docs/json",
  });
});

export default router;
