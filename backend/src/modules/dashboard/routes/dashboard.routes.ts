import { Router } from "express";
import { StudentDashboardController } from "../controllers/dashboard.controller";
import { ProfileController } from "../controllers/profile.controller";
import { authGuard } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });

router.use(authGuard);

router.get("/", readRl, StudentDashboardController.getFullDashboard);
router.get("/stats", readRl, StudentDashboardController.getStats);
router.get("/continue-learning", readRl, StudentDashboardController.getContinueLearning);
router.get("/courses", readRl, StudentDashboardController.getCourses);
router.get("/certificates", readRl, StudentDashboardController.getCertificates);
router.get("/notifications", readRl, StudentDashboardController.getNotifications);
router.get("/bookmarks", readRl, StudentDashboardController.getBookmarks);
router.get("/notes", readRl, StudentDashboardController.getNotes);
router.get("/quizzes", readRl, StudentDashboardController.getQuizzes);
router.get("/assignments", readRl, StudentDashboardController.getAssignments);
router.get("/security", readRl, StudentDashboardController.getSecurity);

// Profile Tab Dashboard routes
router.get("/profile", readRl, ProfileController.getProfileData);
router.put("/profile", ProfileController.updateProfileSettings);
router.post("/profile/wishlist", ProfileController.toggleWishlist);

export default router;
