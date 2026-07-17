import { Lesson, LessonStatus } from "@/generated/client";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { LessonNotFoundException, CoursePermissionException, ModuleNotFoundException, CourseNotFoundException } from "../errors/course-exceptions";
import { canManageCourse } from "../utils/course-permissions";
import { moduleService } from "./module.service";
import { courseService } from "./course.service";
import { resolveUniqueSlug } from "@/utils/slug.util";
import { CreateLessonInput, UpdateLessonInput, ReorderLessonsInput } from "../validators/lesson.validator";

export async function signLessonMediaUrls(lesson: any): Promise<any> {
  if (!lesson) return lesson;

  // Sign video URL
  if (lesson.video && lesson.video.key) {
    try {
      lesson.video.url = await ServiceContainer.storage.getSignedDownloadUrl(lesson.video.key, 3600);
    } catch (err) {
      // ignore
    }
  }

  // Sign resources URLs
  if (lesson.resources && lesson.resources.length > 0) {
    for (const res of lesson.resources) {
      if (res.file && res.file.key) {
        try {
          res.file.url = await ServiceContainer.storage.getSignedDownloadUrl(res.file.key, 3600);
        } catch (err) {
          // ignore
        }
      }
    }
  }

  return lesson;
}

export class LessonService {
  private async checkPermission(moduleId: string, userId: string, userRole: string): Promise<void> {
    const mod = await prisma.courseModule.findFirst({
      where: { id: moduleId, deletedAt: null },
      select: { courseId: true }
    });
    if (!mod) throw new ModuleNotFoundException(`Module [${moduleId}] not found`);

    const course = await prisma.course.findFirst({
      where: { id: mod.courseId, deletedAt: null },
      select: { instructorId: true }
    });
    if (!course) throw new CourseNotFoundException();

    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }
  }

  async create(moduleId: string, input: CreateLessonInput, userId: string, userRole: string): Promise<Lesson> {
    await this.checkPermission(moduleId, userId, userRole);

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
      include: {
        video: true,
        resources: {
          include: { file: true }
        }
      },
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

    return signLessonMediaUrls(lesson);
  }

  async update(id: string, input: UpdateLessonInput, userId: string, userRole: string): Promise<Lesson> {
    console.log("LessonService.update received payload:", { id, input });
    const existing = await prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      select: { moduleId: true }
    });
    if (!existing) throw new LessonNotFoundException(`Lesson [${id}] not found`);
    await this.checkPermission(existing.moduleId, userId, userRole);

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.videoId !== undefined && { videoId: input.videoId }),
        ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
        ...(input.lessonType && { lessonType: input.lessonType }),
        ...(input.isPreview !== undefined && { isPreview: input.isPreview }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.status && { status: input.status }),
      },
      include: {
        video: true,
        resources: {
          include: { file: true }
        }
      },
    });
    return signLessonMediaUrls(lesson);
  }

  async publish(id: string, userId: string, userRole: string): Promise<Lesson> {
    const existing = await prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      select: { moduleId: true }
    });
    if (!existing) throw new LessonNotFoundException(`Lesson [${id}] not found`);
    await this.checkPermission(existing.moduleId, userId, userRole);

    const lesson = await prisma.lesson.update({
      where: { id },
      data: { status: LessonStatus.PUBLISHED },
      include: {
        video: true,
        resources: {
          include: { file: true }
        }
      },
    });
    return signLessonMediaUrls(lesson);
  }

  async reorder(moduleId: string, input: ReorderLessonsInput, userId: string, userRole: string): Promise<void> {
    await this.checkPermission(moduleId, userId, userRole);

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
    const existing = await prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      select: { moduleId: true }
    });
    if (!existing) throw new LessonNotFoundException(`Lesson [${id}] not found`);
    await this.checkPermission(existing.moduleId, userId, userRole);

    await prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    ServiceContainer.logger.info(`Lesson soft-deleted: ${id}`);
  }

  async findById(id: string): Promise<Lesson> {
    const lesson = await prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      include: {
        video: true,
        resources: {
          include: { file: true }
        }
      },
    });
    if (!lesson) throw new LessonNotFoundException(`Lesson [${id}] not found`);
    return signLessonMediaUrls(lesson);
  }
}

export const lessonService = new LessonService();
