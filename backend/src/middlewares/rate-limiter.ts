import rateLimit from "express-rate-limit";
import { APP_CONFIG } from "@/config/app.config";
import { ResponseBuilder } from "@/utils/response-builder";

export const rateLimiter = rateLimit({
  windowMs: APP_CONFIG.rateLimit.windowMs,
  max: APP_CONFIG.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseBuilder.failure(res, 429, APP_CONFIG.rateLimit.message);
  },
});
