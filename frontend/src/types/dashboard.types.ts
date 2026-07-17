export interface DashboardWelcome {
  studentName: string;
  avatarUrl?: string | null;
  learningStreak: number;
  totalLearningHours: number;
  memberSince: string;
}

export interface DashboardContinueLearning {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
  videoPosition: number;
  progressPercentage: number;
}

export interface DashboardCourse {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnailUrl?: string | null;
  instructorName: string;
  status: string;
  expiresAt?: string | null;
  completionPercentage: number;
  totalLessons: number;
  categoryName?: string;
}

export interface DashboardStatistics {
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  hoursLearned: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  assignmentsSubmitted: number;
}

export interface DashboardCertificate {
  id: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  status: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardNotifications {
  unreadCount: number;
  items: DashboardNotification[];
}

export interface DashboardBookmark {
  id: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
}

export interface DashboardNote {
  id: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  content: string;
  videoTimestamp: number;
  createdAt: string;
}

export interface QuizAttemptItem {
  id: string;
  quizTitle: string;
  score: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface DashboardQuizzes {
  passed: number;
  failed: number;
  averageScore: number;
  bestScore: number;
  attempts: QuizAttemptItem[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentTitle: string;
  status: string;
  submittedAt: string;
  marks?: number | null;
  feedback?: string | null;
}

export interface DashboardAssignments {
  pending: number;
  submissions: AssignmentSubmission[];
}

export interface DashboardSecurity {
  lastLogin: string;
  activeSessions: ActiveSession[];
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  lastActiveAt: string;
}

export interface DashboardData {
  welcome: DashboardWelcome | null;
  continueLearning: DashboardContinueLearning | null;
  myCourses: DashboardCourse[];
  statistics: DashboardStatistics | null;
  certificates: DashboardCertificate[];
  notifications: DashboardNotifications | null;
  bookmarks: DashboardBookmark[];
  notes: DashboardNote[];
  quizzes: DashboardQuizzes | null;
  assignments: DashboardAssignments | null;
  security: DashboardSecurity | null;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}
