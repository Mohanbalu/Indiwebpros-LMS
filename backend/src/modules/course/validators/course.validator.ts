import { z } from "zod";
import { CourseDifficulty, CourseVisibility, CourseStatus } from "@/generated/client";

export const createCourseSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().uuid("Invalid category ID"),
  instructorId: z.string().uuid("Invalid instructor ID").optional(), // Admin can assign; else defaults to self
  thumbnailId: z.string().uuid().optional().nullable(),
  previewVideoId: z.string().uuid().optional().nullable(),
  difficulty: z.nativeEnum(CourseDifficulty).default(CourseDifficulty.BEGINNER),
  language: z.string().min(2).max(50).default("English"),
  visibility: z.nativeEnum(CourseVisibility).default(CourseVisibility.PUBLIC),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  durationMinutes: z.coerce.number().int().min(0).default(0),
  certificateEnabled: z.boolean().default(true),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().max(200).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
});

export const updateCourseSchema = createCourseSchema
  .partial()
  .refine(
    (data) => {
      if (data.discountPrice !== undefined && data.discountPrice !== null && data.price !== undefined) {
        return data.discountPrice < data.price;
      }
      return true;
    },
    { message: "Discount price must be less than the original price" }
  );

export const courseFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  visibility: z.nativeEnum(CourseVisibility).optional(),
  instructorId: z.string().uuid().optional(),
  language: z.string().optional(),
  featured: z.preprocess((v) => v === "true" || v === true, z.boolean()).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tags: z.string().optional(), // comma-separated
  sortBy: z.enum(["createdAt", "publishedAt", "price", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseFilterInput = z.infer<typeof courseFilterSchema>;
