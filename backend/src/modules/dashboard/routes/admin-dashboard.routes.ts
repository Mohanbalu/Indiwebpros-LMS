import { Router } from "express";
import { AdminDashboardController } from "../controllers/admin-dashboard.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 60 });
const adminGuard = authorize(["Admin"]);

router.use(authGuard);
router.use(adminGuard);

router.get("/dashboard", readRl, AdminDashboardController.getFullDashboard);

// Users
router.get("/users", readRl, AdminDashboardController.getUsers);
router.get("/users/:id", readRl, AdminDashboardController.getUserById);
router.patch("/users/:id/status", writeRl, AdminDashboardController.updateUserStatus);
router.patch("/users/:id/role", writeRl, AdminDashboardController.updateUserRole);
router.post("/users/:id/logout", writeRl, AdminDashboardController.logoutUserSessions);

// Courses
router.get("/courses", readRl, AdminDashboardController.getCourses);
router.patch("/courses/:id/publish", writeRl, AdminDashboardController.publishCourse);
router.patch("/courses/:id/archive", writeRl, AdminDashboardController.archiveCourse);

// Enrollments
router.get("/enrollments", readRl, AdminDashboardController.getEnrollments);

// Certificates
router.get("/certificates", readRl, AdminDashboardController.getCertificates);
router.post("/certificates/regenerate", writeRl, AdminDashboardController.regenerateCertificate);

// Analytics, Audits, Storage, Health
router.get("/analytics", readRl, AdminDashboardController.getAnalytics);
router.get("/audit", readRl, AdminDashboardController.getAuditLogs);
router.get("/storage", readRl, AdminDashboardController.getStorageStats);
router.get("/system-health", readRl, AdminDashboardController.getSystemHealth);

export default router;
