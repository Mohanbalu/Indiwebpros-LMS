import { z } from "zod";
import { LessonResourceType } from "@/generated/client";

export const createResourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  fileId: z.string().uuid("Invalid file ID"),
  resourceType: z.nativeEnum(LessonResourceType).default(LessonResourceType.OTHER),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
