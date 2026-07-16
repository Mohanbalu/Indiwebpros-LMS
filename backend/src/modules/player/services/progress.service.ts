import { prisma } from "@/database/client";
import {
  LessonProgress,
  LessonProgressStatus,
  LearningProgress,
  EnrollmentStatus,
} from "@/generated/client";
import { NotFoundError } from "@/errors/custom-errors";
import {
  EnrollmentRequiredException,
  LessonNotFoundException,
} from "../errors/player-exceptions";
import {
  VideoProgressInput,
  PdfProgressInput,
  ArticleProgressInput,
} from "../validators/player.validator";
import { ServiceContainer } from "@/services/shared/service-container";

export class LearningProgressService {
  async validateEnrollment(userId: string, courseId: string, role: string): Promise<void> {
    if (role === "Admin") return;

    if (role === "Instructor") {
      // Check if course belongs to instructor
      const course = await prisma.course.findFirst({
        where: { id: courseId, deletedAt: null },
      });
      if (course && course.instructorId === userId) {
        return;
      }
    }

    // Student/Mentor check active enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!enrollment) {
      throw new EnrollmentRequiredException();
    }

    if (enrollment.expiresAt !== null && enrollment.expiresAt < new Date()) {
      throw new EnrollmentRequiredException("Enrollment has expired");
    }
  }

  private async calculateAndSaveCourseProgress(
    tx: any,
    userId: string,
    courseId: string,
    lessonId: string
  ): Promise<LearningProgress> {
    // Count total lessons
    const totalLessons = await tx.lesson.count({
      where: {
        module: { courseId, deletedAt: null },
        status: "PUBLISHED",
        deletedAt: null,
      },
    });

    // Count completed lessons for this user
    const completedLessons = await tx.lessonProgress.count({
      where: {
        userId,
        lesson: { module: { courseId, deletedAt: null }, status: "PUBLISHED", deletedAt: null },
        completed: true,
      },
    });

    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0.0;
    const isCompleted = completedLessons > 0 && completedLessons === totalLessons;

    const existingProgress = await tx.learningProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const now = new Date();
    let learningProgress: LearningProgress;

    if (existingProgress) {
      const wasCompleted = existingProgress.completedAt !== null;
      learningProgress = await tx.learningProgress.update({
        where: { id: existingProgress.id },
        data: {
          completedLessons,
          totalLessons,
          progressPercentage,
          lastLessonId: lessonId,
          lastAccessedAt: now,
          completedAt: isCompleted && !wasCompleted ? now : existingProgress.completedAt,
        },
      });

      if (isCompleted && !wasCompleted) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "COURSE_COMPLETED",
            resource: "Course",
            resourceId: courseId,
            details: { progressPercentage: 100 },
            status: "SUCCESS",
          });
        } catch {}
      }
    } else {
      learningProgress = await tx.learningProgress.create({
        data: {
          userId,
          courseId,
          completedLessons,
          totalLessons,
          progressPercentage,
          lastLessonId: lessonId,
          startedAt: now,
          lastAccessedAt: now,
          completedAt: isCompleted ? now : null,
        },
      });

      try {
        await ServiceContainer.audit.log({
          userId,
          action: "COURSE_STARTED",
          resource: "Course",
          resourceId: courseId,
          details: {},
          status: "SUCCESS",
        });
      } catch {}

      if (isCompleted) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "COURSE_COMPLETED",
            resource: "Course",
            resourceId: courseId,
            details: { progressPercentage: 100 },
            status: "SUCCESS",
          });
        } catch {}
      }
    }

    return learningProgress;
  }

  async updateVideoProgress(
    userId: string,
    role: string,
    input: VideoProgressInput
  ): Promise<{ lessonProgress: LessonProgress; learningProgress: LearningProgress }> {
    const lesson = await prisma.lesson.findFirst({
      where: { id: input.lessonId, deletedAt: null },
      include: { module: true },
    });

    if (!lesson) throw new LessonNotFoundException();

    const courseId = lesson.module.courseId;
    await this.validateEnrollment(userId, courseId, role);

    const watchPercentage = (input.positionSeconds / input.durationSeconds) * 100;
    const isCompletedThreshold = watchPercentage >= 90.0;

    return prisma.$transaction(async (tx) => {
      const existing = await tx.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
      });

      const wasCompleted = existing ? existing.completed : false;
      const willBeCompleted = wasCompleted || isCompletedThreshold;

      const status = willBeCompleted
        ? LessonProgressStatus.COMPLETED
        : LessonProgressStatus.IN_PROGRESS;

      const accumulatedWatchTime = existing
        ? Math.max(existing.watchTimeSeconds, input.positionSeconds)
        : input.positionSeconds;

      const lessonProgress = await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
        create: {
          userId,
          lessonId: input.lessonId,
          status,
          watchPercentage: Math.min(100.0, Math.max(existing?.watchPercentage ?? 0, watchPercentage)),
          watchTimeSeconds: accumulatedWatchTime,
          lastPositionSeconds: input.positionSeconds,
          completed: willBeCompleted,
          completedAt: willBeCompleted && !wasCompleted ? new Date() : existing?.completedAt,
        },
        update: {
          status,
          watchPercentage: Math.min(100.0, Math.max(existing?.watchPercentage ?? 0, watchPercentage)),
          watchTimeSeconds: accumulatedWatchTime,
          lastPositionSeconds: input.positionSeconds,
          completed: willBeCompleted,
          completedAt: willBeCompleted && !wasCompleted ? new Date() : existing?.completedAt,
          lastAccessedAt: new Date(),
        },
      });

      // Update RecentlyViewedLesson
      await tx.recentlyViewedLesson.upsert({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
        create: { userId, lessonId: input.lessonId, courseId, lastViewedAt: new Date() },
        update: { lastViewedAt: new Date() },
      });

      // Log audits
      if (!existing) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "LESSON_STARTED",
            resource: "Lesson",
            resourceId: input.lessonId,
            details: { lessonType: lesson.lessonType },
            status: "SUCCESS",
          });
        } catch {}
      }

      if (willBeCompleted && !wasCompleted) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "LESSON_COMPLETED",
            resource: "Lesson",
            resourceId: input.lessonId,
            details: { lessonType: lesson.lessonType },
            status: "SUCCESS",
          });
        } catch {}
      }

      const learningProgress = await this.calculateAndSaveCourseProgress(
        tx,
        userId,
        courseId,
        input.lessonId
      );

      return { lessonProgress, learningProgress };
    });
  }

  async updatePdfProgress(
    userId: string,
    role: string,
    input: PdfProgressInput
  ): Promise<{ lessonProgress: LessonProgress; learningProgress: LearningProgress }> {
    const lesson = await prisma.lesson.findFirst({
      where: { id: input.lessonId, deletedAt: null },
      include: { module: true },
    });

    if (!lesson) throw new LessonNotFoundException();

    const courseId = lesson.module.courseId;
    await this.validateEnrollment(userId, courseId, role);

    const isCompleted = input.pageNumber === input.totalPages;
    const progressPercentage = (input.pageNumber / input.totalPages) * 100;

    return prisma.$transaction(async (tx) => {
      const existing = await tx.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
      });

      const wasCompleted = existing ? existing.completed : false;
      const willBeCompleted = wasCompleted || isCompleted;

      const status = willBeCompleted
        ? LessonProgressStatus.COMPLETED
        : LessonProgressStatus.IN_PROGRESS;

      const lessonProgress = await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
        create: {
          userId,
          lessonId: input.lessonId,
          status,
          watchPercentage: Math.min(100.0, Math.max(existing?.watchPercentage ?? 0, progressPercentage)),
          lastPageRead: input.pageNumber,
          completed: willBeCompleted,
          completedAt: willBeCompleted && !wasCompleted ? new Date() : existing?.completedAt,
        },
        update: {
          status,
          watchPercentage: Math.min(100.0, Math.max(existing?.watchPercentage ?? 0, progressPercentage)),
          lastPageRead: input.pageNumber,
          completed: willBeCompleted,
          completedAt: willBeCompleted && !wasCompleted ? new Date() : existing?.completedAt,
          lastAccessedAt: new Date(),
        },
      });

      await tx.recentlyViewedLesson.upsert({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
        create: { userId, lessonId: input.lessonId, courseId, lastViewedAt: new Date() },
        update: { lastViewedAt: new Date() },
      });

      if (!existing) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "LESSON_STARTED",
            resource: "Lesson",
            resourceId: input.lessonId,
            details: { lessonType: lesson.lessonType },
            status: "SUCCESS",
          });
        } catch {}
      }

      if (willBeCompleted && !wasCompleted) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "LESSON_COMPLETED",
            resource: "Lesson",
            resourceId: input.lessonId,
            details: { lessonType: lesson.lessonType },
            status: "SUCCESS",
          });
        } catch {}
      }

      const learningProgress = await this.calculateAndSaveCourseProgress(
        tx,
        userId,
        courseId,
        input.lessonId
      );

      return { lessonProgress, learningProgress };
    });
  }

  async updateArticleProgress(
    userId: string,
    role: string,
    input: ArticleProgressInput
  ): Promise<{ lessonProgress: LessonProgress; learningProgress: LearningProgress }> {
    const lesson = await prisma.lesson.findFirst({
      where: { id: input.lessonId, deletedAt: null },
      include: { module: true },
    });

    if (!lesson) throw new LessonNotFoundException();

    const courseId = lesson.module.courseId;
    await this.validateEnrollment(userId, courseId, role);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
      });

      const wasCompleted = existing ? existing.completed : false;
      const willBeCompleted = wasCompleted || input.completed;

      const status = willBeCompleted
        ? LessonProgressStatus.COMPLETED
        : LessonProgressStatus.IN_PROGRESS;

      const lessonProgress = await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
        create: {
          userId,
          lessonId: input.lessonId,
          status,
          watchPercentage: willBeCompleted ? 100.0 : 50.0,
          completed: willBeCompleted,
          completedAt: willBeCompleted && !wasCompleted ? new Date() : existing?.completedAt,
        },
        update: {
          status,
          watchPercentage: willBeCompleted ? 100.0 : 50.0,
          completed: willBeCompleted,
          completedAt: willBeCompleted && !wasCompleted ? new Date() : existing?.completedAt,
          lastAccessedAt: new Date(),
        },
      });

      await tx.recentlyViewedLesson.upsert({
        where: { userId_lessonId: { userId, lessonId: input.lessonId } },
        create: { userId, lessonId: input.lessonId, courseId, lastViewedAt: new Date() },
        update: { lastViewedAt: new Date() },
      });

      if (!existing) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "LESSON_STARTED",
            resource: "Lesson",
            resourceId: input.lessonId,
            details: { lessonType: lesson.lessonType },
            status: "SUCCESS",
          });
        } catch {}
      }

      if (willBeCompleted && !wasCompleted) {
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "LESSON_COMPLETED",
            resource: "Lesson",
            resourceId: input.lessonId,
            details: { lessonType: lesson.lessonType },
            status: "SUCCESS",
          });
        } catch {}
      }

      const learningProgress = await this.calculateAndSaveCourseProgress(
        tx,
        userId,
        courseId,
        input.lessonId
      );

      return { lessonProgress, learningProgress };
    });
  }
}

export const learningProgressService = new LearningProgressService();
