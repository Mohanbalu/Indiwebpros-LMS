import { Request, Response, NextFunction } from "express";
import { coursePlayerService } from "../services/player.service";
import { learningProgressService } from "../services/progress.service";
import { ValidationError } from "@/errors/custom-errors";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import {
  videoProgressSchema,
  pdfProgressSchema,
  articleProgressSchema,
  bookmarkSchema,
  createNoteSchema,
  updateNoteSchema,
  playerFilterSchema,
} from "../validators/player.validator";

export class CoursePlayerController {
  static async getCourseStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await coursePlayerService.getCourseStructureForPlayer(courseId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getLessonDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonId = req.params.lessonId as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const data = await coursePlayerService.getLessonDetailsForPlayer(lessonId, userId, role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async trackDownload(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = req.params.resourceId as string;
      const userId = req.user!.userId;

      await coursePlayerService.trackDownloadRequest(userId, resourceId);
      res.json({ success: true, message: "Download request logged" });
    } catch (e) { next(e); }
  }

  static async updateVideoProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = videoProgressSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid video progress data", parsed.error.errors);

      const userId = req.user!.userId;
      const role = req.user!.role;

      const result = await learningProgressService.updateVideoProgress(userId, role, parsed.data);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async updatePdfProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = pdfProgressSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid PDF progress data", parsed.error.errors);

      const userId = req.user!.userId;
      const role = req.user!.role;

      const result = await learningProgressService.updatePdfProgress(userId, role, parsed.data);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async updateArticleProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = articleProgressSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid article progress data", parsed.error.errors);

      const userId = req.user!.userId;
      const role = req.user!.role;

      const result = await learningProgressService.updateArticleProgress(userId, role, parsed.data);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async getResumeLearning(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = await coursePlayerService.getResumeLearning(userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────
  static async addBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = bookmarkSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid bookmark details", parsed.error.errors);

      const userId = req.user!.userId;
      const bookmark = await coursePlayerService.addBookmark(userId, parsed.data.lessonId);
      res.status(201).json({ success: true, data: bookmark });
    } catch (e) { next(e); }
  }

  static async removeBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      await coursePlayerService.removeBookmark(id, userId);
      res.status(204).send();
    } catch (e) { next(e); }
  }

  static async listBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const bookmarks = await coursePlayerService.listBookmarks(userId);
      res.json({ success: true, data: bookmarks });
    } catch (e) { next(e); }
  }

  // ── Notes ────────────────────────────────────────────────────────────────
  static async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createNoteSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid note contents", parsed.error.errors);

      const userId = req.user!.userId;
      const note = await coursePlayerService.createNote(userId, parsed.data);
      res.status(201).json({ success: true, data: note });
    } catch (e) { next(e); }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = updateNoteSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid note parameters", parsed.error.errors);

      const userId = req.user!.userId;
      const note = await coursePlayerService.updateNote(id, userId, parsed.data);
      res.json({ success: true, data: note });
    } catch (e) { next(e); }
  }

  static async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      await coursePlayerService.deleteNote(id, userId);
      res.status(204).send();
    } catch (e) { next(e); }
  }

  static async listNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = playerFilterSchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationError("Invalid filter parameters", parsed.error.errors);

      const userId = req.user!.userId;
      const result = await coursePlayerService.listNotes(userId, parsed.data);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async streamVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const fetchDest = req.headers["sec-fetch-dest"];
      if (fetchDest && fetchDest !== "video" && fetchDest !== "empty" && fetchDest !== "audio") {
        res.status(403).send("Direct link access is forbidden.");
        return;
      }

      const lessonId = req.params.lessonId as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, deletedAt: null },
        include: {
          module: true,
          video: true,
        },
      });

      if (!lesson || !lesson.video) {
        res.status(404).send("Video not found.");
        return;
      }

      await learningProgressService.validateEnrollment(userId, lesson.module.courseId, role);

      const range = req.headers.range;
      const { stream, contentType, contentLength, contentRange, acceptRanges } = 
        await (ServiceContainer.storage as any).getStream(lesson.video.key, range);

      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      if (contentType) res.setHeader("Content-Type", contentType);
      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      
      if (range) {
        res.status(206);
      } else {
        res.status(200);
      }

      if (contentLength !== undefined) {
        res.setHeader("Content-Length", contentLength.toString());
      }

      if (stream && typeof stream.pipe === "function") {
        stream.pipe(res);
      } else {
        res.status(500).send("Unable to stream video container.");
      }
    } catch (e) {
      next(e);
    }
  }
}
