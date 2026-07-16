import { Request, Response, NextFunction } from "express";
import { moduleService } from "../services/module.service";
import { createModuleSchema, updateModuleSchema, reorderModulesSchema } from "../validators/module.validator";
import { ValidationError } from "@/errors/custom-errors";

export class ModuleController {
  static async getByCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await moduleService.findByCourse(req.params.courseId as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createModuleSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid module data", parsed.error.errors);
      const data = await moduleService.create(req.params.courseId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateModuleSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid module data", parsed.error.errors);
      const data = await moduleService.update(req.params.id as string, parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = reorderModulesSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid reorder data", parsed.error.errors);
      await moduleService.reorder(req.params.courseId as string, parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, message: "Modules reordered" });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await moduleService.delete(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
