import { Request, Response, NextFunction } from "express";
import { enrollmentService } from "../services/enrollment.service";
import { ValidationError, ForbiddenError } from "@/errors/custom-errors";
import { adminGrantEnrollmentSchema } from "../validators/enrollment.validator";

export class EnrollmentController {
  static async getMyCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const courses = await enrollmentService.findMyCourses(userId);
      res.json({ success: true, data: courses });
    } catch (e) { next(e); }
  }

  static async getEnrollmentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const enrollment = await enrollmentService.getEnrollmentById(id, userId, role);
      res.json({ success: true, data: enrollment });
    } catch (e) { next(e); }
  }

  static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const filters = {
        userId: req.query.userId as string | undefined,
        courseId: req.query.courseId as string | undefined,
        status: req.query.status as any | undefined,
        accessType: req.query.accessType as any | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await enrollmentService.listAllEnrollments(userId, role, filters);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async grantEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = adminGrantEnrollmentSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid grant enrollment parameters", parsed.error.errors);

      const adminUserId = req.user!.userId;
      const enrollment = await enrollmentService.grantEnrollmentManual(
        parsed.data.userId,
        parsed.data.courseId,
        parsed.data.accessType,
        parsed.data.durationDays,
        adminUserId
      );

      res.status(201).json({ success: true, data: enrollment });
    } catch (e) { next(e); }
  }

  static async cancelEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const adminUserId = req.user!.userId;
      const enrollment = await enrollmentService.cancelEnrollmentManual(id, adminUserId);
      res.json({ success: true, data: enrollment });
    } catch (e) { next(e); }
  }

  static async expireEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const adminUserId = req.user!.userId;
      const enrollment = await enrollmentService.expireEnrollmentManual(id, adminUserId);
      res.json({ success: true, data: enrollment });
    } catch (e) { next(e); }
  }
}
