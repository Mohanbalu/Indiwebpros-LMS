import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { AuthHelper } from "../helpers/auth.helper";
import { Permission } from "@backend/authorization/constants/permissions";
import { AuthorizationService } from "@backend/authorization/services/authorization.service";
import { CoursePolicy } from "@backend/authorization/policies/course.policy";
import { UserPolicy } from "@backend/authorization/policies/user.policy";
import { correlationMiddleware } from "@backend/middlewares/correlation.middleware";
import { getElapsedMs } from "@backend/middlewares/performance.middleware";
import { mockS3StorageProvider } from "../mocks/s3.mock";
import { mockSESEmailProvider } from "../mocks/ses.mock";
import { mockRazorpayProvider } from "../mocks/razorpay.mock";
import { Request, Response } from "express";

// ─── JWT & Auth Tests ──────────────────────────────────────────────────────────
describe("Unit: JWT Utility", () => {
  const secret = "test_jwt_secret_key_123456_lms_observability";

  it("should generate a valid JWT token", () => {
    const token = AuthHelper.generateToken("user-123", "STUDENT", "15m", secret);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, secret) as any;
    expect(decoded.userId).toBe("user-123");
    expect(decoded.role).toBe("STUDENT");
  });

  it("should fail verification with an incorrect secret key", () => {
    const token = AuthHelper.generateToken("user-123", "STUDENT", "15m", secret);
    expect(() => jwt.verify(token, "wrong-secret-key")).toThrow();
  });
});

// ─── RBAC & Authorization Tests ───────────────────────────────────────────────
describe("Unit: RBAC & Policies", () => {
  const auth = new AuthorizationService();

  it("should evaluate role permissions correctly", () => {
    // Admin permissions
    expect(auth.hasPermission("Admin", Permission.USER_DELETE)).toBe(true);
    expect(auth.hasPermission("Admin", Permission.COURSE_DELETE)).toBe(true);

    // Student boundaries
    expect(auth.hasPermission("Student", Permission.COURSE_READ)).toBe(true);
    expect(auth.hasPermission("Student", Permission.COURSE_CREATE)).toBe(false);
    expect(auth.hasPermission("Student", Permission.USER_DELETE)).toBe(false);

    // Instructor boundaries
    expect(auth.hasPermission("Instructor", Permission.COURSE_CREATE)).toBe(true);
    expect(auth.hasPermission("Instructor", Permission.SYSTEM_ADMIN)).toBe(false);
  });

  it("should check resource ownership", () => {
    expect(auth.checkOwnership("user-123", "user-123")).toBe(true);
    expect(auth.checkOwnership("user-123", "user-456")).toBe(false);
  });

  it("should enforce CoursePolicy rules", () => {
    expect(CoursePolicy.canRead("user-123", "Student")).toBe(true);
    expect(CoursePolicy.canCreate("user-123", "Instructor")).toBe(true);
    expect(CoursePolicy.canCreate("user-123", "Student")).toBe(false);

    // Module modifications checks
    expect(CoursePolicy.canUpdate("instructor-1", "Instructor", "instructor-1")).toBe(true);
    expect(CoursePolicy.canUpdate("instructor-1", "Instructor", "instructor-2")).toBe(false);
    expect(CoursePolicy.canUpdate("admin-1", "Admin", "instructor-2")).toBe(true); // Admin bypass
  });

  it("should enforce UserProfilePolicy rules", () => {
    expect(UserPolicy.canRead("user-123", "Student", "user-123")).toBe(true);
    expect(UserPolicy.canRead("user-123", "Student", "user-456")).toBe(false);
    expect(UserPolicy.canRead("admin-123", "Admin", "user-456")).toBe(true);
  });
});

// ─── Middleware Tests ────────────────────────────────────────────────────────
describe("Unit: Middleware", () => {
  it("should run correlationMiddleware generating request tracing IDs", () => {
    const req = {
      headers: {},
      header: (name: string) => undefined,
    } as unknown as Request;

    const headers = new Map<string, string>();
    const res = {
      setHeader: (name: string, value: string) => {
        headers.set(name.toLowerCase(), value);
      },
    } as unknown as Response;

    const next = vi.fn();

    correlationMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.id).toBeDefined();
    expect(req.correlationId).toBeDefined();
    expect(req.traceId).toHaveLength(32);
    expect(headers.get("x-request-id")).toBe(req.id);
  });

  it("should compute elapsed milliseconds in performance helper", () => {
    const req = {
      startTime: process.hrtime.bigint() - BigInt(10 * 1_000_000), // 10ms ago
    } as unknown as Request;

    const elapsed = getElapsedMs(req);
    expect(elapsed).toBeGreaterThanOrEqual(9);
  });
});

// ─── Storage, Email & Payment Mocks Tests ───────────────────────────────────
describe("Unit: Mock Providers", () => {
  it("should verify mock storage provider health check", async () => {
    const health = await mockS3StorageProvider.health();
    expect(health.status).toBe("healthy");
    expect(health.message).toBe("Storage active");
  });

  it("should upload file successfully via S3 mock provider", async () => {
    const upload = await mockS3StorageProvider.upload(Buffer.from("mock"), "lessons/1.mp4", {
      contentType: "video/mp4",
    });
    expect(upload.bucket).toBe("indiwebpros-lms-test-bucket");
    expect(upload.key).toBe("lessons/1.mp4");
    expect(upload.url).toContain("1.mp4");
  });

  it("should verify mock email delivery execution", async () => {
    const emailHealth = await mockSESEmailProvider.health();
    expect(emailHealth.status).toBe("healthy");

    const spy = vi.spyOn(mockSESEmailProvider, "send");
    await mockSESEmailProvider.send("test@indiwebpros.in", "Welcome", "<h1>Hello</h1>");
    expect(spy).toHaveBeenCalledWith("test@indiwebpros.in", "Welcome", "<h1>Hello</h1>");
  });

  it("should create orders and verify payments via Razorpay mock", async () => {
    const order = await mockRazorpayProvider.createOrder("receipt_001", 999.0);
    expect(order.id).toBeDefined();
    expect(order.amount).toBe(99900); // 999.00 * 100 paise

    const verify = await mockRazorpayProvider.verifyPayment(order.id, "pay_001", "sig_001");
    expect(verify).toBe(true);
  });
});
