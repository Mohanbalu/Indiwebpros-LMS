import { z } from "zod";
import { NotificationType, NotificationPriority } from "@/generated/client";

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
  sortBy: z.enum(["createdAt", "priority", "type"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const notificationFilterSchema = z.object({
  isRead: z
    .preprocess((v) => {
      if (v === "true" || v === true) return true;
      if (v === "false" || v === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  type: z.nativeEnum(NotificationType).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().max(200).optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid("Invalid userId"),
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message too long"),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  actionUrl: z.string().url().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  type: z.nativeEnum(NotificationType).default(NotificationType.ANNOUNCEMENT),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  actionUrl: z.string().url().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  // Target: specific userIds, or an entire roleName, or "all"
  targetUserIds: z.array(z.string().uuid()).optional(),
  targetRole: z.string().optional(),
  targetAll: z.boolean().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
