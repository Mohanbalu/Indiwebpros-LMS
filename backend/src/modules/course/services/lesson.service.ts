import { Lesson, LessonStatus } from "@/generated/client";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { LessonNotFoundException, CoursePermissionException } from "../errors/course-exceptions";
import { canManageCourse } from "../utils/course-permissions";
import { moduleService } from "./module.service";
import { courseService } from "./course.service";
import { resolveUniqueSlug } from "@/utils/slug.util";
import { CreateLessonInput, UpdateLessonInput, ReorderLessonsInput } from "../validators/lesson.validator";

export class LessonService {
  async create(moduleId: string, input: CreateLessonInput, userId: string, userRole: string): Promise<Lesson> {
    const mod = await moduleService.findById(moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    const slug = await resolveUniqueSlug(input.title, async (s) => {
      const exists = await prisma.lesson.findFirst({ where: { slug: s, deletedAt: null } });
      return !!exists;
    });

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: input.title,
        slug,
        description: input.description,
        videoId: input.videoId ?? null,
        durationSeconds: input.durationSeconds,
        lessonType: input.lessonType,
        isPreview: input.isPreview,
        sortOrder: input.sortOrder,
        status: LessonStatus.DRAFT,
      },
      include: { resources: true },
    });

    ServiceContainer.logger.info(`Lesson created: ${lesson.id} in module ${moduleId}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "LESSON_CREATED",
        resource: "Lesson",
        resourceId: lesson.id,
        details: { moduleId, title: lesson.title },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return lesson;
  }

  async update(id: string, input: UpdateLessonInput, userId: string, userRole: string): Promise<Lesson> {
    const existing = await this.findById(id);
    const mod = await moduleService.findById(existing.moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    return prisma.lesson.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.videoId !== undefined && { videoId: input.videoId }),
        ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
        ...(input.lessonType && { lessonType: input.lessonType }),
        ...(input.isPreview !== undefined && { isPreview: input.isPreview }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
      include: { resources: true },
    });
  }

  async publish(id: string, userId: string, userRole: string): Promise<Lesson> {
    const existing = await this.findById(id);
    const mod = await moduleService.findById(existing.moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    return prisma.lesson.update({
      where: { id },
      data: { status: LessonStatus.PUBLISHED },
      include: { resources: true },
    });
  }

  async reorder(moduleId: string, input: ReorderLessonsInput, userId: string, userRole: string): Promise<void> {
    const mod = await moduleService.findById(moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    await prisma.$transaction(
      input.items.map((item) =>
        prisma.lesson.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.findById(id);
    const mod = await moduleService.findById(existing.moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    await prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    ServiceContainer.logger.info(`Lesson soft-deleted: ${id}`);
  }

  async findById(id: string): Promise<Lesson> {
    const lesson = await prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      include: { resources: true },
    });
    if (!lesson) throw new LessonNotFoundException(`Lesson [${id}] not found`);
    return lesson;
  }
}

export const lessonService = new LessonService();
