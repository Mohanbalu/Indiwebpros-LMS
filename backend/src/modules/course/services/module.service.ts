import { CourseModule, Prisma } from "@/generated/client";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { ModuleNotFoundException, CoursePermissionException } from "../errors/course-exceptions";
import { canManageCourse } from "../utils/course-permissions";
import { courseService } from "./course.service";
import { CreateModuleInput, UpdateModuleInput, ReorderModulesInput } from "../validators/module.validator";

export class ModuleService {
  async create(courseId: string, input: CreateModuleInput, userId: string, userRole: string): Promise<CourseModule> {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    const module = await prisma.courseModule.create({
      data: {
        courseId,
        title: input.title,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
      },
      include: { lessons: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
    });

    ServiceContainer.logger.info(`Module created: ${module.id} in course ${courseId}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "MODULE_CREATED",
        resource: "CourseModule",
        resourceId: module.id,
        details: { courseId, title: module.title },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return module;
  }

  async update(id: string, input: UpdateModuleInput, userId: string, userRole: string): Promise<CourseModule> {
    const existing = await this.findById(id);
    const course = await courseService.findById(existing.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    return prisma.courseModule.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
      include: { lessons: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
    });
  }

  async reorder(courseId: string, input: ReorderModulesInput, userId: string, userRole: string): Promise<void> {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    await prisma.$transaction(
      input.items.map((item) =>
        prisma.courseModule.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.findById(id);
    const course = await courseService.findById(existing.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    await prisma.courseModule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    ServiceContainer.logger.info(`Module soft-deleted: ${id}`);
  }

  async findById(id: string): Promise<CourseModule> {
    const module = await prisma.courseModule.findFirst({
      where: { id, deletedAt: null },
      include: { lessons: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
    });
    if (!module) throw new ModuleNotFoundException(`Module [${id}] not found`);
    return module;
  }

  async findByCourse(courseId: string) {
    return prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: { resources: true },
        },
      },
    });
  }
}

export const moduleService = new ModuleService();
