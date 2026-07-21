import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// Initialize test environment
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

import app from "@backend/app";
import { prismaTest, DbHelper } from "../helpers/db.helper";
import { Factories } from "../factories/factories";
import { AuthHelper } from "../helpers/auth.helper";
import { RoleType } from "@backend/generated/client";

describe("Security: Vulnerability Defenses (OWASP)", () => {
  beforeEach(async () => {
    await DbHelper.clear();
  });

  afterAll(async () => {
    await DbHelper.clear();
    await DbHelper.disconnect();
  });

  // ─── 1. JWT Tampering & Expiry ──────────────────────────────────────────────
  describe("JWT Token Security", () => {
    it("should reject a JWT token signed with an invalid secret", async () => {
      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      const badToken = AuthHelper.generateToken(
        student.id,
        RoleType.STUDENT,
        "15m",
        "completely_wrong_secret_key"
      );

      await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${badToken}`)
        .expect(401);
    });

    it("should reject an expired JWT token", async () => {
      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      // Token expired 1 hour ago
      const expiredToken = AuthHelper.generateToken(student.id, RoleType.STUDENT, "-1h");

      await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });

    it("should reject a JWT token using 'none' algorithm tampering", async () => {
      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });

      // Construct a token with alg 'none' header
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(
        JSON.stringify({ userId: student.id, role: RoleType.STUDENT })
      ).toString("base64url");
      const tamperedToken = `${header}.${payload}.`;

      await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });

  // ─── 2. Privilege Escalation & RBAC Boundaries ──────────────────────────────
  describe("Privilege Escalation & Access Control Boundaries", () => {
    it("should prevent a student from accessing admin dashboard routes", async () => {
      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      const headers = AuthHelper.authHeaders(student.id, RoleType.STUDENT);

      const res = await request(app)
        .get("/api/v1/admin/stats") // admin dashboard stats endpoint
        .set(headers)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("You do not have permission to access this resource");
    });
  });

  // ─── 3. IDOR Defenses ───────────────────────────────────────────────────────
  describe("IDOR (Insecure Direct Object Reference) Protection", () => {
    it("should block user A from viewing user B's notifications", async () => {
      const userA = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      const userB = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });

      const headersA = AuthHelper.authHeaders(userA.id, RoleType.STUDENT);

      // Create notification for user B
      const notificationB = await prismaTest.notification.create({
        data: {
          userId: userB.id,
          title: "Secret User B Notification",
          message: "Confidential info",
          type: "SECURITY",
        },
      });

      // User A attempts to read or update user B's notification status
      await request(app)
        .patch(`/api/v1/notifications/${notificationB.id}/read`)
        .set(headersA)
        .expect(404); // returns 404 or 403 because it belongs to B (IDOR protection)
    });
  });

  // ─── 4. SQL Injection Sanitization ──────────────────────────────────────────
  describe("Input Injection (SQLi) Sanitization", () => {
    it("should sanitize and escape database inputs protecting against SQLi", async () => {
      // Send a query containing SQL injection payload
      const sqliPayload = "student@indiwebpros.in' OR '1'='1";

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: sqliPayload, password: "somePassword" })
        .expect(400); // should reject at input validation layer

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Validation failed");
    });
  });

  // ─── 5. Payment Signature Mismatches ────────────────────────────────────────
  describe("Razorpay Webhook Fake Signatures", () => {
    it("should acknowledge webhook with 200 even for invalid signature (Razorpay best practice)", async () => {
      await request(app)
        .post("/api/v1/payments/razorpay/webhook")
        .set("x-razorpay-signature", "fake_signature_hash")
        .send({
          event: "payment.captured",
          payload: { payment: { entity: { id: "pay_123", amount: 1000 } } },
        })
        .expect(200); // Always 200 to prevent Razorpay retry storms
    });
  });

  // ─── 6. Authentication Rate Limiting (SEC-01) ────────────────────────────────
  describe("Authentication Rate Limiting (SEC-01)", () => {
    it("should block requests with HTTP 429 after exceeding limit on registration route", async () => {
      // Limit is 10 requests per 15 minutes, we send 11 requests
      const requests = Array.from({ length: 11 }, () =>
        request(app).post("/api/v1/auth/register").send({ email: "invalid-email", password: "pwd" })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((res) => res.status);

      // At least one request (the 11th) should trigger a 429 Too Many Requests
      expect(statuses).toContain(429);
    });

    it("should block requests with HTTP 429 after exceeding limit on password reset route", async () => {
      const requests = Array.from({ length: 11 }, () =>
        request(app).post("/api/v1/auth/reset-password").send({ email: "invalid-email" })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((res) => res.status);
      expect(statuses).toContain(429);
    });
  });

  // ─── 7. Quiz & Question Ownership Boundaries (SEC-02) ────────────────────────
  describe("Quiz & Question Creator Ownership Validations (SEC-02)", () => {
    let category: any;
    let instructorA: any;
    let instructorB: any;
    let admin: any;
    let courseA: any;
    let quizA: any;
    let questionA: any;
    let optionA: any;

    beforeEach(async () => {
      category = await Factories.createCategory(prismaTest);

      const instructorRole = await prismaTest.role.upsert({
        where: { name: "Instructor" },
        update: {},
        create: { id: randomUUID(), name: "Instructor", description: "Instructor Role" },
      });

      const adminRole = await prismaTest.role.upsert({
        where: { name: "Admin" },
        update: {},
        create: { id: randomUUID(), name: "Admin", description: "Admin Role" },
      });

      const passwordHash = await bcrypt.hash("Password@123", 10);

      instructorA = await prismaTest.user.create({
        data: {
          id: randomUUID(),
          roleId: instructorRole.id,
          email: `instA_${randomUUID().substring(0, 8)}@test.com`,
          password: passwordHash,
          firstName: "Instructor",
          lastName: "A",
          isEmailVerified: true,
          status: "ACTIVE",
        },
      });

      instructorB = await prismaTest.user.create({
        data: {
          id: randomUUID(),
          roleId: instructorRole.id,
          email: `instB_${randomUUID().substring(0, 8)}@test.com`,
          password: passwordHash,
          firstName: "Instructor",
          lastName: "B",
          isEmailVerified: true,
          status: "ACTIVE",
        },
      });

      admin = await prismaTest.user.create({
        data: {
          id: randomUUID(),
          roleId: adminRole.id,
          email: `admin_${randomUUID().substring(0, 8)}@test.com`,
          password: passwordHash,
          firstName: "Admin",
          lastName: "User",
          isEmailVerified: true,
          status: "ACTIVE",
        },
      });

      courseA = await Factories.createCourse(prismaTest, {
        categoryId: category.id,
        instructorId: instructorA.id,
        title: "Instructor A Course",
        status: "PUBLISHED",
      });

      quizA = await prismaTest.quiz.create({
        data: {
          courseId: courseA.id,
          title: "Quiz A Title",
          status: "DRAFT",
          createdBy: instructorA.id,
        },
      });

      questionA = await prismaTest.quizQuestion.create({
        data: {
          quizId: quizA.id,
          questionType: "MULTIPLE_CHOICE_SINGLE",
          question: "What is 2+2?",
        },
      });

      optionA = await prismaTest.quizOption.create({
        data: {
          questionId: questionA.id,
          text: "4",
          isCorrect: true,
        },
      });
    });

    it("should block Instructor B from creating a quiz in Course A (ownership check)", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app)
        .post("/api/v1/quizzes")
        .set(headers)
        .send({
          courseId: courseA.id,
          title: "Quiz B Title",
          status: "DRAFT",
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to create a quiz");
    });

    it("should block Instructor B from updating Instructor A's Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app)
        .put(`/api/v1/quizzes/${quizA.id}`)
        .set(headers)
        .send({ title: "Updated Quiz A Title" })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to update");
    });

    it("should block Instructor B from deleting Instructor A's Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app).delete(`/api/v1/quizzes/${quizA.id}`).set(headers).expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to delete");
    });

    it("should block Instructor B from adding a question to Instructor A's Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app)
        .post(`/api/v1/quizzes/${quizA.id}/questions`)
        .set(headers)
        .send({
          questionType: "TRUE_FALSE",
          question: "Is security important?",
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to add questions");
    });

    it("should block Instructor B from updating questions inside Instructor A's Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app)
        .put(`/api/v1/quizzes/questions/${questionA.id}`)
        .set(headers)
        .send({ question: "Modified question?" })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to update questions");
    });

    it("should block Instructor B from adding options to questions inside Instructor A's Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app)
        .post(`/api/v1/quizzes/questions/${questionA.id}/options`)
        .set(headers)
        .send({ text: "Option text", isCorrect: false })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to add options");
    });

    it("should block Instructor B from updating options inside Instructor A's Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorB.id, "Instructor");
      const res = await request(app)
        .put(`/api/v1/quizzes/options/${optionA.id}`)
        .set(headers)
        .send({ text: "Modified text" })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized to update options");
    });

    it("should allow Instructor A to successfully update their own Quiz A", async () => {
      const headers = AuthHelper.authHeaders(instructorA.id, "Instructor");
      const res = await request(app)
        .put(`/api/v1/quizzes/${quizA.id}`)
        .set(headers)
        .send({ title: "Instructor A New Title" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Instructor A New Title");
    });

    it("should allow Admin to successfully bypass ownership verification and update Quiz A", async () => {
      const headers = AuthHelper.authHeaders(admin.id, "Admin");
      const res = await request(app)
        .put(`/api/v1/quizzes/${quizA.id}`)
        .set(headers)
        .send({ title: "Admin Bypass Title" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Admin Bypass Title");
    });
  });
});
