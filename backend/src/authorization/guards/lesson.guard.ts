import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/client";
import { NotFoundError } from "@/errors/custom-errors";
import { PermissionDeniedException } from "../errors/authorization-exceptions";
import { LessonPolicy } from "../policies/lesson.policy";
import { AuthorizationService } from "../services/authorization.service";

export class LessonGuard {
  static check(action: "read" | "update" | "delete") {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const lessonId = (req.params.lessonId || req.params.id) as string;
        if (!lessonId) {
          return next();
        }

        const lesson = (await prisma.lesson.findUnique({
          where: { id: lessonId },
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!lesson) {
          throw new NotFoundError("Lesson not found");
        }

        if (!req.user) {
          throw new PermissionDeniedException("User not authenticated");
        }

        const userId = req.user.userId;
        const role = req.user.role;
        const instructorId = lesson.module.course.instructorId;

        let allowed = false;
        if (action === "read") {
          allowed = LessonPolicy.canRead(userId, role, instructorId);
        } else if (action === "update") {
          allowed = LessonPolicy.canUpdate(userId, role, instructorId);
        } else if (action === "delete") {
          allowed = LessonPolicy.canDelete(userId, role, instructorId);
        }

        if (!allowed) {
          const userAgent = req.headers["user-agent"];
          const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
          await AuthorizationService.logViolation(
            userId,
            `LESSON_${action.toUpperCase()}_DENIED`,
            "Lesson",
            lessonId,
            req.ip,
            device,
            req.originalUrl,
            req.method
          );
          throw new PermissionDeniedException(`Access denied: Cannot ${action} lesson`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).lesson = lesson;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
