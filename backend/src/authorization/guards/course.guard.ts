import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/client";
import { NotFoundError } from "@/errors/custom-errors";
import { PermissionDeniedException } from "../errors/authorization-exceptions";
import { CoursePolicy } from "../policies/course.policy";
import { AuthorizationService } from "../services/authorization.service";

export class CourseGuard {
  static check(action: "read" | "update" | "delete") {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const courseId = (req.params.courseId || req.params.id) as string;
        if (!courseId) {
          return next();
        }

        const course = (await prisma.course.findUnique({
          where: { id: courseId },
        })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!course) {
          throw new NotFoundError("Course not found");
        }

        if (!req.user) {
          throw new PermissionDeniedException("User not authenticated");
        }

        const userId = req.user.userId;
        const role = req.user.role;
        const instructorId = course.instructorId;

        let allowed = false;
        if (action === "read") {
          allowed = CoursePolicy.canRead(userId, role, instructorId);
        } else if (action === "update") {
          allowed = CoursePolicy.canUpdate(userId, role, instructorId);
        } else if (action === "delete") {
          allowed = CoursePolicy.canDelete(userId, role, instructorId);
        }

        if (!allowed) {
          const userAgent = req.headers["user-agent"];
          const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
          await AuthorizationService.logViolation(
            userId,
            `COURSE_${action.toUpperCase()}_DENIED`,
            "Course",
            courseId,
            req.ip,
            device,
            req.originalUrl,
            req.method
          );
          throw new PermissionDeniedException(`Access denied: Cannot ${action} course`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).course = course;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
