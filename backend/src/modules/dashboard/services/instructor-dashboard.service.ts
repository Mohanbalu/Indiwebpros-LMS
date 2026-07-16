import { prisma } from "@/database/client";
import {
  EnrollmentStatus,
  QuizAttemptStatus,
  AssignmentSubmissionStatus,
  CertificateStatus,
  CourseStatus,
} from "@/generated/client";
import { NotFoundError } from "@/errors/custom-errors";
import {
  InstructorDashboardAccessDeniedException,
  CourseOwnershipException,
} from "../errors/instructor-exceptions";
import { ServiceContainer } from "@/services/shared/service-container";

export class InstructorDashboardService {
  private verifyInstructorRole(role: string) {
    if (role !== "Instructor" && role !== "Admin") {
      throw new InstructorDashboardAccessDeniedException();
    }
  }

  async validateCourseOwnership(courseId: string, userId: string, role: string) {
    if (role === "Admin") return;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundError("Course not found");
    if (course.instructorId !== userId) {
      throw new CourseOwnershipException();
    }
  }

  private getInstructorFilter(userId: string, role: string) {
    return role === "Admin" ? {} : { instructorId: userId };
  }

  async getFullDashboard(userId: string, role: string) {
    this.verifyInstructorRole(role);

    const instructor = await prisma.user.findUnique({
      where: { id: userId },
      include: { avatarFile: true },
    });
    if (!instructor) throw new NotFoundError("Instructor not found");

    const instructorFilter = this.getInstructorFilter(userId, role);

    // Run primary queries in parallel to avoid duplicate/blocking queries
    const [
      courses,
      enrollments,
      submissions,
      attempts,
      certificates,
      notifications,
    ] = await Promise.all([
      // Courses
      prisma.course.findMany({
        where: { ...instructorFilter, deletedAt: null },
        include: {
          thumbnail: true,
          modules: {
            where: { deletedAt: null },
            include: { lessons: { where: { deletedAt: null } } },
          },
        },
      }),
      // Enrollments
      prisma.enrollment.findMany({
        where: { course: { ...instructorFilter, deletedAt: null }, deletedAt: null },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      // Submissions
      prisma.assignmentSubmission.findMany({
        where: { assignment: { course: { ...instructorFilter, deletedAt: null } } },
        include: {
          student: { select: { firstName: true, lastName: true } },
          assignment: { select: { id: true, title: true, maxMarks: true } },
        },
        orderBy: { submittedAt: "desc" },
      }),
      // Quiz Attempts
      prisma.quizAttempt.findMany({
        where: { quiz: { course: { ...instructorFilter, deletedAt: null } } },
        include: {
          user: { select: { firstName: true, lastName: true } },
          quiz: { select: { id: true, title: true } },
        },
        orderBy: { startedAt: "desc" },
      }),
      // Certificates
      prisma.certificate.findMany({
        where: { course: { ...instructorFilter, deletedAt: null } },
        include: {
          user: { select: { firstName: true, lastName: true } },
          course: { select: { title: true } },
        },
        orderBy: { issuedAt: "desc" },
      }),
      // Notifications
      prisma.notification.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // 1. Welcome
    const welcome = {
      instructorName: `${instructor.firstName} ${instructor.lastName}`,
      avatarUrl: instructor.avatarFile?.url ?? null,
      teachingSince: instructor.createdAt,
      totalCourses: courses.length,
      totalStudents: enrollments.length,
    };

    // 2. My Courses statuses
    const myCoursesSummary = {
      published: courses.filter((c) => c.status === CourseStatus.PUBLISHED).length,
      draft: courses.filter((c) => c.status === CourseStatus.DRAFT).length,
      archived: courses.filter((c) => c.status === CourseStatus.ARCHIVED).length,
      underReview: courses.filter((c) => c.status === CourseStatus.UNDER_REVIEW).length,
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        slug: c.slug,
        thumbnailUrl: c.thumbnail?.url ?? null,
        modulesCount: c.modules.length,
        lessonsCount: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
      })),
    };

    // 3. Student Analytics
    const studentAnalytics = {
      totalStudents: enrollments.length,
      activeStudents: enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length,
      inactiveStudents: enrollments.filter((e) => e.status === EnrollmentStatus.EXPIRED || e.status === EnrollmentStatus.CANCELLED).length,
      studentsCompleted: enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length,
      studentsInProgress: enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE && e.progressPercentage < 100).length,
    };

    // 4. Assignments Review Summary
    const assignmentStats = {
      pendingReviews: submissions.filter((s) => s.status === AssignmentSubmissionStatus.SUBMITTED || s.status === AssignmentSubmissionStatus.UNDER_REVIEW).length,
      reviewed: submissions.filter((s) => s.status === AssignmentSubmissionStatus.GRADED).length,
      averageMarks: submissions.filter((s) => s.status === AssignmentSubmissionStatus.GRADED && s.marks !== null).reduce((sum, s, _, arr) => sum + s.marks! / arr.length, 0),
      submissions: submissions.slice(0, 5).map((s) => ({
        id: s.id,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        assignmentTitle: s.assignment.title,
        status: s.status,
        submittedAt: s.submittedAt,
        marks: s.marks,
      })),
    };

    // 5. Quiz Analytics
    const quizStats = {
      totalAttempts: attempts.length,
      passRate: attempts.length > 0 ? (attempts.filter((a) => a.passed).length / attempts.length) * 100 : 0,
      averageScore: attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0,
      attempts: attempts.slice(0, 5).map((a) => ({
        id: a.id,
        studentName: `${a.user.firstName} ${a.user.lastName}`,
        quizTitle: a.quiz.title,
        score: a.score,
        percentage: a.percentage,
        passed: a.passed,
        submittedAt: a.submittedAt,
      })),
    };

    // 6. Recent Student Activity feed
    // We construct a mock activity feed from submissions, attempts, completions
    const activities: any[] = [];
    submissions.forEach((s) => {
      activities.push({
        type: "ASSIGNMENT_SUBMITTED",
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        details: `Submitted assignment: ${s.assignment.title}`,
        timestamp: s.submittedAt,
      });
    });
    attempts.forEach((a) => {
      activities.push({
        type: "QUIZ_SUBMITTED",
        studentName: `${a.user.firstName} ${a.user.lastName}`,
        details: `Completed quiz: ${a.quiz.title} (${a.passed ? "Passed" : "Failed"})`,
        timestamp: a.submittedAt || a.startedAt,
      });
    });
    certificates.forEach((c) => {
      activities.push({
        type: "CERTIFICATE_EARNED",
        studentName: `${c.user.firstName} ${c.user.lastName}`,
        details: `Earned Certificate for: ${c.course.title}`,
        timestamp: c.issuedAt,
      });
    });
    enrollments.forEach((e) => {
      if (e.status === EnrollmentStatus.COMPLETED && e.completedAt) {
        activities.push({
          type: "COURSE_COMPLETED",
          studentName: `${e.user.firstName} ${e.user.lastName}`,
          details: `Completed course: ${e.course.title}`,
          timestamp: e.completedAt,
        });
      }
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 7. Top & Bottom performing courses
    const courseStatsList = courses.map((c) => {
      const cEnrollments = enrollments.filter((e) => e.courseId === c.id);
      const cCompletions = cEnrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED);
      const completionRate = cEnrollments.length > 0 ? (cCompletions.length / cEnrollments.length) * 100 : 0;
      return {
        id: c.id,
        title: c.title,
        enrollmentsCount: cEnrollments.length,
        completionRate,
      };
    });

    courseStatsList.sort((a, b) => b.completionRate - a.completionRate);
    const topPerforming = courseStatsList[0] || null;
    const lowestPerforming = courseStatsList.length > 1 ? courseStatsList[courseStatsList.length - 1] : null;

    // Log event
    await ServiceContainer.audit.log({
      userId,
      action: "INSTRUCTOR_DASHBOARD_VIEWED",
      resource: "InstructorDashboard",
      resourceId: userId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return {
      welcome,
      coursesSummary: myCoursesSummary,
      studentAnalytics,
      recentActivity: activities.slice(0, 10),
      assignments: assignmentStats,
      quizzes: quizStats,
      certificates: {
        issuedCount: certificates.length,
        items: certificates.slice(0, 5).map((c) => ({
          id: c.id,
          studentName: `${c.user.firstName} ${c.user.lastName}`,
          courseTitle: c.course.title,
          issuedAt: c.issuedAt,
        })),
      },
      performanceMetrics: {
        topPerforming,
        lowestPerforming,
      },
      notifications: {
        unreadCount: notifications.filter((n) => !n.isRead).length,
        items: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
        })),
      },
    };
  }

