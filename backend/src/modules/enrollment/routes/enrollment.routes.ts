import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const rl = rateLimit({ windowMs: 60_000, max: 60 });

// ── Enrollment Router ──────────────────────────
const enrollmentRouter = Router();
enrollmentRouter.get("/", authGuard, rl, EnrollmentController.listAll);
enrollmentRouter.get("/:id", authGuard, rl, EnrollmentController.getEnrollmentDetails);

// ── My Courses Router ──────────────────────────
const myCoursesRouter = Router();
myCoursesRouter.get("/", authGuard, rl, EnrollmentController.getMyCourses);

// ── Admin Enrollments Router ───────────────────
const adminEnrollmentRouter = Router();
adminEnrollmentRouter.post("/grant", authGuard, authorize(["Admin"]), rl, EnrollmentController.grantEnrollment);
adminEnrollmentRouter.patch("/:id/expire", authGuard, authorize(["Admin"]), rl, EnrollmentController.expireEnrollment);
adminEnrollmentRouter.patch("/:id/cancel", authGuard, authorize(["Admin"]), rl, EnrollmentController.cancelEnrollment);

export { enrollmentRouter, myCoursesRouter, adminEnrollmentRouter };
