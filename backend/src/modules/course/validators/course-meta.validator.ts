import { z } from "zod";

export const createFAQSchema = z.object({
  question: z.string().trim().min(5).max(500),
  answer: z.string().trim().min(5).max(2000),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateFAQSchema = createFAQSchema.partial();

export const createRequirementSchema = z.object({
  text: z.string().trim().min(2).max(300),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const createOutcomeSchema = z.object({
  text: z.string().trim().min(2).max(300),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export type CreateFAQInput = z.infer<typeof createFAQSchema>;
export type UpdateFAQInput = z.infer<typeof updateFAQSchema>;
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type CreateOutcomeInput = z.infer<typeof createOutcomeSchema>;
export type TagInput = z.infer<typeof tagSchema>;
