import { PrismaClient } from "@backend/generated/client";

// Singleton test database client configured with the test environment URL
export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:password@localhost:5432/indiwebpros_lms_test?schema=public",
    },
  },
});

export const DbHelper = {
  // Clears all schema tables using CASCADE TRUNCATE for maximum speed
  clear: async () => {
    try {
      await prismaTest.$executeRawUnsafe(`SET lock_timeout = 5000;`);
      await prismaTest.$executeRawUnsafe(`
        TRUNCATE TABLE 
          "AuditLog", "VerificationToken", "PasswordResetToken", "RefreshToken", "Session", 
          "CouponUsage", "PaymentAttempt", "Enrollment", "Certificate", "RecentlyViewedLesson", 
          "LessonNote", "LessonBookmark", "LessonProgress", "LearningProgress", "LessonResource", 
          "Lesson", "CourseModule", "Payment", "Course", "Category", "User", "Role"
        CASCADE;
      `);
    } catch (error) {
      console.error("Failed to truncate database tables:", (error as Error).message);
    }
  },

  // Disconnect prisma client
  disconnect: async () => {
    await prismaTest.$disconnect();
  },
};
