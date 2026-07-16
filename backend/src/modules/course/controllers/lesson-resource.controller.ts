import { Request, Response, NextFunction } from "express";
import { lessonResourceService } from "../services/lesson-resource.service";
import { createResourceSchema } from "../validators/resource.validator";
import { ValidationError } from "@/errors/custom-errors";

export class LessonResourceController {
  static async getByLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lessonResourceService.findByLesson(req.params.lessonId as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createResourceSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid resource data", parsed.error.errors);
      const data = await lessonResourceService.create(req.params.lessonId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await lessonResourceService.delete(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
