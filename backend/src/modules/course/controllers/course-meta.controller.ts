import { Request, Response, NextFunction } from "express";
import { courseMetaService } from "../services/course-meta.service";
import {
  createFAQSchema, updateFAQSchema,
  createRequirementSchema, createOutcomeSchema, tagSchema,
} from "../validators/course-meta.validator";
import { ValidationError } from "@/errors/custom-errors";

export class CourseMetaController {
  // ── FAQs ─────────────────────────────────────────────────────────────────
  static async listFAQs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseMetaService.listFAQs(req.params.courseId as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createFAQSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid FAQ data", parsed.error.errors);
      const data = await courseMetaService.createFAQ(req.params.courseId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateFAQSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid FAQ data", parsed.error.errors);
      const data = await courseMetaService.updateFAQ(req.params.id as string, parsed.data, req.user!.userId, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async deleteFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      await courseMetaService.deleteFAQ(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }

  // ── Requirements ──────────────────────────────────────────────────────────
  static async listRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseMetaService.listRequirements(req.params.courseId as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createRequirementSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid requirement data", parsed.error.errors);
      const data = await courseMetaService.createRequirement(req.params.courseId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async deleteRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      await courseMetaService.deleteRequirement(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }

  // ── Outcomes ──────────────────────────────────────────────────────────────
  static async listOutcomes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseMetaService.listOutcomes(req.params.courseId as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createOutcome(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createOutcomeSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid outcome data", parsed.error.errors);
      const data = await courseMetaService.createOutcome(req.params.courseId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async deleteOutcome(req: Request, res: Response, next: NextFunction) {
    try {
      await courseMetaService.deleteOutcome(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  static async listTags(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await courseMetaService.listTags(req.params.courseId as string);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async addTag(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = tagSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid tag data", parsed.error.errors);
      const data = await courseMetaService.addTag(req.params.courseId as string, parsed.data, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async removeTag(req: Request, res: Response, next: NextFunction) {
    try {
      await courseMetaService.removeTag(req.params.courseId as string, req.params.tagId as string, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
