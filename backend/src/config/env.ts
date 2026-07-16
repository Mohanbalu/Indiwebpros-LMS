import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  AWS_REGION: z.string().min(1),
  AWS_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY: z.string().min(1),
  AWS_SECRET_KEY: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.string().default("mock-rzp-key"),
  RAZORPAY_KEY_SECRET: z.string().default("mock-rzp-secret"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("mock-rzp-webhook-secret"),
  // AWS Secrets Manager (production secret loading)
  AWS_SECRET_ARN: z.string().optional(),
  // CloudFront CDN (optional — omit to use direct S3 signed URLs)
  CLOUDFRONT_URL: z.string().url().optional(),
  CLOUDFRONT_KEY_PAIR_ID: z.string().optional(),
  // Application version (injected by npm/pnpm at runtime)
  npm_package_version: z.string().optional(),
  // Observability: protect /metrics in production
  INTERNAL_METRICS_KEY: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
export type EnvType = z.infer<typeof envSchema>;
