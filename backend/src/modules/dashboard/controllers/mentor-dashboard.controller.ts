import { Request, Response, NextFunction } from "express";
import { mentorDashboardService } from "../services/mentor-dashboard.service";
import { ValidationError } from "@/errors/custom-errors";

export class MentorDashboardController {
  static async getFullDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.getFullDashboard(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.getStudents(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStudentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.id as string;
      if (!studentId) throw new ValidationError("Student ID parameter is required");

      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.getStudentDetails(studentId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.getAnalytics(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // Sessions
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.getSessions(userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { studentId, title, description, scheduledAt, meetingLink } = req.body;

      if (!studentId || !title || !scheduledAt) {
        throw new ValidationError("Missing required session fields: studentId, title, scheduledAt");
      }

      const data = await mentorDashboardService.createSession(
        { studentId, title, description, scheduledAt, meetingLink },
        userId,
        role
      );
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.updateSession(sessionId, req.body, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      await mentorDashboardService.deleteSession(sessionId, userId, role);
      res.json({ success: true, message: "Mentoring session deleted successfully" });
    } catch (e) { next(e); }
  }

  // Feedback
  static async createFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { studentId, category, feedback, rating, actionItems } = req.body;

      if (!studentId || !category || !feedback) {
        throw new ValidationError("Missing required feedback fields: studentId, category, feedback");
      }

      const data = await mentorDashboardService.createFeedback(
        { studentId, category, feedback, rating, actionItems },
        userId,
        role
      );
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.updateFeedback(feedbackId, req.body, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // Notes
  static async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { studentId, title, content, visibility } = req.body;

      if (!studentId || !title || !content) {
        throw new ValidationError("Missing required note fields: studentId, title, content");
      }

      const data = await mentorDashboardService.createNote(
        { studentId, title, content, visibility },
        userId,
        role
      );
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const noteId = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await mentorDashboardService.updateNote(noteId, req.body, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
