import { prisma } from "@/database/client";
import {
  LessonBookmark,
  LessonNote,
  RecentlyViewedLesson,
  Prisma,
} from "@/generated/client";
import { NotFoundError, ForbiddenError, ValidationError } from "@/errors/custom-errors";
import {
  LessonNotFoundException,
  BookmarkAlreadyExistsException,
} from "../errors/player-exceptions";
import {
  CreateNoteInput,
  UpdateNoteInput,
  PlayerFilterInput,
} from "../validators/player.validator";
import { learningProgressService } from "./progress.service";
import { ServiceContainer } from "@/services/shared/service-container";

export class CoursePlayerService {
  async getCourseStructureForPlayer(courseId: string, userId: string, role: string) {
    // 1. Verify active enrollment
    await learningProgressService.validateEnrollment(userId, courseId, role);

    // 2. Fetch course details
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      include: {
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              where: {
                deletedAt: null,
                ...(role === "Student" && { status: "PUBLISHED" }),
              },
              orderBy: { sortOrder: "asc" },
              include: {
                resources: {
                  include: { file: true },
                },
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundError("Course not found");

    // 3. Fetch user progress
    const learningProgress = await prisma.learningProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const lessonProgresses = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: { module: { courseId, deletedAt: null } },
      },
    });

    const bookmarks = await prisma.lessonBookmark.findMany({
      where: {
        userId,
        lesson: { module: { courseId, deletedAt: null } },
      },
    });

    // 4. Map the response
    const progressMap = new Map(lessonProgresses.map((p) => [p.lessonId, p]));
    const bookmarkSet = new Set(bookmarks.map((b) => b.lessonId));

