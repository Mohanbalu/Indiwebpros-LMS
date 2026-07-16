import { Request, Response, NextFunction } from "express";
import { adminDashboardService } from "../services/admin-dashboard.service";
import { ValidationError } from "@/errors/custom-errors";

export class AdminDashboardController {
  static async getFullDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getFullDashboard(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getUsers(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = req.params.id as string;
      if (!targetId) throw new ValidationError("User ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getUserById(targetId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = req.params.id as string;
      const { status } = req.body;
      if (!targetId || !status) {
        throw new ValidationError("Missing required parameters: User ID, status");
      }

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.updateUserStatus(targetId, status, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = req.params.id as string;
      const { roleId } = req.body;
      if (!targetId || !roleId) {
        throw new ValidationError("Missing required parameters: User ID, roleId");
      }

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.updateUserRole(targetId, roleId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async logoutUserSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = req.params.id as string;
      if (!targetId) throw new ValidationError("User ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.logoutUserSessions(targetId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getCourses(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async publishCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string;
      if (!courseId) throw new ValidationError("Course ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.publishCourse(courseId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async archiveCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string;
      if (!courseId) throw new ValidationError("Course ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.archiveCourse(courseId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getEnrollments(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getCertificates(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async regenerateCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { certificateId } = req.body;
      if (!certificateId) throw new ValidationError("Certificate ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.regenerateCertificate(certificateId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getAnalytics(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getAuditLogs(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStorageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getStorageStats(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await adminDashboardService.getSystemHealth(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
