import { z } from "zod";
import { LessonType, LessonStatus } from "@/generated/client";

export const createLessonSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  videoId: z.string().uuid().optional().nullable(),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  lessonType: z.nativeEnum(LessonType).default(LessonType.VIDEO),
  isPreview: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderLessonsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ).min(1),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
