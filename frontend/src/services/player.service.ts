import { api } from "./api";

export interface LessonProgressData {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completed: boolean;
  watchPercentage: number;
  lastPositionSeconds: number;
  lastPageRead: number;
}

export interface PlayerLesson {
  id: string;
  title: string;
  slug: string;
  lessonType: "VIDEO" | "PDF" | "ARTICLE" | "QUIZ" | "ASSIGNMENT";
  isPreview: boolean;
  sortOrder: number;
  durationSeconds: number;
  progress: LessonProgressData;
  bookmarked: boolean;
}

export interface PlayerModule {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: PlayerLesson[];
}

export interface CourseStructure {
  courseId: string;
  title: string;
  slug: string;
  progress: {
    progressPercentage: number;
    completedLessons: number;
    totalLessons: number;
    lastLessonId: string | null;
    completedAt: string | null;
  };
  modules: PlayerModule[];
}

export interface ResourceAttachment {
  id: string;
  title: string;
  resourceType: string;
  allowDownload: boolean;
  downloadUrl: string | null;
  fileName: string;
  fileSize: number;
}

export interface NoteItem {
  id: string;
  title?: string;
  content: string;
  videoTimestamp: number;
  createdAt: string;
}

export interface LessonDetails {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  slug: string;
  description: string | null;
  lessonType: "VIDEO" | "PDF" | "ARTICLE" | "QUIZ" | "ASSIGNMENT";
  durationSeconds: number;
  videoUrl: string | null;
  resources: ResourceAttachment[];
  progress: LessonProgressData;
  isBookmarked: boolean;
  notes: NoteItem[];
}

export interface ResumeLearningItem {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  progressPercentage: number;
  lastLesson: {
    id: string;
    title: string;
    lessonType: string;
    lastPositionSeconds: number;
    lastPageRead: number;
  };
  lastAccessedAt: string;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  lessonId: string;
  createdAt: string;
  lesson: {
    id: string;
    title: string;
    slug: string;
    module: {
      courseId: string;
    };
  };
}

export const playerService = {
  getCourseStructure: async (courseId: string): Promise<CourseStructure> => {
    const res = await api.get(`/player/course/${courseId}`);
    return res.data.data;
  },

  getLessonDetails: async (lessonId: string): Promise<LessonDetails> => {
    const res = await api.get(`/player/lesson/${lessonId}`);
    return res.data.data;
  },

  trackDownload: async (resourceId: string): Promise<void> => {
    await api.post(`/player/lesson/download/${resourceId}`);
  },

  updateVideoProgress: async (payload: {
    lessonId: string;
    positionSeconds: number;
    durationSeconds: number;
  }) => {
    const res = await api.patch("/player/video-progress", payload);
    return res.data;
  },

  updatePdfProgress: async (payload: {
    lessonId: string;
    pageNumber: number;
    totalPages: number;
  }) => {
    const res = await api.patch("/player/pdf-progress", payload);
    return res.data;
  },

  updateArticleProgress: async (payload: {
    lessonId: string;
    completed: boolean;
  }) => {
    const res = await api.patch("/player/article-progress", payload);
    return res.data;
  },

  getResumeLearning: async (): Promise<ResumeLearningItem[]> => {
    const res = await api.get("/player/resume");
    return res.data.data;
  },

  listBookmarks: async (): Promise<BookmarkItem[]> => {
    const res = await api.get("/player/bookmarks");
    return res.data.data;
  },

  addBookmark: async (lessonId: string): Promise<BookmarkItem> => {
    const res = await api.post("/player/bookmarks", { lessonId });
    return res.data.data;
  },

  removeBookmark: async (idOrLessonId: string): Promise<void> => {
    await api.delete(`/player/bookmarks/${idOrLessonId}`);
  },

  listNotes: async (params?: { courseId?: string; lessonId?: string; page?: number; limit?: number }) => {
    const res = await api.get("/player/notes", { params });
    return res.data;
  },

  createNote: async (payload: {
    lessonId: string;
    title?: string;
    content: string;
    videoTimestamp?: number;
  }): Promise<NoteItem> => {
    const res = await api.post("/player/notes", payload);
    return res.data.data;
  },

  updateNote: async (
    id: string,
    payload: {
      title?: string;
      content: string;
      videoTimestamp?: number;
    }
  ): Promise<NoteItem> => {
    const res = await api.put(`/player/notes/${id}`, payload);
    return res.data.data;
  },

  deleteNote: async (id: string): Promise<void> => {
    await api.delete(`/player/notes/${id}`);
  },
};
