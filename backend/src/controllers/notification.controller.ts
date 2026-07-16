import { Request, Response, NextFunction } from "express";
import { ServiceContainer } from "../services";
import { ValidationError, NotFoundError, ForbiddenError } from "../errors/custom-errors";
import {
  paginationSchema,
  notificationFilterSchema,
  createNotificationSchema,
  broadcastSchema,
  uuidSchema,
} from "../services/notification";
import { NotificationStatus, NotificationType, NotificationPriority } from "../generated/client";
import { prisma } from "@/database/client";

export class NotificationController {
  // ─── GET /api/v1/notifications ────────────────────────────────────────────
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const pagination = paginationSchema.parse(req.query);
      const filters = notificationFilterSchema.parse(req.query);

      const result = await ServiceContainer.notification.findAll(userId, pagination, filters);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/v1/notifications/unread ─────────────────────────────────────
  static async getUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const pagination = paginationSchema.parse(req.query);

      const result = await ServiceContainer.notification.findUnread(userId, pagination);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/v1/notifications/unread/count ───────────────────────────────
  static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const count = await ServiceContainer.notification.countUnread(userId);
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/v1/notifications/:id ────────────────────────────────────────
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const idResult = uuidSchema.safeParse(req.params.id);
      if (!idResult.success) throw new ValidationError("Invalid notification ID");

      const notification = await ServiceContainer.notification.findById(idResult.data, userId);
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  // ─── PATCH /api/v1/notifications/:id/read ────────────────────────────────
  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const idResult = uuidSchema.safeParse(req.params.id);
      if (!idResult.success) throw new ValidationError("Invalid notification ID");

      const notification = await ServiceContainer.notification.markAsRead(idResult.data, userId);
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  // ─── PATCH /api/v1/notifications/read-all ────────────────────────────────
  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await ServiceContainer.notification.markAllAsRead(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── PATCH /api/v1/notifications/:id/archive ─────────────────────────────
  static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const idResult = uuidSchema.safeParse(req.params.id);
      if (!idResult.success) throw new ValidationError("Invalid notification ID");

      const notification = await ServiceContainer.notification.archive(idResult.data, userId);
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  // ─── PATCH /api/v1/notifications/archive-all ─────────────────────────────
  static async archiveAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await ServiceContainer.notification.archiveAll(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── DELETE /api/v1/notifications/:id ────────────────────────────────────
  static async deleteOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const idResult = uuidSchema.safeParse(req.params.id);
      if (!idResult.success) throw new ValidationError("Invalid notification ID");

      await ServiceContainer.notification.delete(idResult.data, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ─── DELETE /api/v1/notifications ─────────────────────────────────────────
  static async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await ServiceContainer.notification.deleteAll(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── ADMIN: POST /api/v1/notifications ────────────────────────────────────
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid notification payload", parsed.error.errors);
      }

      const notification = await ServiceContainer.notification.create(parsed.data);
      res.status(201).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  // ─── ADMIN: POST /api/v1/notifications/broadcast ─────────────────────────
  static async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = broadcastSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid broadcast payload", parsed.error.errors);
      }

      const { title, message, type, priority, actionUrl, icon, metadata, targetUserIds, targetRole, targetAll } =
        parsed.data;

      let userIds: string[] = [];

      if (targetAll) {
        // Broadcast to all active users
        const users = await prisma.user.findMany({
          where: { status: "ACTIVE", deletedAt: null },
          select: { id: true },
        });
        userIds = users.map((u) => u.id);
      } else if (targetRole) {
        // Broadcast to a specific role
        const users = await prisma.user.findMany({
          where: { status: "ACTIVE", deletedAt: null, role: { name: targetRole } },
          select: { id: true },
        });
        userIds = users.map((u) => u.id);
      } else if (targetUserIds && targetUserIds.length > 0) {
        userIds = targetUserIds;
      } else {
        throw new ValidationError("Must specify targetAll, targetRole, or targetUserIds");
      }

      if (userIds.length === 0) {
        res.status(200).json({ success: true, data: { count: 0, message: "No matching users found" } });
        return;
      }

      const result = await ServiceContainer.notification.createBulk(
        userIds.map((userId) => ({ userId, title, message, type, priority, actionUrl, icon, metadata }))
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
