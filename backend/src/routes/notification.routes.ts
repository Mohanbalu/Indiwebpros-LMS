import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import rateLimit from "express-rate-limit";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../authorization/middlewares/authorize.middleware";

const router = Router();

// Rate limiter for read operations
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: "Too many notification requests, please slow down",
});

// Rate limiter for write/admin operations
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many write requests, please slow down",
});

// All routes require authentication
router.use(authGuard);

// ─── User Routes (all authenticated roles) ────────────────────────────────

// IMPORTANT: static routes must come BEFORE parameterized /:id routes
router.get("/unread/count", readLimiter, NotificationController.getUnreadCount);
router.get("/unread",       readLimiter, NotificationController.getUnread);
router.get("/",             readLimiter, NotificationController.getAll);
router.get("/:id",          readLimiter, NotificationController.getById);

router.patch("/read-all",      writeLimiter, NotificationController.markAllAsRead);
router.patch("/archive-all",   writeLimiter, NotificationController.archiveAll);
router.patch("/:id/read",      writeLimiter, NotificationController.markAsRead);
router.patch("/:id/archive",   writeLimiter, NotificationController.archive);

router.delete("/",   writeLimiter, NotificationController.deleteAll);
router.delete("/:id", writeLimiter, NotificationController.deleteOne);

// ─── Admin Routes ─────────────────────────────────────────────────────────

router.post("/",          requireRole("Admin"), writeLimiter, NotificationController.create);
router.post("/broadcast", requireRole("Admin"), writeLimiter, NotificationController.broadcast);

export default router;
