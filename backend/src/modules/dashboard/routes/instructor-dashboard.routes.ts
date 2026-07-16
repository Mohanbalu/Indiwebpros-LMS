import { Router } from "express";
import { InstructorDashboardController } from "../controllers/instructor-dashboard.controller";
import { authGuard } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });

router.use(authGuard);

router.get("/", readRl, InstructorDashboardController.getFullDashboard);
router.get("/stats", readRl, InstructorDashboardController.getStats);
router.get("/courses", readRl, InstructorDashboardController.getCourses);
router.get("/course/:courseId", readRl, InstructorDashboardController.getCourseDetails);
router.get("/students", readRl, InstructorDashboardController.getStudents);
router.get("/assignments", readRl, InstructorDashboardController.getAssignments);
router.get("/quizzes", readRl, InstructorDashboardController.getQuizzes);
router.get("/certificates", readRl, InstructorDashboardController.getCertificates);
router.get("/notifications", readRl, InstructorDashboardController.getNotifications);
router.get("/analytics", readRl, InstructorDashboardController.getAnalytics);

export default router;
