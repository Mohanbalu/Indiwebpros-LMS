import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧼 Cleaning transaction and progress data for student@indiwebpros.in...");
  
  const student = await prisma.user.findUnique({
    where: { email: "student@indiwebpros.in" }
  });
  
  if (!student) {
    console.log("No student found with email student@indiwebpros.in");
    return;
  }
  
  const userId = student.id;
  
  // Delete user-specific rows in constraint-dependent order
  await prisma.quizAttempt.deleteMany({ where: { userId } });
  await prisma.assignmentSubmission.deleteMany({ where: { studentId: userId } });
  await prisma.recentlyViewedLesson.deleteMany({ where: { userId } });
  await prisma.lessonProgress.deleteMany({ where: { userId } });
  await prisma.lessonBookmark.deleteMany({ where: { userId } });
  await prisma.lessonNote.deleteMany({ where: { userId } });
  await prisma.certificate.deleteMany({ where: { userId } });
  await prisma.learningProgress.deleteMany({ where: { userId } });
  await prisma.enrollment.deleteMany({ where: { userId } });
  await prisma.payment.deleteMany({ where: { userId } });
  await prisma.couponUsage.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  
  // Reset user's progress fields
  await prisma.user.update({
    where: { id: userId },
    data: {
      learningStreak: 0,
      totalLearningHours: 0.0
    }
  });

  console.log("✅ Successfully cleaned E2E test data for student user.");
}

main()
  .catch((e) => {
    console.error("❌ Cleaning failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
