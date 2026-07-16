import { Router } from "express";
import { EmailController } from "../controllers/email.controller";
import rateLimit from "express-rate-limit";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../authorization/middlewares/authorize.middleware";

const router = Router();

// Rate limiting for email test endpoints
const emailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many email requests from this IP, please try again later",
});

// Protect all test endpoints
router.use(authGuard);
router.use(requireRole("Admin"));
router.use(emailRateLimiter);

router.post("/send-test", EmailController.sendTest);
router.post("/resend-verification", EmailController.resendVerification);
router.post("/send-password-reset", EmailController.sendPasswordReset);

export default router;
