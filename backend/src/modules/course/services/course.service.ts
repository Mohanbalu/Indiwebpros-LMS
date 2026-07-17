import { Course, CourseStatus, Prisma } from "@/generated/client";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { resolveUniqueSlug, slugify, generateUniqueSlug } from "@/utils/slug.util";
import { CourseNotFoundException, CoursePermissionException } from "../errors/course-exceptions";
import { canManageCourse } from "../utils/course-permissions";
import { CreateCourseInput, UpdateCourseInput, CourseFilterInput } from "../validators/course.validator";

const COURSE_INCLUDE = {
  category: true,
  instructor: { select: { id: true, firstName: true, lastName: true, email: true, avatarFile: true } },
  thumbnail: true,
  previewVideo: true,
  tags: { include: { tag: true } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
  requirements: { orderBy: { sortOrder: "asc" as const } },
  outcomes: { orderBy: { sortOrder: "asc" as const } },
};

export class CourseService {
  async create(input: CreateCourseInput, userId: string, userRole: string): Promise<Course> {
    const instructorId = (userRole === "Admin" && input.instructorId) ? input.instructorId : userId;

    const slug = await resolveUniqueSlug(input.title, async (s) => {
      const exists = await prisma.course.findFirst({ where: { slug: s, deletedAt: null } });
      return !!exists;
    });

    const course = await prisma.course.create({
      data: {
        title: input.title,
        slug,
        shortDescription: input.shortDescription,
        description: input.description,
        categoryId: input.categoryId,
        instructorId,
        createdById: userId,
        thumbnailId: input.thumbnailId ?? null,
        previewVideoId: input.previewVideoId ?? null,
        difficulty: input.difficulty,
        language: input.language,
        visibility: input.visibility,
        price: input.price,
        discountPrice: input.discountPrice ?? null,
        durationMinutes: input.durationMinutes,
        certificateEnabled: input.certificateEnabled,
        featured: input.featured,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoKeywords: input.seoKeywords,
        ...(input.tags && input.tags.length > 0 && {
          tags: {
            create: await this._resolveTagCreates(input.tags),
          },
        }),
      },
      include: COURSE_INCLUDE,
    });

    ServiceContainer.logger.info(`Course created: ${course.id}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "COURSE_CREATED",
        resource: "Course",
        resourceId: course.id,
        details: { title: course.title, instructorId },
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return this.signCourseMediaUrls(course);
  }

  async update(id: string, input: UpdateCourseInput, userId: string, userRole: string): Promise<Course> {
    const existing = await this.findById(id);
    if (!canManageCourse(userId, userRole, existing.instructorId)) {
      throw new CoursePermissionException();
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
        ...(input.description && { description: input.description }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(userRole === "Admin" && input.instructorId && { instructorId: input.instructorId }),
        ...(input.thumbnailId !== undefined && { thumbnailId: input.thumbnailId }),
        ...(input.previewVideoId !== undefined && { previewVideoId: input.previewVideoId }),
        ...(input.difficulty && { difficulty: input.difficulty }),
        ...(input.language && { language: input.language }),
        ...(input.visibility && { visibility: input.visibility }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.discountPrice !== undefined && { discountPrice: input.discountPrice }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.certificateEnabled !== undefined && { certificateEnabled: input.certificateEnabled }),
        ...(input.featured !== undefined && userRole === "Admin" && { featured: input.featured }),
        ...(input.seoTitle !== undefined && { seoTitle: input.seoTitle }),
        ...(input.seoDescription !== undefined && { seoDescription: input.seoDescription }),
        ...(input.seoKeywords !== undefined && { seoKeywords: input.seoKeywords }),
        updatedById: userId,
      },
      include: COURSE_INCLUDE,
    });

    ServiceContainer.logger.info(`Course updated: ${id}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "COURSE_UPDATED",
        resource: "Course",
        resourceId: id,
        details: {},
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return this.signCourseMediaUrls(course);
  }

  async publish(id: string, userId: string, userRole: string): Promise<Course> {
    const existing = await this.findById(id);
    if (!canManageCourse(userId, userRole, existing.instructorId)) {
      throw new CoursePermissionException();
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
        updatedById: userId,
      },
      include: COURSE_INCLUDE,
    });

    ServiceContainer.logger.info(`Course published: ${id}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "COURSE_PUBLISHED",
        resource: "Course",
        resourceId: id,
        details: {},
        status: "SUCCESS",
      });

      // Fire notification triggers if configured
      try {
        const notif = ServiceContainer.notification as unknown as {
          onCoursePurchased?: (userId: string, courseName: string, courseId: string) => Promise<void>;
        };
        // Future: dispatch CoursePublished event here
      } catch { /* non-blocking */ }
    } catch { /* non-blocking */ }

    return this.signCourseMediaUrls(course);
  }

  async archive(id: string, userId: string, userRole: string): Promise<Course> {
    const existing = await this.findById(id);
    if (!canManageCourse(userId, userRole, existing.instructorId)) {
      throw new CoursePermissionException();
    }

    const course = await prisma.course.update({
      where: { id },
      data: { status: CourseStatus.ARCHIVED, updatedById: userId },
      include: COURSE_INCLUDE,
    });

    ServiceContainer.logger.info(`Course archived: ${id}`);
    try {
      await ServiceContainer.audit.log({
        userId,
        action: "COURSE_ARCHIVED",
        resource: "Course",
        resourceId: id,
        details: {},
        status: "SUCCESS",
      });
    } catch { /* non-blocking */ }

    return this.signCourseMediaUrls(course);
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.findById(id);
    if (!canManageCourse(userId, userRole, existing.instructorId)) {
      throw new CoursePermissionException();
    }

    await prisma.course.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });

    ServiceContainer.logger.info(`Course soft-deleted: ${id}`);
  }

  async duplicate(id: string, userId: string, userRole: string): Promise<Course> {
    const source = await prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        modules: {
          where: { deletedAt: null },
          include: {
            lessons: {
              where: { deletedAt: null },
              include: {
                video: true,
                resources: {
                  include: { file: true }
                }
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        faqs: { orderBy: { sortOrder: "asc" } },
        requirements: { orderBy: { sortOrder: "asc" } },
        outcomes: { orderBy: { sortOrder: "asc" } },
        tags: { include: { tag: true } },
      },
    });

    if (!source) throw new CourseNotFoundException();
    if (!canManageCourse(userId, userRole, source.instructorId)) {
      throw new CoursePermissionException();
    }

    const newSlug = generateUniqueSlug(`${source.title} copy`);

    return prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          title: `${source.title} (Copy)`,
          slug: newSlug,
          shortDescription: source.shortDescription,
          description: source.description,
          categoryId: source.categoryId,
          instructorId: source.instructorId,
          createdById: userId,
          thumbnailId: source.thumbnailId,
          previewVideoId: source.previewVideoId,
          difficulty: source.difficulty,
          language: source.language,
          visibility: source.visibility,
          price: source.price,
          discountPrice: source.discountPrice,
          durationMinutes: source.durationMinutes,
          certificateEnabled: source.certificateEnabled,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          seoKeywords: source.seoKeywords,
          status: CourseStatus.DRAFT,
        },
      });

      // Duplicate modules → lessons → resources
      for (const mod of source.modules) {
        const newModule = await tx.courseModule.create({
          data: {
            courseId: newCourse.id,
            title: mod.title,
            description: mod.description,
            sortOrder: mod.sortOrder,
          },
        });

        for (const lesson of mod.lessons) {
          const lessonSlug = generateUniqueSlug(lesson.title);
          const newLesson = await tx.lesson.create({
            data: {
              moduleId: newModule.id,
              title: lesson.title,
              slug: lessonSlug,
              description: lesson.description,
              videoId: lesson.videoId,
              durationSeconds: lesson.durationSeconds,
              lessonType: lesson.lessonType,
              isPreview: lesson.isPreview,
              sortOrder: lesson.sortOrder,
              status: "DRAFT",
            },
          });

          for (const res of lesson.resources) {
            await tx.lessonResource.create({
              data: {
                lessonId: newLesson.id,
                title: res.title,
                fileId: res.fileId,
                resourceType: res.resourceType,
              },
            });
          }
        }
      }

      // Duplicate meta
      if (source.faqs.length > 0) {
        await tx.courseFAQ.createMany({
          data: source.faqs.map((f) => ({ courseId: newCourse.id, question: f.question, answer: f.answer, sortOrder: f.sortOrder })),
        });
      }
      if (source.requirements.length > 0) {
        await tx.courseRequirement.createMany({
          data: source.requirements.map((r) => ({ courseId: newCourse.id, text: r.text, sortOrder: r.sortOrder })),
        });
      }
      if (source.outcomes.length > 0) {
        await tx.courseOutcome.createMany({
          data: source.outcomes.map((o) => ({ courseId: newCourse.id, text: o.text, sortOrder: o.sortOrder })),
        });
      }

      ServiceContainer.logger.info(`Course duplicated: ${source.id} → ${newCourse.id}`);
      const createdCourse = await tx.course.findFirst({ where: { id: newCourse.id }, ...{ include: COURSE_INCLUDE } });
      return this.signCourseMediaUrls(createdCourse);
    });
  }

  async findAll(filters: CourseFilterInput, userId: string, userRole: string) {
    const isAdmin = userRole === "Admin";
    const isInstructor = userRole === "Instructor";

    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      // Students/Mentors only see published public courses
      ...(!isAdmin && !isInstructor && {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      }),
      // Instructors see their own courses regardless of status
      ...(isInstructor && !isAdmin && { instructorId: userId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.status && isAdmin && { status: filters.status }),
      ...(filters.visibility && { visibility: filters.visibility }),
      ...(filters.instructorId && { instructorId: filters.instructorId }),
      ...(filters.language && { language: { contains: filters.language, mode: "insensitive" } }),
      ...(filters.featured !== undefined && { featured: filters.featured }),
      ...(filters.minPrice !== undefined && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { shortDescription: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
      ...(filters.tags && {
        tags: {
          some: {
            tag: {
              slug: { in: filters.tags.split(",").map((t) => slugify(t.trim())) },
            },
          },
        },
      }),
    };

    const skip = (filters.page - 1) * filters.limit;
    const orderBy: Prisma.CourseOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    const [data, total] = await prisma.$transaction([
      prisma.course.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
        include: COURSE_INCLUDE,
      }),
      prisma.course.count({ where }),
    ]);

    const signedData = await Promise.all(data.map((c) => this.signCourseMediaUrls(c)));
    return {
      data: signedData,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: string, userId?: string, userRole?: string): Promise<Course> {
    const course = await prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...COURSE_INCLUDE,
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
              include: {
                video: true,
                resources: {
                  include: { file: true }
                }
              },
            },
          },
        },
      },
    });
    if (!course) throw new CourseNotFoundException();
    return this.signCourseMediaUrls(course);
  }

  async findBySlug(slug: string): Promise<Course> {
    const course = await prisma.course.findFirst({
      where: { slug, deletedAt: null },
      include: {
        ...COURSE_INCLUDE,
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
              include: {
                video: true,
                resources: {
                  include: { file: true }
                }
              },
            },
          },
        },
      },
    });
    if (!course) throw new CourseNotFoundException(`Course with slug "${slug}" not found`);
    return this.signCourseMediaUrls(course);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async _resolveTagCreates(tags: string[]) {
    const creates = [];
    for (const tagName of tags) {
      const slug = slugify(tagName);
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name: tagName, slug },
      });
      creates.push({ tagId: tag.id });
    }
    return creates;
  }

  public async signCourseMediaUrls(course: any): Promise<any> {
    if (!course) return course;

    // Sign thumbnail URL
    if (course.thumbnail && course.thumbnail.key) {
      try {
        course.thumbnail.url = await ServiceContainer.storage.getSignedDownloadUrl(course.thumbnail.key, 3600);
      } catch (err) {
        ServiceContainer.logger.warn(`Failed to sign thumbnail URL for key: ${course.thumbnail.key}`, { error: String(err) });
      }
    }

    // Sign previewVideo URL
    if (course.previewVideo && course.previewVideo.key) {
      try {
        course.previewVideo.url = await ServiceContainer.storage.getSignedDownloadUrl(course.previewVideo.key, 3600);
      } catch (err) {
        ServiceContainer.logger.warn(`Failed to sign previewVideo URL for key: ${course.previewVideo.key}`, { error: String(err) });
      }
    }

    // Also sign instructor avatar if available
    if (course.instructor?.avatarFile?.key) {
      try {
        course.instructor.avatarFile.url = await ServiceContainer.storage.getSignedDownloadUrl(course.instructor.avatarFile.key, 3600);
      } catch (err) {
        // ignore
      }
    }

    // Sign lesson videos and resources inside modules
    if (course.modules && course.modules.length > 0) {
      for (const mod of course.modules) {
        if (mod.lessons && mod.lessons.length > 0) {
          for (const lesson of mod.lessons) {
            // Sign lesson video
            if (lesson.video && lesson.video.key) {
              try {
                lesson.video.url = await ServiceContainer.storage.getSignedDownloadUrl(lesson.video.key, 3600);
              } catch (err) {
                // ignore
              }
            }
            // Sign lesson resources
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
          }
        }
      }
    }

    return course;
  }
}

export const courseService = new CourseService();
