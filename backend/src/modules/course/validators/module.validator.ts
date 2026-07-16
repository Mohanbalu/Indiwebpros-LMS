import { z } from "zod";

export const createModuleSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateModuleSchema = createModuleSchema.partial();

export const reorderModulesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ).min(1),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;
