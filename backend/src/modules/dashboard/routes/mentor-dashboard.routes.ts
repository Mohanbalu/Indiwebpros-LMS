import { Router } from "express";
import { MentorDashboardController } from "../controllers/mentor-dashboard.controller";
import { authGuard } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 60 });

router.use(authGuard);

router.get("/", readRl, MentorDashboardController.getFullDashboard);
router.get("/students", readRl, MentorDashboardController.getStudents);
router.get("/student/:id", readRl, MentorDashboardController.getStudentDetails);
router.get("/analytics", readRl, MentorDashboardController.getAnalytics);

// Sessions
router.get("/sessions", readRl, MentorDashboardController.getSessions);
router.post("/session", writeRl, MentorDashboardController.createSession);
router.put("/session/:id", writeRl, MentorDashboardController.updateSession);
router.delete("/session/:id", writeRl, MentorDashboardController.deleteSession);

// Feedback
router.post("/feedback", writeRl, MentorDashboardController.createFeedback);
router.put("/feedback/:id", writeRl, MentorDashboardController.updateFeedback);

// Notes
router.post("/note", writeRl, MentorDashboardController.createNote);
router.put("/note/:id", writeRl, MentorDashboardController.updateNote);

export default router;
