import { Notification, NotificationStatus, Prisma } from "../../../generated/client";
import { INotificationService, INotificationTriggers, NotificationPage } from "../interfaces/notification-service.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
import { IMetricsService } from "../../shared/metrics.interface";
import { NotificationConfig } from "../../shared/config.schema";
import { prisma } from "@/database/client";
import { NotificationType, NotificationPriority } from "@/generated/client";
import { ServiceContainer } from "../../shared/service-container";
import {
  CreateNotificationInput,
  NotificationFilterInput,
  PaginationInput,
} from "../validators/notification.validator";
import {
  NotificationNotFoundException,
  NotificationPermissionException,
} from "../errors/notification-exceptions";

export class DatabaseNotificationProvider
  implements INotificationService, INotificationTriggers, ILifecycleService, IHealthCheckService, IMetricsService
{
  private createdCount = 0;
  private readCount = 0;

  constructor(private readonly config: NotificationConfig) {}

  async initialize(): Promise<void> {
    ServiceContainer.logger.info("DatabaseNotificationProvider initialized");
  }

  async shutdown(): Promise<void> {
    ServiceContainer.logger.info("DatabaseNotificationProvider shutdown");
  }

  // ─── Core CRUD ────────────────────────────────────────────────────────────

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        priority: input.priority ?? NotificationPriority.NORMAL,
        actionUrl: input.actionUrl ?? null,
        icon: input.icon ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: NotificationStatus.ACTIVE,
        isRead: false,
      },
    });

    this.createdCount++;
    ServiceContainer.logger.info(`Notification created [${notification.id}] for user [${input.userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId: input.userId,
        action: "NOTIFICATION_CREATED",
        resource: "Notification",
        resourceId: notification.id,
        details: { type: input.type, priority: input.priority },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return notification;
  }

  async createBulk(inputs: CreateNotificationInput[]): Promise<{ count: number }> {
    if (inputs.length === 0) return { count: 0 };

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.notification.createMany({
        data: inputs.map((input) => ({
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
          priority: input.priority ?? NotificationPriority.NORMAL,
          actionUrl: input.actionUrl ?? null,
          icon: input.icon ?? null,
          metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          status: NotificationStatus.ACTIVE,
          isRead: false,
        })),
        skipDuplicates: false,
      });
      return created;
    });

    this.createdCount += result.count;
    ServiceContainer.logger.info(`Bulk notification created: ${result.count} notifications`);

    try {
      await ServiceContainer.audit.log({
        userId: "system",
        action: "BULK_NOTIFICATION_CREATED",
        resource: "Notification",
        resourceId: "bulk",
        details: { count: result.count },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return { count: result.count };
  }

  async findById(id: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findFirst({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotificationNotFoundException(`Notification [${id}] not found`);
    }
    // Strict ownership check — prevents IDOR
    if (notification.userId !== userId) {
      throw new NotificationPermissionException("You do not have permission to access this notification");
    }

    return notification;
  }

  async findAll(
    userId: string,
    pagination: PaginationInput,
    filters: NotificationFilterInput
  ): Promise<NotificationPage> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
      status: { not: NotificationStatus.DELETED },
      ...(filters.isRead !== undefined && { isRead: filters.isRead }),
      ...(filters.type && { type: filters.type }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom && { gte: filters.dateFrom }),
              ...(filters.dateTo && { lte: filters.dateTo }),
            },
          }
        : {}),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { message: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    const orderBy: Prisma.NotificationOrderByWithRelationInput = {
      [pagination.sortBy]: pagination.sortOrder,
    };

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take: pagination.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pagination.limit);
    const nextCursor = data.length === pagination.limit ? data[data.length - 1].id : undefined;

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      nextCursor,
    };
  }

  async findUnread(userId: string, pagination: PaginationInput): Promise<NotificationPage> {
    return this.findAll(userId, pagination, { isRead: false });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    // Verify ownership first
    await this.findById(id, userId);

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    this.readCount++;
    ServiceContainer.logger.info(`Notification [${id}] marked as read by user [${userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTIFICATION_READ",
        resource: "Notification",
        resourceId: id,
        details: {},
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null, status: { not: NotificationStatus.DELETED } },
      data: { isRead: true, readAt: new Date() },
    });

    ServiceContainer.logger.info(`Marked ${result.count} notifications as read for user [${userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTIFICATION_READ_ALL",
        resource: "Notification",
        resourceId: "all",
        details: { count: result.count },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return { count: result.count };
  }

  async archive(id: string, userId: string): Promise<Notification> {
    await this.findById(id, userId);

    const notification = await prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.ARCHIVED },
    });

    ServiceContainer.logger.info(`Notification [${id}] archived by user [${userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTIFICATION_ARCHIVED",
        resource: "Notification",
        resourceId: id,
        details: {},
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return notification;
  }

  async archiveAll(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.ACTIVE, deletedAt: null },
      data: { status: NotificationStatus.ARCHIVED },
    });

    ServiceContainer.logger.info(`Archived ${result.count} notifications for user [${userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTIFICATION_ARCHIVED_ALL",
        resource: "Notification",
        resourceId: "all",
        details: { count: result.count },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return { count: result.count };
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id, userId);

    await prisma.notification.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: NotificationStatus.DELETED,
      },
    });

    ServiceContainer.logger.info(`Notification [${id}] soft-deleted by user [${userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTIFICATION_DELETED",
        resource: "Notification",
        resourceId: id,
        details: {},
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }
  }

  async deleteAll(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, deletedAt: null, status: { not: NotificationStatus.DELETED } },
      data: {
        deletedAt: new Date(),
        status: NotificationStatus.DELETED,
      },
    });

    ServiceContainer.logger.info(`Soft-deleted ${result.count} notifications for user [${userId}]`);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTIFICATION_DELETED_ALL",
        resource: "Notification",
        resourceId: "all",
        details: { count: result.count },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return { count: result.count };
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null, status: { not: NotificationStatus.DELETED } },
    });
  }

  // ─── Trigger Helpers (called by future feature modules) ──────────────────

  async onUserRegistered(userId: string, name: string): Promise<void> {
    await this.create({
      userId,
      title: "Welcome to IndiWebPros! 🎉",
      message: `Hi ${name}! Your account has been created successfully. Start exploring our courses.`,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/dashboard",
      icon: "user-check",
    });
  }

  async onEmailVerified(userId: string): Promise<void> {
    await this.create({
      userId,
      title: "Email Verified ✅",
      message: "Your email address has been verified. Your account is now fully activated.",
      type: NotificationType.SECURITY,
      priority: NotificationPriority.NORMAL,
      icon: "shield-check",
    });
  }

  async onCoursePurchased(userId: string, courseName: string, courseId: string): Promise<void> {
    await this.create({
      userId,
      title: "Course Purchased! 🛒",
      message: `You have successfully purchased "${courseName}". Click to start learning!`,
      type: NotificationType.PAYMENT,
      priority: NotificationPriority.HIGH,
      actionUrl: `/courses/${courseId}`,
      icon: "shopping-cart",
    });
  }

  async onEnrollmentSuccessful(userId: string, courseName: string, courseId: string): Promise<void> {
    await this.create({
      userId,
      title: "Enrollment Successful! 📚",
      message: `You are now enrolled in "${courseName}". Good luck!`,
      type: NotificationType.ENROLLMENT,
      priority: NotificationPriority.HIGH,
      actionUrl: `/courses/${courseId}/learn`,
      icon: "book-open",
    });
  }

  async onCertificateGenerated(userId: string, courseName: string, certificateId: string): Promise<void> {
    await this.create({
      userId,
      title: "Certificate Earned! 🏆",
      message: `Congratulations! You earned a certificate for completing "${courseName}".`,
      type: NotificationType.CERTIFICATE,
      priority: NotificationPriority.HIGH,
      actionUrl: `/certificates/${certificateId}`,
      icon: "award",
    });
  }

  async onPaymentSuccessful(userId: string, amount: string, orderId: string): Promise<void> {
    await this.create({
      userId,
      title: "Payment Successful 💳",
      message: `Your payment of ₹${amount} was processed successfully. Order ID: ${orderId}`,
      type: NotificationType.PAYMENT,
      priority: NotificationPriority.NORMAL,
      icon: "credit-card",
    });
  }

  async onPasswordChanged(userId: string): Promise<void> {
    await this.create({
      userId,
      title: "Password Changed 🔒",
      message: "Your password was changed. If this was not you, please contact support immediately.",
      type: NotificationType.SECURITY,
      priority: NotificationPriority.CRITICAL,
      icon: "lock",
    });
  }

  async onSecurityAlert(userId: string, description: string): Promise<void> {
    await this.create({
      userId,
      title: "Security Alert ⚠️",
      message: description,
      type: NotificationType.SECURITY,
      priority: NotificationPriority.CRITICAL,
      icon: "alert-triangle",
    });
  }

  async onSystemAnnouncement(userIds: string[], title: string, message: string): Promise<void> {
    await this.createBulk(
      userIds.map((userId) => ({
        userId,
        title,
        message,
        type: NotificationType.ANNOUNCEMENT,
        priority: NotificationPriority.NORMAL,
        icon: "megaphone",
      }))
    );
  }

  // ─── Health, Metrics, Lifecycle ───────────────────────────────────────────

  async health(): Promise<HealthStatus> {
    try {
      await prisma.notification.count();
      return {
        service: "notification-database",
        status: "healthy",
        latency: 0,
        message: "DatabaseNotificationProvider connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: "notification-database",
        status: "unhealthy",
        latency: 0,
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async metrics(): Promise<Record<string, unknown>> {
    return {
      notifications_created_count: this.createdCount,
      notifications_read_count: this.readCount,
    };
  }

  async resetMetrics(): Promise<void> {
    this.createdCount = 0;
    this.readCount = 0;
  }

  async recordMetric(name: string, value: number): Promise<void> {
    if (name === "notifications_created_count") this.createdCount = value;
    if (name === "notifications_read_count") this.readCount = value;
  }
}