  async getStats(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return {
      welcome: full.welcome,
      studentAnalytics: full.studentAnalytics,
      performanceMetrics: full.performanceMetrics,
    };
  }

  async getCourses(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.coursesSummary;
  }

  async getCourseDetails(courseId: string, userId: string, role: string) {
    this.verifyInstructorRole(role);
    await this.validateCourseOwnership(courseId, userId, role);

    const [course, cEnrollments, cCertificates, cQuizzes, cAssignments] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        include: { modules: { include: { lessons: true } } },
      }),
      prisma.enrollment.findMany({
        where: { courseId, deletedAt: null },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      prisma.certificate.findMany({
        where: { courseId },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.quiz.findMany({
        where: { courseId, deletedAt: null },
        include: { attempts: true },
      }),
      prisma.assignment.findMany({
        where: { courseId },
        include: { submissions: true },
      }),
    ]);

    if (!course) throw new NotFoundError("Course not found");

    const totalStudents = cEnrollments.length;
    const completedStudents = cEnrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length;
    const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
    const avgProgress = totalStudents > 0 ? cEnrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalStudents : 0;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      stats: {
        totalStudents,
        completionRate,
        averageProgress: avgProgress,
        certificatesIssued: cCertificates.length,
      },
      quizzes: cQuizzes.map((q) => ({
        id: q.id,
        title: q.title,
        attemptsCount: q.attempts.length,
        averageScore: q.attempts.length > 0 ? q.attempts.reduce((sum, a) => sum + a.percentage, 0) / q.attempts.length : 0,
      })),
      assignments: cAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        submissionsCount: a.submissions.length,
        gradedCount: a.submissions.filter((s) => s.status === AssignmentSubmissionStatus.GRADED).length,
      })),
      students: cEnrollments.map((e) => ({
        id: e.user.id,
        name: `${e.user.firstName} ${e.user.lastName}`,
        email: e.user.email,
        progress: e.progressPercentage,
        status: e.status,
        enrolledAt: e.enrolledAt,
      })),
    };
  }

  async getStudents(userId: string, role: string) {
    const instructorFilter = this.getInstructorFilter(userId, role);
    this.verifyInstructorRole(role);

    const enrollments = await prisma.enrollment.findMany({
      where: { course: { ...instructorFilter, deletedAt: null }, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return enrollments.map((e) => ({
      id: e.user.id,
      name: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      phone: e.user.phone,
      courseTitle: e.course.title,
      progressPercentage: e.progressPercentage,
      status: e.status,
      enrolledAt: e.enrolledAt,
    }));
  }

  async getAssignments(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.assignments;
  }

  async getQuizzes(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.quizzes;
  }

  async getCertificates(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.certificates;
  }

  async getNotifications(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.notifications;
  }

  async getAnalytics(userId: string, role: string) {
    this.verifyInstructorRole(role);
    const full = await this.getFullDashboard(userId, role);

    await ServiceContainer.audit.log({
      userId,
      action: "ANALYTICS_VIEWED",
      resource: "InstructorDashboard",
      resourceId: userId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return {
      studentAnalytics: full.studentAnalytics,
      performanceMetrics: full.performanceMetrics,
      recentActivity: full.recentActivity,
    };
  }
}

export const instructorDashboardService = new InstructorDashboardService();
