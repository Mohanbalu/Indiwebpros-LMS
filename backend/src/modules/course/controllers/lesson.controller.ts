import { Request, Response, NextFunction } from "express";
import { lessonService } from "../services/lesson.service";
import { createLessonSchema, updateLessonSchema, reorderLessonsSchema } from "../validators/lesson.validator";
import { ValidationError } from "@/errors/custom-errors";

export class LessonController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createLessonSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid lesson data", parsed.error.errors);
      const data = await lessonService.create(req.params.moduleId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateLessonSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid lesson data", parsed.error.errors);
      const data = await lessonService.update(req.params.id as string, parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lessonService.publish(req.params.id as string, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = reorderLessonsSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid reorder data", parsed.error.errors);
      await lessonService.reorder(req.params.moduleId as string, parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, message: "Lessons reordered" });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await lessonService.delete(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