    const modules = course.modules.map((m) => {
      const lessons = m.lessons.map((l) => {
        const prog = progressMap.get(l.id);
        const bookmarked = bookmarkSet.has(l.id);

        return {
          id: l.id,
          title: l.title,
          slug: l.slug,
          lessonType: l.lessonType,
          isPreview: l.isPreview,
          sortOrder: l.sortOrder,
          durationSeconds: l.durationSeconds,
          progress: prog
            ? {
                status: prog.status,
                completed: prog.completed,
                watchPercentage: prog.watchPercentage,
                lastPositionSeconds: prog.lastPositionSeconds,
                lastPageRead: prog.lastPageRead,
              }
            : { status: "NOT_STARTED", completed: false, watchPercentage: 0, lastPositionSeconds: 0, lastPageRead: 0 },
          bookmarked,
        };
      });

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        sortOrder: m.sortOrder,
        lessons,
      };
    });

    return {
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      progress: learningProgress
        ? {
            progressPercentage: learningProgress.progressPercentage,
            completedLessons: learningProgress.completedLessons,
            totalLessons: learningProgress.totalLessons,
            lastLessonId: learningProgress.lastLessonId,
            completedAt: learningProgress.completedAt,
          }
        : { progressPercentage: 0, completedLessons: 0, totalLessons: 0, lastLessonId: null, completedAt: null },
      modules,
    };
  }

  async getLessonDetailsForPlayer(lessonId: string, userId: string, role: string) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        module: true,
        video: true,
        resources: {
          include: { file: true },
        },
      },
    });

    if (!lesson) throw new LessonNotFoundException();

    const courseId = lesson.module.courseId;
    await learningProgressService.validateEnrollment(userId, courseId, role);

    // Dynamic S3 signed URL logic for video
    let videoUrl: string | null = null;
    if (lesson.video) {
      try {
        videoUrl = await ServiceContainer.storage.getSignedDownloadUrl(lesson.video.key);
      } catch (err) {
        ServiceContainer.logger.error(`Error generating signed download URL for lesson video: ${err}`);
      }
    }

    // Dynamic S3 signed URL logic for downloadable resources
    const resources = await Promise.all(
      lesson.resources.map(async (r) => {
        let downloadUrl: string | null = null;
        if (r.allowDownload && r.file) {
          try {
            downloadUrl = await ServiceContainer.storage.getSignedDownloadUrl(r.file.key);
          } catch (err) {
            ServiceContainer.logger.error(`Error generating signed download URL for resource: ${err}`);
          }
        }

        return {
          id: r.id,
          title: r.title,
          resourceType: r.resourceType,
          allowDownload: r.allowDownload,
          downloadUrl,
          fileName: r.file?.originalName || r.title,
          fileSize: r.file?.size || 0,
        };
      })
    );

    // Fetch user lesson progress, bookmarks, notes
    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const bookmark = await prisma.lessonBookmark.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const notes = await prisma.lessonNote.findMany({
      where: { userId, lessonId },
      orderBy: { videoTimestamp: "asc" },
    });

    // Update Recently Viewed Lesson
    await prisma.recentlyViewedLesson.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, courseId, lastViewedAt: new Date() },
      update: { lastViewedAt: new Date() },
    });

    // Log audit for download request if requested later, but register lesson start
    if (!progress) {
      try {
        await ServiceContainer.audit.log({
          userId,
          action: "LESSON_STARTED",
          resource: "Lesson",
          resourceId: lessonId,
          details: { lessonType: lesson.lessonType },
          status: "SUCCESS",
        });
      } catch {}
    }

    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      courseId,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      lessonType: lesson.lessonType,
      durationSeconds: lesson.durationSeconds,
      videoUrl,
      resources,
      progress: progress
        ? {
            status: progress.status,
            watchPercentage: progress.watchPercentage,
            lastPositionSeconds: progress.lastPositionSeconds,
            lastPageRead: progress.lastPageRead,
            completed: progress.completed,
          }
        : { status: "NOT_STARTED", watchPercentage: 0, lastPositionSeconds: 0, lastPageRead: 0, completed: false },
      isBookmarked: bookmark !== null,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        videoTimestamp: n.videoTimestamp,
        createdAt: n.createdAt,
      })),
    };
  }

  // ── Bookmarks CRUD ───────────────────────────────────────────────────────
  async addBookmark(userId: string, lessonId: string): Promise<LessonBookmark> {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: true },
    });
    if (!lesson) throw new LessonNotFoundException();

    await learningProgressService.validateEnrollment(userId, lesson.module.courseId, "Student");

    const existing = await prisma.lessonBookmark.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing) throw new BookmarkAlreadyExistsException();

    const bookmark = await prisma.lessonBookmark.create({
      data: { userId, lessonId },
    });

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "BOOKMARK_CREATED",
        resource: "LessonBookmark",
        resourceId: bookmark.id,
        details: { lessonId },
        status: "SUCCESS",
      });
    } catch {}

    return bookmark;
  }

  async removeBookmark(bookmarkIdOrLessonId: string, userId: string): Promise<void> {
    const bookmark = await prisma.lessonBookmark.findFirst({
      where: {
        userId,
        OR: [
          { id: bookmarkIdOrLessonId },
          { lessonId: bookmarkIdOrLessonId },
        ],
      },
    });

    if (!bookmark) throw new NotFoundError("Bookmark not found");

    await prisma.lessonBookmark.delete({
      where: { id: bookmark.id },
    });
  }

  async listBookmarks(userId: string) {
    return prisma.lessonBookmark.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            module: { include: { course: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Notes CRUD ───────────────────────────────────────────────────────────
  async createNote(userId: string, input: CreateNoteInput): Promise<LessonNote> {
    const lesson = await prisma.lesson.findFirst({
      where: { id: input.lessonId, deletedAt: null },
      include: { module: true },
    });
    if (!lesson) throw new LessonNotFoundException();

    await learningProgressService.validateEnrollment(userId, lesson.module.courseId, "Student");

    const note = await prisma.lessonNote.create({
      data: {
        userId,
        lessonId: input.lessonId,
        title: input.title ?? null,
        content: input.content,
        videoTimestamp: input.videoTimestamp ?? 0,
      },
    });

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "NOTE_CREATED",
        resource: "LessonNote",
        resourceId: note.id,
        details: { lessonId: input.lessonId, videoTimestamp: note.videoTimestamp },
        status: "SUCCESS",
      });
    } catch {}

    return note;
  }

  async updateNote(noteId: string, userId: string, input: UpdateNoteInput): Promise<LessonNote> {
    const note = await prisma.lessonNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundError("Note not found");

    if (note.userId !== userId) {
      throw new ForbiddenError("You cannot modify another user's notes");
    }

    return prisma.lessonNote.update({
      where: { id: noteId },
      data: {
        title: input.title !== undefined ? input.title : note.title,
        content: input.content !== undefined ? input.content : note.content,
        videoTimestamp: input.videoTimestamp !== undefined ? input.videoTimestamp : note.videoTimestamp,
      },
    });
  }

  async deleteNote(noteId: string, userId: string): Promise<void> {
    const note = await prisma.lessonNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundError("Note not found");

    if (note.userId !== userId) {
      throw new ForbiddenError("You cannot delete another user's notes");
    }

    await prisma.lessonNote.delete({ where: { id: noteId } });
  }

  async listNotes(userId: string, filters: PlayerFilterInput) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonNoteWhereInput = {
      userId,
      ...(filters.lessonId && { lessonId: filters.lessonId }),
      ...(filters.courseId && { lesson: { module: { courseId: filters.courseId } } }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.lessonNote.findMany({
        where,
        skip,
        take: limit,
        include: { lesson: { select: { id: true, title: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lessonNote.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Resume Learning ──────────────────────────────────────────────────────
  async getResumeLearning(userId: string) {
    const recentlyViewed = await prisma.recentlyViewedLesson.findMany({
      where: { userId },
      orderBy: { lastViewedAt: "desc" },
      take: 5,
      include: {
        course: true,
        lesson: {
          include: {
            module: true,
          },
        },
      },
    });

    const courseIds = recentlyViewed.map((rv) => rv.courseId);
    const learningProgresses = await prisma.learningProgress.findMany({
      where: { userId, courseId: { in: courseIds } },
    });
    const progressMap = new Map(learningProgresses.map((p) => [p.courseId, p]));

    const lessonIds = recentlyViewed.map((rv) => rv.lessonId);
    const lessonProgresses = await prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    const lessonProgressMap = new Map(lessonProgresses.map((lp) => [lp.lessonId, lp]));

    return recentlyViewed.map((rv) => {
      const courseProgress = progressMap.get(rv.courseId);
      const lessonProgress = lessonProgressMap.get(rv.lessonId);

      return {
        courseId: rv.courseId,
        courseTitle: rv.course.title,
        courseSlug: rv.course.slug,
        progressPercentage: courseProgress?.progressPercentage ?? 0.0,
        lastLesson: {
          id: rv.lessonId,
          title: rv.lesson.title,
          lessonType: rv.lesson.lessonType,
          lastPositionSeconds: lessonProgress?.lastPositionSeconds ?? 0,
          lastPageRead: lessonProgress?.lastPageRead ?? 0,
        },
        lastAccessedAt: rv.lastViewedAt,
      };
    });
  }

  async trackDownloadRequest(userId: string, resourceId: string): Promise<void> {
    const resource = await prisma.lessonResource.findUnique({
      where: { id: resourceId },
      include: { lesson: { include: { module: true } } },
    });

    if (!resource) throw new NotFoundError("Resource not found");
    await learningProgressService.validateEnrollment(userId, resource.lesson.module.courseId, "Student");

    if (!resource.allowDownload) {
      throw new ForbiddenError("Downloads are disabled for this resource");
    }

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "DOWNLOAD_REQUESTED",
        resource: "LessonResource",
        resourceId,
        details: { fileName: resource.title },
        status: "SUCCESS",
      });
    } catch {}
  }
}

export const coursePlayerService = new CoursePlayerService();
