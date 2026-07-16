import { Notification } from "../../../generated/client";
import { CreateNotificationInput, NotificationFilterInput, PaginationInput } from "../validators/notification.validator";

export interface NotificationPage {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  nextCursor?: string;
}

export interface INotificationService {
  /**
   * Create a single notification for one user.
   */
  create(input: CreateNotificationInput): Promise<Notification>;

  /**
   * Create notifications for multiple users atomically (transaction).
   */
  createBulk(inputs: CreateNotificationInput[]): Promise<{ count: number }>;

  /**
   * Fetch one notification by id. Throws if not found or wrong owner.
   */
  findById(id: string, userId: string): Promise<Notification>;

  /**
   * List notifications for a user with filtering, search, and pagination.
   */
  findAll(userId: string, pagination: PaginationInput, filters: NotificationFilterInput): Promise<NotificationPage>;

  /**
   * List only unread notifications.
   */
  findUnread(userId: string, pagination: PaginationInput): Promise<NotificationPage>;

  /**
   * Mark a single notification as read.
   */
  markAsRead(id: string, userId: string): Promise<Notification>;

  /**
   * Mark all of a user's notifications as read.
   */
  markAllAsRead(userId: string): Promise<{ count: number }>;

  /**
   * Archive a single notification (soft-status change, still visible).
   */
  archive(id: string, userId: string): Promise<Notification>;

  /**
   * Archive all active notifications for a user.
   */
  archiveAll(userId: string): Promise<{ count: number }>;

  /**
   * Soft-delete a single notification.
   */
  delete(id: string, userId: string): Promise<void>;

  /**
   * Soft-delete all active notifications for a user.
   */
  deleteAll(userId: string): Promise<{ count: number }>;

  /**
   * Return count of unread notifications for a user.
   */
  countUnread(userId: string): Promise<number>;
}

// ──────────────────────────────────────────────────────
// Future-ready event interface — implementations plug in here
// without touching INotificationService or any business logic.
// ──────────────────────────────────────────────────────
export interface INotificationEventPublisher {
  publish(notification: Notification): Promise<void>;
}

// ──────────────────────────────────────────────────────
// Reusable trigger helpers — to be called by future feature
// modules (Course, Payment, Certificate, etc.) so they never
// import Prisma directly for notifications.
// ──────────────────────────────────────────────────────
export interface INotificationTriggers {
  onUserRegistered(userId: string, name: string): Promise<void>;
  onEmailVerified(userId: string): Promise<void>;
  onCoursePurchased(userId: string, courseName: string, courseId: string): Promise<void>;
  onEnrollmentSuccessful(userId: string, courseName: string, courseId: string): Promise<void>;
  onCertificateGenerated(userId: string, courseName: string, certificateId: string): Promise<void>;
  onPaymentSuccessful(userId: string, amount: string, orderId: string): Promise<void>;
  onPasswordChanged(userId: string): Promise<void>;
  onSecurityAlert(userId: string, description: string): Promise<void>;
  onSystemAnnouncement(userIds: string[], title: string, message: string): Promise<void>;
}
