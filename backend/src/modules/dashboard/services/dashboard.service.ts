import { prisma } from "@/database/client";
import {
  EnrollmentStatus,
  QuizAttemptStatus,
  AssignmentSubmissionStatus,
  CertificateStatus,
} from "@/generated/client";
import { NotFoundError, ForbiddenError } from "@/errors/custom-errors";
import { DashboardAccessDeniedException, StudentNotFoundException } from "../errors/dashboard-exceptions";
import { ServiceContainer } from "@/services/shared/service-container";

export class StudentDashboardService {
  private verifyStudentRole(role: string) {
    if (role !== "Student") {
      throw new DashboardAccessDeniedException();
    }
  }

  async getFullDashboard(userId: string, role: string) {
    this.verifyStudentRole(role);

    // Fetch user details
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { avatarFile: true },
    });

    if (!student) throw new StudentNotFoundException();

    // Query everything in parallel to avoid duplicate queries and N+1 execution path
    const [
      enrollments,
      recentlyViewed,
      certificates,
      notifications,
      bookmarks,
      notes,
      quizzesAttempts,
      assignmentsSubmissions,
      sessions,
    ] = await Promise.all([
      // 1. My Enrollments
      prisma.enrollment.findMany({
        where: { userId, deletedAt: null },
        include: {
          course: {
            include: {
              instructor: { select: { firstName: true, lastName: true } },
              thumbnail: true,
              modules: {
                where: { deletedAt: null },
                include: { lessons: { where: { deletedAt: null, status: "PUBLISHED" } } },
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      }),
      // 2. Continue Learning
      prisma.recentlyViewedLesson.findFirst({
        where: { userId },
        orderBy: { lastViewedAt: "desc" },
        include: {
          lesson: { include: { module: true } },
          course: true,
        },
      }),
      // 3. Certificates
      prisma.certificate.findMany({
        where: { userId },
        include: { course: true, pdfFile: true },
        orderBy: { issuedAt: "desc" },
        take: 5,
      }),
      // 4. Notifications
      prisma.notification.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // 5. Bookmarks
      prisma.lessonBookmark.findMany({
        where: { userId },
        include: { lesson: { include: { module: { include: { course: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // 6. Notes
      prisma.lessonNote.findMany({
        where: { userId },
        include: { lesson: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // 7. Quiz attempts
      prisma.quizAttempt.findMany({
        where: { userId },
        include: { quiz: true },
        orderBy: { startedAt: "desc" },
      }),
      // 8. Assignment Submissions
      prisma.assignmentSubmission.findMany({
        where: { studentId: userId },
        include: { assignment: true },
        orderBy: { submittedAt: "desc" },
      }),
      // 9. Active sessions
      prisma.session.findMany({
        where: { userId, isActive: true },
        orderBy: { lastActiveAt: "desc" },
        take: 5,
      }),
    ]);

    // Format Welcome section
    const welcome = {
      studentName: `${student.firstName} ${student.lastName}`,
      avatarUrl: student.avatarFile?.url ?? null,
      learningStreak: student.learningStreak,
      totalLearningHours: student.totalLearningHours,
      memberSince: student.createdAt,
    };

    // Format Continue Learning
    let continueLearning = null;
    if (recentlyViewed) {
      const courseProgress = await prisma.learningProgress.findUnique({
        where: { userId_courseId: { userId, courseId: recentlyViewed.courseId } },
      });

      const lessonProgress = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: recentlyViewed.lessonId } },
      });

      continueLearning = {
        courseId: recentlyViewed.courseId,
        courseTitle: recentlyViewed.course.title,
        courseSlug: recentlyViewed.course.slug,
        lessonId: recentlyViewed.lessonId,
        lessonTitle: recentlyViewed.lesson.title,
        videoPosition: lessonProgress?.lastPositionSeconds ?? 0,
        progressPercentage: courseProgress?.progressPercentage ?? 0.0,
      };
    }

    // Format My Courses list
    const myCourses = await Promise.all(
      enrollments.map(async (e) => {
        let totalLessons = 0;
        e.course.modules.forEach((m) => {
          totalLessons += m.lessons.length;
        });

        let thumbnailUrl = null;
        if (e.course.thumbnail?.key) {
          try {
            thumbnailUrl = await ServiceContainer.storage.getSignedDownloadUrl(e.course.thumbnail.key, 3600);
          } catch (err) {
            thumbnailUrl = e.course.thumbnail.url;
          }
        }

        // Fetch progress
        return {
          id: e.id,
          courseId: e.courseId,
          title: e.course.title,
          slug: e.course.slug,
          thumbnailUrl,
          instructorName: `${e.course.instructor.firstName} ${e.course.instructor.lastName}`,
          status: e.status,
          expiresAt: e.expiresAt,
          completionPercentage: e.progressPercentage,
          totalLessons,
        };
      })
    );

    // Format Statistics block
    const completedCoursesCount = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length;
    const statistics = {
      coursesEnrolled: enrollments.length,
      coursesCompleted: completedCoursesCount,
      certificatesEarned: certificates.length,
      hoursLearned: student.totalLearningHours,
      lessonsCompleted: await prisma.lessonProgress.count({ where: { userId, completed: true } }),
      quizzesPassed: quizzesAttempts.filter((q) => q.passed).length,
      assignmentsSubmitted: assignmentsSubmissions.length,
    };

    // Format Quiz summary block
    const passedQuizzes = quizzesAttempts.filter((q) => q.passed);
    const scores = quizzesAttempts.map((q) => q.percentage);
    const averageScore = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    const quizzes = {
      passed: passedQuizzes.length,
      failed: quizzesAttempts.length - passedQuizzes.length,
      averageScore,
      bestScore,
      attempts: quizzesAttempts.map((q) => ({
        id: q.id,
        quizTitle: q.quiz.title,
        score: q.score,
        percentage: q.percentage,
        passed: q.passed,
        submittedAt: q.submittedAt,
      })),
    };

    // Format Assignments block
    const assignments = {
      pending: await prisma.assignment.count({
        where: {
          courseId: { in: enrollments.map((e) => e.courseId) },
          status: "PUBLISHED",
          submissions: { none: { studentId: userId } },
        },
      }),
      submissions: assignmentsSubmissions.map((s) => ({
        id: s.id,
        assignmentTitle: s.assignment.title,
        status: s.status,
        submittedAt: s.submittedAt,
        marks: s.marks,
        feedback: s.feedback,
      })),
    };

    // Format Security
    const lastLoginLog = await prisma.auditLog.findFirst({
      where: { userId, action: "USER_LOGIN_SUCCESS" },
      orderBy: { createdAt: "desc" },
    });

    const security = {
      lastLogin: lastLoginLog?.createdAt ?? null,
      activeSessions: sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        browser: s.browser,
        operatingSystem: s.operatingSystem,
        lastActiveAt: s.lastActiveAt,
      })),
    };

    const dashboardViewLog = await ServiceContainer.audit.log({
      userId,
      action: "DASHBOARD_VIEWED",
      resource: "StudentDashboard",
      resourceId: userId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return {
      welcome,
      continueLearning,
      myCourses,
      statistics,
      certificates: certificates.map((c) => ({
        id: c.id,
        courseTitle: c.course.title,
        certificateNumber: c.certificateNumber,
        issuedAt: c.issuedAt,
        status: c.status,
      })),
      notifications: {
        unreadCount: notifications.filter((n) => !n.isRead).length,
        items: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
      },
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        lessonId: b.lessonId,
        lessonTitle: b.lesson.title,
        courseTitle: b.lesson.module.course.title,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        lessonId: n.lessonId,
        lessonTitle: n.lesson.title,
        title: n.title,
        content: n.content,
        videoTimestamp: n.videoTimestamp,
        createdAt: n.createdAt,
      })),
      quizzes,
      assignments,
      security,
    };
  }

  async getStats(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.statistics;
  }

  async getContinueLearning(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.continueLearning;
  }

  async getMyCourses(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.myCourses;
  }

  async getCertificates(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.certificates;
  }

  async getNotifications(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.notifications;
  }

  async getBookmarks(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.bookmarks;
  }

  async getNotes(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.notes;
  }

  async getQuizzes(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.quizzes;
  }

  async getAssignments(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.assignments;
  }

  async getSecurity(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.security;
  }
}

export const studentDashboardService = new StudentDashboardService();
