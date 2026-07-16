import { Request, Response, NextFunction } from "express";
import { courseService } from "../services/course.service";
import { createCourseSchema, updateCourseSchema, courseFilterSchema } from "../validators/course.validator";
import { ValidationError } from "@/errors/custom-errors";

export class CourseController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = courseFilterSchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationError("Invalid filter params", parsed.error.errors);
      const result = await courseService.findAll(parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseService.findBySlug(req.params.slug as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseService.findById(req.params.id as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCourseSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid course data", parsed.error.errors);
      const data = await courseService.create(parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateCourseSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid course data", parsed.error.errors);
      const data = await courseService.update(req.params.id as string, parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseService.publish(req.params.id as string, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseService.archive(req.params.id as string, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseService.duplicate(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await courseService.delete(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
