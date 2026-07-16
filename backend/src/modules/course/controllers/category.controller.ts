import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator";
import { ValidationError } from "@/errors/custom-errors";

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === "true" && req.user?.role === "Admin";
      const data = await categoryService.findAll(includeInactive);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.findById(req.params.id as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid category data", parsed.error.errors);
      const data = await categoryService.create(parsed.data, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateCategorySchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid category data", parsed.error.errors);
      const data = await categoryService.update(req.params.id as string, parsed.data, req.user!.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.delete(req.params.id as string, req.user!.userId);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
