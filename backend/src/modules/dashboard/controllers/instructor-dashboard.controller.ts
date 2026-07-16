import { Request, Response, NextFunction } from "express";
import { instructorDashboardService } from "../services/instructor-dashboard.service";
import { ValidationError } from "@/errors/custom-errors";

export class InstructorDashboardController {
  static async getFullDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getFullDashboard(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getStats(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getCourses(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCourseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      if (!courseId) throw new ValidationError("Course ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getCourseDetails(courseId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getStudents(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getAssignments(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getQuizzes(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getCertificates(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getNotifications(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await instructorDashboardService.getAnalytics(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
