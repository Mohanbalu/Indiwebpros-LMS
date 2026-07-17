import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "@/controllers/auth.controller";
import { authGuard } from "@/middlewares/auth";
import { validateSchema } from "@/middlewares/placeholders";
import { ResponseBuilder } from "@/utils/response-builder";
import { APP_CONFIG } from "@/config/app.config";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/validators/auth.validator";

const router = Router();

console.log("DEBUG RATE LIMIT: env.NODE_ENV =", APP_CONFIG.authRateLimit.max, "process.env.NODE_ENV =", process.env.NODE_ENV);

// Strict rate limiter for sensitive authentication endpoints
const authRateLimiter = rateLimit({
  windowMs: APP_CONFIG.authRateLimit.windowMs,
  max: APP_CONFIG.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res) => {
    ResponseBuilder.failure(
      res,
      429,
      APP_CONFIG.authRateLimit.message
    );
  },
});

router.post("/register", authRateLimiter, validateSchema(registerSchema), AuthController.register);
router.post("/login", authRateLimiter, validateSchema(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/refresh", authRateLimiter, AuthController.refresh);
router.post(
  "/forgot-password",
  authRateLimiter,
  validateSchema(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post("/reset-password", authRateLimiter, validateSchema(resetPasswordSchema), AuthController.resetPassword);
router.get("/verify-email", authRateLimiter, AuthController.verifyEmail);
router.post(
  "/resend-verification",
  authRateLimiter,
  validateSchema(forgotPasswordSchema),
  AuthController.resendVerification
);

// Guarded endpoints
router.get("/me", authGuard, AuthController.me);
router.post(
  "/change-password",
  authGuard,
  validateSchema(changePasswordSchema),
  AuthController.changePassword
);

// Device session management endpoints
router.get("/sessions", authGuard, AuthController.listSessions);
router.post("/sessions/:id/revoke", authGuard, AuthController.revokeSession);
router.post("/logout/all", authGuard, AuthController.logoutAllDevices);

export default router;
