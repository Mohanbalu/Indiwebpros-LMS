import { Request, Response, NextFunction } from "express";
import { studentDashboardService } from "../services/dashboard.service";
import { ServiceContainer } from "@/services/shared/service-container";

export class StudentDashboardController {
  static async getFullDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getFullDashboard(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getStats(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getContinueLearning(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getContinueLearning(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getMyCourses(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getCertificates(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getNotifications(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getBookmarks(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getNotes(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getQuizzes(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getAssignments(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getSecurity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await studentDashboardService.getSecurity(userId, role);

      // Audit Log for security viewed
      try {
        await ServiceContainer.audit.log({
          userId,
          action: "SECURITY_VIEWED",
          resource: "StudentDashboard",
          resourceId: userId,
          details: {},
          status: "SUCCESS",
        });
      } catch {}

      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
