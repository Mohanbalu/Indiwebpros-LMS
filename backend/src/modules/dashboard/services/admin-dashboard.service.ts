import { prisma } from "@/database/client";
import {
  EnrollmentStatus,
  QuizAttemptStatus,
  AssignmentSubmissionStatus,
  CertificateStatus,
  CourseStatus,
  UserStatus,
} from "@/generated/client";
import { NotFoundError, ForbiddenError } from "@/errors/custom-errors";
import { AdminAccessDeniedException, PlatformHealthException } from "../errors/admin-exceptions";
import { ServiceContainer } from "@/services/shared/service-container";
import { certificateService } from "@/modules/certificate/services/certificate.service";

export class AdminDashboardService {
  private verifyAdminRole(role: string) {
    if (role !== "Admin") {
      throw new AdminAccessDeniedException();
    }
  }

  async getFullDashboard(userId: string, role: string) {
    this.verifyAdminRole(role);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel aggregations for landing metrics
    const [
      users,
      courses,
      enrollments,
      certificatesCount,
      paymentsSuccess,
      submissionsPending,
      filesCount,
      dailyActiveLogs,
      monthlyActiveLogs,
    ] = await Promise.all([
      prisma.user.findMany({
        include: { role: true },
      }),
      prisma.course.findMany({
        where: { deletedAt: null },
      }),
      prisma.enrollment.findMany({
        where: { deletedAt: null },
      }),
      prisma.certificate.count(),
      prisma.payment.findMany({
        where: { status: "SUCCESS" },
        select: { finalAmount: true },
      }),
      prisma.assignmentSubmission.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),
      prisma.file.findMany(),
      // DAU (Unique users in login or activity audits today)
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: todayStart },
          userId: { not: null },
        },
      }),
      // MAU (Unique users in last 30 days)
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
      }),
    ]);

    const totalRevenue = paymentsSuccess.reduce((sum, p) => sum + Number(p.finalAmount), 0);
    const storageBytes = filesCount.reduce((sum, f) => sum + f.size, 0);

    const rolesCount = {
      Admin: users.filter((u) => u.role.name === "Admin").length,
      Instructor: users.filter((u) => u.role.name === "Instructor").length,
      Mentor: users.filter((u) => u.role.name === "Mentor").length,
      Student: users.filter((u) => u.role.name === "Student").length,
    };

    // System Health Check (Database and AWS configuration references)
    const databaseStatus = "UP";
    const s3Status = process.env.AWS_BUCKET_NAME ? "UP" : "DOWN";
    const sesStatus = process.env.SES_SENDER_EMAIL ? "UP" : "DOWN";

    const systemConfig = {
      environment: process.env.NODE_ENV || "development",
      awsRegion: process.env.AWS_REGION || "us-east-1",
      appVersion: "1.0.0",
    };

    // Audit log
    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_DASHBOARD_VIEWED",
      resource: "AdminDashboard",
      resourceId: userId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return {
      platformOverview: {
        totalUsers: users.length,
        rolesCount,
        dailyActiveUsers: dailyActiveLogs.length,
        monthlyActiveUsers: monthlyActiveLogs.length,
        courses: {
          total: courses.length,
          published: courses.filter((c) => c.status === CourseStatus.PUBLISHED).length,
          draft: courses.filter((c) => c.status === CourseStatus.DRAFT).length,
        },
        enrollmentsCount: enrollments.length,
        certificatesIssued: certificatesCount,
        totalRevenue,
        pendingReviews: submissionsPending,
      },
      systemHealth: {
        databaseStatus,
        s3Status,
        sesStatus,
        storageUsageMb: Math.round(storageBytes / (1024 * 1024) * 100) / 100,
        serverUptimeHours: process.uptime() / 3600,
      },
      systemConfig,
    };
  }

  // User Management
  async getUsers(userId: string, role: string) {
    this.verifyAdminRole(role);
    return prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserById(targetId: string, userId: string, role: string) {
    this.verifyAdminRole(role);

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        role: true,
        sessions: { where: { isActive: true } },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async updateUserStatus(targetId: string, status: string, userId: string, role: string) {
    this.verifyAdminRole(role);

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { status: status as UserStatus },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_USER_STATUS_UPDATED",
      resource: "User",
      resourceId: targetId,
      details: { status },
      status: "SUCCESS",
    }).catch(() => {});

    return updated;
  }

  async updateUserRole(targetId: string, roleId: string, userId: string, role: string) {
    this.verifyAdminRole(role);

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { roleId },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_USER_ROLE_UPDATED",
      resource: "User",
      resourceId: targetId,
      details: { roleId },
      status: "SUCCESS",
    }).catch(() => {});

    return updated;
  }

  async logoutUserSessions(targetId: string, userId: string, role: string) {
    this.verifyAdminRole(role);

    await prisma.session.updateMany({
      where: { userId: targetId, isActive: true },
      data: { isActive: false },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_USER_SESSIONS_FORCE_LOGOUT",
      resource: "User",
      resourceId: targetId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return { success: true };
  }

  // Course Management
  async getCourses(userId: string, role: string) {
    this.verifyAdminRole(role);
    return prisma.course.findMany({
      where: { deletedAt: null },
      include: { instructor: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async publishCourse(courseId: string, userId: string, role: string) {
    this.verifyAdminRole(role);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_COURSE_PUBLISHED",
      resource: "Course",
      resourceId: courseId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return updated;
  }

  async archiveCourse(courseId: string, userId: string, role: string) {
    this.verifyAdminRole(role);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_COURSE_ARCHIVED",
      resource: "Course",
      resourceId: courseId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return updated;
  }

  // Enrollments
  async getEnrollments(userId: string, role: string) {
    this.verifyAdminRole(role);
    return prisma.enrollment.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }

  // Certificates
  async getCertificates(userId: string, role: string) {
    this.verifyAdminRole(role);
    return prisma.certificate.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        course: { select: { title: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  async regenerateCertificate(certificateId: string, userId: string, role: string) {
    this.verifyAdminRole(role);
    return certificateService.regenerateCertificate(certificateId, userId);
  }

  // Analytics
  async getAnalytics(userId: string, role: string) {
    this.verifyAdminRole(role);
    const full = await this.getFullDashboard(userId, role);

    await ServiceContainer.audit.log({
      userId,
      action: "ADMIN_ANALYTICS_VIEWED",
      resource: "AdminDashboard",
      resourceId: userId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return {
      overview: full.platformOverview,
    };
  }

  // Audit Logs
  async getAuditLogs(userId: string, role: string) {
    this.verifyAdminRole(role);
    return prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  // Storage Stats
  async getStorageStats(userId: string, role: string) {
    this.verifyAdminRole(role);
    const files = await prisma.file.findMany({
      orderBy: { size: "desc" },
    });

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

    return {
      totalSizeMb: Math.round(totalBytes / (1024 * 1024) * 100) / 100,
      filesCount: files.length,
      largestFiles: files.slice(0, 10).map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        url: f.url,
      })),
    };
  }

  // Health Checks
  async getSystemHealth(userId: string, role: string) {
    this.verifyAdminRole(role);
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      throw new PlatformHealthException("PostgreSQL Database is unreachable");
    }

    const databaseStatus = "UP";
    const s3Status = process.env.AWS_BUCKET_NAME ? "UP" : "DOWN";

    return {
      databaseStatus,
      s3Status,
      sesStatus: process.env.SES_SENDER_EMAIL ? "UP" : "DOWN",
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
