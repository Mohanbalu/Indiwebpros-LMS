import { env } from "./env";

export const APP_CONFIG = {
  name: "IndiWebPros LMS Backend",
  version: "v1",
  apiPrefix: "/api/v1",
  cors: {
    origin: env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // limit each IP to 10000 requests per windowMs (raised for E2E tests)
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (raised for testing)
    message: "Too many requests to authentication services. Please try again in 15 minutes.",
  },
  requestLimit: "10mb", // Body parser size limit
};
