import { z } from "zod";

export const videoProgressSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  positionSeconds: z.coerce.number().int().min(0, "Playback position cannot be negative"),
  durationSeconds: z.coerce.number().int().positive("Lesson duration must be positive"),
});

export const pdfProgressSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  pageNumber: z.coerce.number().int().positive("Page number must be positive"),
  totalPages: z.coerce.number().int().positive("Total pages must be positive"),
});

export const articleProgressSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  completed: z.boolean().default(true),
});

export const bookmarkSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
});

export const createNoteSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().min(1, "Note content cannot be empty"),
  videoTimestamp: z.coerce.number().int().min(0).default(0),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().min(1, "Note content cannot be empty"),
  videoTimestamp: z.coerce.number().int().min(0).optional(),
});

export const playerFilterSchema = z.object({
  courseId: z.string().uuid("Invalid course ID").optional(),
  lessonId: z.string().uuid("Invalid lesson ID").optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type VideoProgressInput = z.infer<typeof videoProgressSchema>;
export type PdfProgressInput = z.infer<typeof pdfProgressSchema>;
export type ArticleProgressInput = z.infer<typeof articleProgressSchema>;
export type BookmarkInput = z.infer<typeof bookmarkSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type PlayerFilterInput = z.infer<typeof playerFilterSchema>;
