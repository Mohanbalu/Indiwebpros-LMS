import { LessonResource } from "@/generated/client";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { CoursePermissionException, LessonNotFoundException } from "../errors/course-exceptions";
import { canManageCourse } from "../utils/course-permissions";
import { lessonService } from "./lesson.service";
import { moduleService } from "./module.service";
import { courseService } from "./course.service";
import { CreateResourceInput } from "../validators/resource.validator";
import { NotFoundError } from "@/errors/custom-errors";

export class LessonResourceService {
  async create(
    lessonId: string,
    input: CreateResourceInput,
    userId: string,
    userRole: string
  ): Promise<LessonResource> {
    const lesson = await lessonService.findById(lessonId);
    const mod = await moduleService.findById(lesson.moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    // Validate file exists and belongs to uploader (or admin)
    const file = await prisma.file.findFirst({ where: { id: input.fileId } });
    if (!file) throw new NotFoundError(`File [${input.fileId}] not found`);
    if (userRole !== "Admin" && file.uploadedBy !== userId) {
      throw new CoursePermissionException("You can only attach your own uploaded files");
    }

    const resource = await prisma.lessonResource.create({
      data: {
        lessonId,
        title: input.title,
        fileId: input.fileId,
        resourceType: input.resourceType,
      },
      include: { file: true },
    });

    if (resource.file && resource.file.key) {
      try {
        resource.file.url = await ServiceContainer.storage.getSignedDownloadUrl(resource.file.key, 3600);
      } catch (err) {
        // ignore
      }
    }

    return resource;
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const resource = await prisma.lessonResource.findFirst({
      where: { id },
      include: { lesson: true },
    });
    if (!resource) throw new NotFoundError(`Resource [${id}] not found`);

    const mod = await moduleService.findById(resource.lesson.moduleId);
    const course = await courseService.findById(mod.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) {
      throw new CoursePermissionException();
    }

    await prisma.lessonResource.delete({ where: { id } });
    ServiceContainer.logger.info(`Resource deleted: ${id}`);
  }

  async findByLesson(lessonId: string) {
    return prisma.lessonResource.findMany({
      where: { lessonId },
      include: { file: true },
    });
  }
}

export const lessonResourceService = new LessonResourceService();
