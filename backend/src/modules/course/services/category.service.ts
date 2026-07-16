import { Category, Prisma } from "@/generated/client";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { resolveUniqueSlug } from "@/utils/slug.util";
import { CategoryNotFoundException } from "../errors/course-exceptions";
import { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";

export class CategoryService {
  async create(input: CreateCategoryInput, userId: string): Promise<Category> {
    const slug = await resolveUniqueSlug(input.name, async (s) => {
      const exists = await prisma.category.findFirst({ where: { slug: s, deletedAt: null } });
      return !!exists;
    });

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        icon: input.icon,
        imageId: input.imageId ?? null,
        parentId: input.parentId ?? null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
      include: { children: true, image: true },
    });

    ServiceContainer.logger.info(`Category created: ${category.id} by user ${userId}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "CATEGORY_CREATED",
        resource: "Category",
        resourceId: category.id,
        details: { name: category.name },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return category;
  }

  async update(id: string, input: UpdateCategoryInput, userId: string): Promise<Category> {
    const existing = await this.findById(id);

    const updateData: Prisma.CategoryUpdateInput = {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.imageId !== undefined && { imageId: input.imageId }),
      ...(input.parentId !== undefined && { parentId: input.parentId }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    };

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: { children: true, image: true, parent: true },
    });

    ServiceContainer.logger.info(`Category updated: ${id}`);
    return category;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id);
    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    ServiceContainer.logger.info(`Category soft-deleted: ${id} by user ${userId}`);
  }

  async findById(id: string): Promise<Category> {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null } }, image: true, parent: true },
    });
    if (!category) throw new CategoryNotFoundException(`Category [${id}] not found`);
    return category;
  }

  async findAll(includeInactive = false) {
    return prisma.category.findMany({
      where: {
        deletedAt: null,
        parentId: null, // Top-level only; children nested
        ...(!includeInactive && { isActive: true }),
      },
      include: {
        children: {
          where: { deletedAt: null, ...(includeInactive ? {} : { isActive: true }) },
          orderBy: { sortOrder: "asc" },
        },
        image: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const categoryService = new CategoryService();
