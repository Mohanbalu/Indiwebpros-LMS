import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  RoleType,
  UserStatus,
  EnrollmentStatus,
  AccessType,
  PaymentStatus,
  PaymentProvider,
  CourseDifficulty,
  CourseVisibility,
  CourseStatus,
  LessonType,
  LessonStatus,
} from "@backend/generated/client";

// Generative Factories for LMS Test Entities
export const Factories = {
  // ── Role Factory ──────────────────────────────────────────────────────────
  createRole: async (prisma: PrismaClient, name: RoleType) => {
    return prisma.role.upsert({
      where: { name: name.toString() },
      update: {},
      create: {
        id: randomUUID(),
        name: name.toString(),
        description: `${name} System Role`,
      },
    });
  },

  // ── User Factory ──────────────────────────────────────────────────────────
  createUser: async (
    prisma: PrismaClient,
    override: {
      role?: RoleType;
      email?: string;
      password?: string;
      isEmailVerified?: boolean;
      status?: UserStatus;
    } = {}
  ) => {
    const roleType = override.role || RoleType.STUDENT;
    const role = await Factories.createRole(prisma, roleType);
    const passwordHash = await bcrypt.hash(override.password || "Password@123", 10);
    const uniqueEmail = override.email || `user_${randomUUID().substring(0, 8)}@indiwebpros.in`;

    return prisma.user.create({
      data: {
        id: randomUUID(),
        roleId: role.id,
        firstName: "Test",
        lastName: roleType.toString().toLowerCase(),
        email: uniqueEmail,
        password: passwordHash,
        isEmailVerified: override.isEmailVerified !== undefined ? override.isEmailVerified : true,
        status: override.status || UserStatus.ACTIVE,
        learningStreak: 0,
        totalLearningHours: 0.0,
        skills: "TypeScript,Testing",
        socialLinks: {},
      },
    });
  },

  // ── Category Factory ──────────────────────────────────────────────────────
  createCategory: async (prisma: PrismaClient, override: { name?: string; slug?: string } = {}) => {
    const name = override.name || `Category ${randomUUID().substring(0, 8)}`;
    const slug = override.slug || name.toLowerCase().replace(/ /g, "-");

    return prisma.category.create({
      data: {
        id: randomUUID(),
        name,
        slug,
        description: "LMS Category for test runs",
        isActive: true,
        sortOrder: 0,
      },
    });
  },

  // ── Course Factory ────────────────────────────────────────────────────────
  createCourse: async (
    prisma: PrismaClient,
    override: {
      instructorId?: string;
      categoryId?: string;
      title?: string;
      status?: CourseStatus;
      price?: number;
    } = {}
  ) => {
    let instructorId = override.instructorId;
    if (!instructorId) {
      const instructor = await Factories.createUser(prisma, { role: RoleType.INSTRUCTOR });
      instructorId = instructor.id;
    }

    let categoryId = override.categoryId;
    if (!categoryId) {
      const cat = await Factories.createCategory(prisma);
      categoryId = cat.id;
    }

    const title = override.title || `Test Course ${randomUUID().substring(0, 8)}`;
    const slug = title.toLowerCase().replace(/ /g, "-");

    return prisma.course.create({
      data: {
        id: randomUUID(),
        categoryId,
        instructorId,
        createdById: instructorId,
        title,
        slug,
        description: "Test Course Description",
        shortDescription: "Short test description",
        difficulty: CourseDifficulty.BEGINNER,
        language: "English",
        visibility: CourseVisibility.PUBLIC,
        status: override.status || CourseStatus.PUBLISHED,
        price: override.price || 1999.0,
        discountPrice: override.price ? override.price - 200 : 1799.0,
        durationMinutes: 120,
        certificateEnabled: true,
        featured: false,
      },
    });
  },

  // ── Course Module Factory ─────────────────────────────────────────────────
  createModule: async (
    prisma: PrismaClient,
    courseId: string,
    override: { title?: string; sortOrder?: number } = {}
  ) => {
    return prisma.courseModule.create({
      data: {
        id: randomUUID(),
        courseId,
        title: override.title || "Module 1: Introduction",
        description: "Module learning goals description",
        sortOrder: override.sortOrder || 1,
      },
    });
  },

  // ── Lesson Factory ────────────────────────────────────────────────────────
  createLesson: async (
    prisma: PrismaClient,
    moduleId: string,
    override: {
      title?: string;
      lessonType?: LessonType;
      sortOrder?: number;
      status?: LessonStatus;
    } = {}
  ) => {
    const title = override.title || `Lesson ${randomUUID().substring(0, 8)}`;
    const slug = title.toLowerCase().replace(/ /g, "-");

    return prisma.lesson.create({
      data: {
        id: randomUUID(),
        moduleId,
        title,
        slug,
        description: "Learning lesson video details description",
        durationSeconds: 300,
        lessonType: override.lessonType || LessonType.VIDEO,
        isPreview: false,
        sortOrder: override.sortOrder || 1,
        status: override.status || LessonStatus.PUBLISHED,
      },
    });
  },

  // ── Payment Factory ───────────────────────────────────────────────────────
  createPayment: async (
    prisma: PrismaClient,
    userId: string,
    courseId: string,
    override: {
      amount?: number;
      status?: PaymentStatus;
      provider?: PaymentProvider;
      transactionId?: string;
    } = {}
  ) => {
    const amount = override.amount || 1999.0;
    const finalAmount = amount;

    return prisma.payment.create({
      data: {
        id: randomUUID(),
        userId,
        courseId,
        provider: override.provider || PaymentProvider.RAZORPAY,
        transactionId: override.transactionId || `tx_${randomUUID().substring(0, 12)}`,
        amount,
        discount: 0.0,
        tax: 0.0,
        finalAmount,
        currency: "INR",
        status: override.status || PaymentStatus.SUCCESS,
        paymentMethod: "upi",
        paidAt: override.status === PaymentStatus.SUCCESS ? new Date() : null,
      },
    });
  },

  // ── Enrollment Factory ────────────────────────────────────────────────────
  createEnrollment: async (
    prisma: PrismaClient,
    userId: string,
    courseId: string,
    override: {
      status?: EnrollmentStatus;
      paymentId?: string;
    } = {}
  ) => {
    return prisma.enrollment.create({
      data: {
        id: randomUUID(),
        userId,
        courseId,
        paymentId: override.paymentId || null,
        status: override.status || EnrollmentStatus.ACTIVE,
        accessType: AccessType.LIFETIME,
        expiresAt: null,
        enrolledAt: new Date(),
      },
    });
  },

  // ── Certificate Factory ───────────────────────────────────────────────────
  createCertificate: async (
    prisma: PrismaClient,
    userId: string,
    courseId: string,
    generatedById: string
  ) => {
    const certNum = `CERT-${randomUUID().substring(0, 8).toUpperCase()}`;
    const code = `CODE-${randomUUID().substring(0, 6).toUpperCase()}`;

    return prisma.certificate.create({
      data: {
        id: randomUUID(),
        userId,
        courseId,
        certificateNumber: certNum,
        verificationCode: code,
        verificationUrl: `http://localhost:5173/certificates/verify/${code}`,
        issuedAt: new Date(),
        generatedBy: generatedById,
        version: 1,
        status: "GENERATED",
      },
    });
  },
};
