import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prismaTest, DbHelper } from "../helpers/db.helper";
import { Factories } from "../factories/factories";
import {
  RoleType,
  EnrollmentStatus,
  CourseStatus,
  LessonType,
  LessonStatus,
  PaymentStatus,
} from "@backend/generated/client";
import { AuthService } from "@backend/services/auth.service";
import bcrypt from "bcrypt";

describe("Integration: Core User Flows & Services", () => {
  // Clear the database before each run to ensure isolated test execution
  beforeEach(async () => {
    await DbHelper.clear();
  });

  afterAll(async () => {
    await DbHelper.clear();
    await DbHelper.disconnect();
  });

  // ─── 1. Authentication Integration Flow ─────────────────────────────────────
  describe("Authentication Flow", () => {
    it("should successfully register a student user with hashed password", async () => {
      // Setup role inside test database
      await Factories.createRole(prismaTest, RoleType.STUDENT);

      const input = {
        firstName: "Jon",
        lastName: "Doe",
        email: "jon.doe@indiwebpros.in",
        phone: "+919999999999",
        password: "Password@123",
        roleName: RoleType.STUDENT,
      };

      // Call service layer directly
      await AuthService.register(input);

      // Verify DB storage
      const user = await prismaTest.user.findUnique({
        where: { email: input.email },
        include: { role: true },
      });

      expect(user).toBeDefined();
      expect(user!.firstName).toBe("Jon");
      expect(user!.role.name).toBe("STUDENT");
      expect(user!.isEmailVerified).toBe(false); // verification required initially

      // Verify password hashed
      const isPassValid = await bcrypt.compare(input.password, user!.password);
      expect(isPassValid).toBe(true);
    });

    it("should allow a verified active user to log in", async () => {
      const password = "SecretPassword@123";
      // Create user using factory
      const user = await Factories.createUser(prismaTest, {
        email: "verified@indiwebpros.in",
        password,
        isEmailVerified: true,
      });

      const result = await AuthService.login({
        email: user.email,
        password,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(user.email);

      // Verify session was created in DB
      const session = await prismaTest.session.findFirst({
        where: { userId: user.id },
      });
      expect(session).toBeDefined();
      expect(session!.isActive).toBe(true);
    });
  });

  // ─── 2. Course Creation Integration Flow ────────────────────────────────────
  describe("Course Management Flow", () => {
    it("should allow an instructor to create a course with modules and lessons", async () => {
      const instructor = await Factories.createUser(prismaTest, { role: RoleType.INSTRUCTOR });
      const category = await Factories.createCategory(prismaTest);

      const course = await Factories.createCourse(prismaTest, {
        instructorId: instructor.id,
        categoryId: category.id,
        title: "Test Architecture 101",
        status: CourseStatus.DRAFT,
      });

      expect(course.title).toBe("Test Architecture 101");
      expect(course.status).toBe(CourseStatus.DRAFT);

      const courseModule = await Factories.createModule(prismaTest, course.id, {
        title: "Introduction Module",
      });
      const lesson = await Factories.createLesson(prismaTest, courseModule.id, {
        title: "Lesson 1: Basics",
        lessonType: LessonType.VIDEO,
        status: LessonStatus.PUBLISHED,
      });

      expect(courseModule.courseId).toBe(course.id);
      expect(lesson.moduleId).toBe(courseModule.id);
      expect(lesson.lessonType).toBe(LessonType.VIDEO);
    });
  });

  // ─── 3. Purchase, Enrollment & Certificate Flow ────────────────────────────
  describe("Enrollment & Certificate Flow", () => {
    it("should process purchase, create enrollment and issue certificate on course completion", async () => {
      const student = await Factories.createUser(prismaTest, { role: RoleType.STUDENT });
      const instructor = await Factories.createUser(prismaTest, { role: RoleType.INSTRUCTOR });
      const course = await Factories.createCourse(prismaTest, { instructorId: instructor.id });

      // Simulate purchase transaction
      const payment = await Factories.createPayment(prismaTest, student.id, course.id);
      expect(payment.status).toBe(PaymentStatus.SUCCESS);

      // Setup enrollment linked to payment
      const enrollment = await Factories.createEnrollment(prismaTest, student.id, course.id, {
        paymentId: payment.id,
        status: EnrollmentStatus.ACTIVE,
      });
      expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
      expect(enrollment.paymentId).toBe(payment.id);

      // Simulate course completion & Certificate generation
      const certificate = await Factories.createCertificate(
        prismaTest,
        student.id,
        course.id,
        instructor.id
      );
      expect(certificate.userId).toBe(student.id);
      expect(certificate.courseId).toBe(course.id);
      expect(certificate.certificateNumber).toBeDefined();
      expect(certificate.verificationCode).toBeDefined();
    });
  });
});
