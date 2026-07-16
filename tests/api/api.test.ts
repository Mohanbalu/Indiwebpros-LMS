import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import dotenv from "dotenv";
import path from "path";

// Initialize test environment variables before importing app
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

import app from "@backend/app";
import { prismaTest, DbHelper } from "../helpers/db.helper";
import { Factories } from "../factories/factories";
import { AuthHelper } from "../helpers/auth.helper";
import { RoleType, CourseStatus } from "@backend/generated/client";

describe("API: Express Router Endpoints", () => {
  beforeEach(async () => {
    await DbHelper.clear();
  });

  afterAll(async () => {
    await DbHelper.clear();
    await DbHelper.disconnect();
  });

  // ─── 1. Health Endpoints ────────────────────────────────────────────────────
  describe("GET /api/v1/health/live & GET /api/v1/health/ready", () => {
    it("should return 200 for liveness check", async () => {
      const res = await request(app).get("/api/v1/health/live").expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe("healthy");
    });

    it("should return readiness status", async () => {
      const res = await request(app).get("/api/v1/health/ready").expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ─── 2. Route Authentication & Validation ──────────────────────────────────
  describe("POST /api/v1/auth/login", () => {
    it("should return 400 Bad Request if validation fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "invalid-email" }) // missing password, bad email format
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Validation failed");
    });

    it("should return 401 Unauthorized for invalid login credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nonexistent@indiwebpros.in", password: "Password@123" })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });
  });

  // ─── 3. Listing, Pagination, Sorting & Filtering ───────────────────────────
  describe("GET /api/v1/courses", () => {
    it("should support query pagination, filtering and sorting parameters", async () => {
      const instructor = await Factories.createUser(prismaTest, { role: RoleType.INSTRUCTOR });
      const category = await Factories.createCategory(prismaTest);

      // Create 3 test courses with different prices
      await Factories.createCourse(prismaTest, {
        instructorId: instructor.id,
        categoryId: category.id,
        title: "Alpha Course",
        price: 500,
        status: CourseStatus.PUBLISHED,
      });

      await Factories.createCourse(prismaTest, {
        instructorId: instructor.id,
        categoryId: category.id,
        title: "Beta Course",
        price: 1500,
        status: CourseStatus.PUBLISHED,
      });

      await Factories.createCourse(prismaTest, {
        instructorId: instructor.id,
        categoryId: category.id,
        title: "Gamma Course",
        price: 1000,
        status: CourseStatus.PUBLISHED,
      });

      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      const headers = AuthHelper.authHeaders(student.id, RoleType.STUDENT);

      // API Request: sort by price descending, limit 2
      const res = await request(app)
        .get("/api/v1/courses")
        .set(headers)
        .query({
          sortBy: "price",
          sortOrder: "desc",
          limit: 2,
          page: 1,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);

      // Verify sorting order: 1500 (Beta) then 1000 (Gamma)
      const courses = res.body.data;
      expect(courses[0].title).toBe("Beta Course");
      expect(courses[1].title).toBe("Gamma Course");
    });
  });

  // ─── 4. Route Authorization (RBAC) ──────────────────────────────────────────
  describe("RBAC Enforcement on Protected API routes", () => {
    it("should reject course creation from a Student (403 Forbidden)", async () => {
      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      const headers = AuthHelper.authHeaders(student.id, RoleType.STUDENT);

      const res = await request(app)
        .post("/api/v1/courses")
        .set(headers)
        .send({
          title: "Intruder course",
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
          description: "Not allowed",
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("You do not have permission to access this resource");
    });
  });
});
