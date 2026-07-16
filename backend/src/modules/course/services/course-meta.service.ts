import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { courseService } from "./course.service";
import { canManageCourse } from "../utils/course-permissions";
import { CoursePermissionException } from "../errors/course-exceptions";
import { NotFoundError } from "@/errors/custom-errors";
import { slugify } from "@/utils/slug.util";
import {
  CreateFAQInput, UpdateFAQInput,
  CreateRequirementInput, CreateOutcomeInput, TagInput,
} from "../validators/course-meta.validator";

export class CourseMetaService {
  // ── FAQs ─────────────────────────────────────────────────────────────────

  async createFAQ(courseId: string, input: CreateFAQInput, userId: string, userRole: string) {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    return prisma.courseFAQ.create({
      data: { courseId, question: input.question, answer: input.answer, sortOrder: input.sortOrder ?? 0 },
    });
  }

  async updateFAQ(id: string, input: UpdateFAQInput, userId: string, userRole: string) {
    const faq = await prisma.courseFAQ.findFirst({ where: { id } });
    if (!faq) throw new NotFoundError("FAQ not found");
    const course = await courseService.findById(faq.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    return prisma.courseFAQ.update({
      where: { id },
      data: {
        ...(input.question && { question: input.question }),
        ...(input.answer && { answer: input.answer }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });
  }

  async deleteFAQ(id: string, userId: string, userRole: string) {
    const faq = await prisma.courseFAQ.findFirst({ where: { id } });
    if (!faq) throw new NotFoundError("FAQ not found");
    const course = await courseService.findById(faq.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    await prisma.courseFAQ.delete({ where: { id } });
  }

  async listFAQs(courseId: string) {
    return prisma.courseFAQ.findMany({ where: { courseId }, orderBy: { sortOrder: "asc" } });
  }

  // ── Requirements ──────────────────────────────────────────────────────────

  async createRequirement(courseId: string, input: CreateRequirementInput, userId: string, userRole: string) {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    return prisma.courseRequirement.create({
      data: { courseId, text: input.text, sortOrder: input.sortOrder ?? 0 },
    });
  }

  async deleteRequirement(id: string, userId: string, userRole: string) {
    const req = await prisma.courseRequirement.findFirst({ where: { id } });
    if (!req) throw new NotFoundError("Requirement not found");
    const course = await courseService.findById(req.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    await prisma.courseRequirement.delete({ where: { id } });
  }

  async listRequirements(courseId: string) {
    return prisma.courseRequirement.findMany({ where: { courseId }, orderBy: { sortOrder: "asc" } });
  }

  // ── Outcomes ──────────────────────────────────────────────────────────────

  async createOutcome(courseId: string, input: CreateOutcomeInput, userId: string, userRole: string) {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    return prisma.courseOutcome.create({
      data: { courseId, text: input.text, sortOrder: input.sortOrder ?? 0 },
    });
  }

  async deleteOutcome(id: string, userId: string, userRole: string) {
    const out = await prisma.courseOutcome.findFirst({ where: { id } });
    if (!out) throw new NotFoundError("Outcome not found");
    const course = await courseService.findById(out.courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    await prisma.courseOutcome.delete({ where: { id } });
  }

  async listOutcomes(courseId: string) {
    return prisma.courseOutcome.findMany({ where: { courseId }, orderBy: { sortOrder: "asc" } });
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  async addTag(courseId: string, input: TagInput, userId: string, userRole: string) {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    const slug = slugify(input.name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: input.name, slug },
    });

    await prisma.courseTagMap.upsert({
      where: { courseId_tagId: { courseId, tagId: tag.id } },
      update: {},
      create: { courseId, tagId: tag.id },
    });

    return tag;
  }

  async removeTag(courseId: string, tagId: string, userId: string, userRole: string) {
    const course = await courseService.findById(courseId);
    if (!canManageCourse(userId, userRole, course.instructorId)) throw new CoursePermissionException();

    await prisma.courseTagMap.deleteMany({ where: { courseId, tagId } });
  }

  async listTags(courseId: string) {
    return prisma.courseTagMap.findMany({
      where: { courseId },
      include: { tag: true },
    });
  }
}

export const courseMetaService = new CourseMetaService();
