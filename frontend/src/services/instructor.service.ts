import { api } from "./api";

export const instructorService = {
  getDashboard: () => api.get("/dashboard/instructor"),
  getStats: () => api.get("/dashboard/instructor/stats"),
  getCourses: () => api.get("/dashboard/instructor/courses"),
  getCourseDetails: (courseId: string) => api.get(`/dashboard/instructor/course/${courseId}`),
  getStudents: () => api.get("/dashboard/instructor/students"),
  getAssignments: () => api.get("/dashboard/instructor/assignments"),
  getQuizzes: () => api.get("/dashboard/instructor/quizzes"),
  getCertificates: () => api.get("/dashboard/instructor/certificates"),
  getAnalytics: () => api.get("/dashboard/instructor/analytics"),
  
  // Course actions
  createCourse: (data: any) => api.post("/courses", data),
  updateCourse: (id: string, data: any) => api.put(`/courses/${id}`, data),
  publishCourse: (id: string) => api.patch(`/courses/${id}/publish`),
  archiveCourse: (id: string) => api.patch(`/courses/${id}/archive`),
  duplicateCourse: (id: string) => api.post(`/courses/${id}/duplicate`),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
  
  // Module actions
  getModules: (courseId: string) => api.get(`/courses/${courseId}/modules`),
  createModule: (courseId: string, data: any) => api.post(`/courses/${courseId}/modules`, data),
  reorderModules: (courseId: string, moduleIds: string[]) => api.patch(`/courses/${courseId}/modules/reorder`, { moduleIds }),
  updateModule: (moduleId: string, data: any) => api.put(`/courses/modules/${moduleId}`, data),
  deleteModule: (moduleId: string) => api.delete(`/courses/modules/${moduleId}`),
  
  // Lesson actions
  createLesson: (moduleId: string, data: any) => api.post(`/courses/modules/${moduleId}/lessons`, data),
  reorderLessons: (moduleId: string, lessonIds: string[]) => api.patch(`/courses/modules/${moduleId}/lessons/reorder`, { lessonIds }),
  updateLesson: (lessonId: string, data: any) => api.put(`/courses/lessons/${lessonId}`, data),
  publishLesson: (lessonId: string) => api.patch(`/courses/lessons/${lessonId}/publish`),
  deleteLesson: (lessonId: string) => api.delete(`/courses/lessons/${lessonId}`),
  
  // Lesson resource actions
  createResource: (lessonId: string, data: any) => api.post(`/courses/lessons/${lessonId}/resources`, data),
  deleteResource: (resourceId: string) => api.delete(`/courses/resources/${resourceId}`),
  
  // Assignment actions
  createAssignment: (data: any) => api.post("/assignments", data),
  updateAssignment: (id: string, data: any) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/assignments/${id}`),
  reviewSubmission: (submissionId: string, score: number, status: string, feedback: string) => 
    api.post(`/assignments/submissions/${submissionId}/review`, { score, status, feedback }),
  
  // Quiz actions
  createQuiz: (data: any) => api.post("/quizzes", data),
  updateQuiz: (id: string, data: any) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id: string) => api.delete(`/quizzes/${id}`),
  addQuestion: (quizId: string, data: any) => api.post(`/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId: string, data: any) => api.put(`/quizzes/questions/${questionId}`, data),
  deleteQuestion: (questionId: string) => api.delete(`/quizzes/questions/${questionId}`),
};
