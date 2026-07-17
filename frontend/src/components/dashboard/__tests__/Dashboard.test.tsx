import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import type { DashboardData } from "@/types/dashboard.types";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "Student",
      status: "ACTIVE",
      createdAt: "2026-01-15T00:00:00.000Z",
    },
  }),
}));

vi.mock("@/hooks/useDashboard", () => ({
  useDashboard: vi.fn(),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
  useMarkAsRead: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkAllAsRead: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { useDashboard } = await import("@/hooks/useDashboard");
const { useNotifications } = await import("@/hooks/useNotifications");

const mockDashboardData: DashboardData = {
  welcome: {
    studentName: "John Doe",
    avatarUrl: null,
    learningStreak: 5,
    totalLearningHours: 12.5,
    memberSince: "2026-01-15T00:00:00.000Z",
  },
  continueLearning: {
    courseId: "course-1",
    courseTitle: "React Fundamentals",
    courseSlug: "react-fundamentals",
    lessonId: "lesson-1",
    lessonTitle: "Introduction to React",
    videoPosition: 120,
    progressPercentage: 45,
  },
  myCourses: [
    {
      id: "enr-1",
      courseId: "course-1",
      title: "React Fundamentals",
      slug: "react-fundamentals",
      thumbnailUrl: null,
      instructorName: "Jane Smith",
      status: "ACTIVE",
      completionPercentage: 45,
      totalLessons: 12,
      categoryName: "Frontend",
    },
  ],
  statistics: {
    coursesEnrolled: 3,
    coursesCompleted: 1,
    certificatesEarned: 1,
    hoursLearned: 12.5,
    lessonsCompleted: 15,
    quizzesPassed: 2,
    assignmentsSubmitted: 3,
  },
  certificates: [
    {
      id: "cert-1",
      courseTitle: "React Basics",
      certificateNumber: "CERT-001",
      issuedAt: "2026-06-01T00:00:00.000Z",
      status: "GENERATED",
    },
  ],
  notifications: {
    unreadCount: 2,
    items: [
      {
        id: "notif-1",
        title: "New Lesson Available",
        message: "A new lesson has been added to your course.",
        type: "COURSE",
        isRead: false,
        createdAt: "2026-07-15T10:00:00.000Z",
      },
    ],
  },
  bookmarks: [
    {
      id: "bm-1",
      lessonId: "lesson-1",
      lessonTitle: "Introduction to React",
      courseTitle: "React Fundamentals",
    },
  ],
  notes: [
    {
      id: "note-1",
      lessonId: "lesson-1",
      lessonTitle: "Introduction to React",
      title: "Key Concepts",
      content: "React is a library for building UIs",
      videoTimestamp: 0,
      createdAt: "2026-07-14T00:00:00.000Z",
    },
  ],
  quizzes: {
    passed: 2,
    failed: 1,
    averageScore: 72.5,
    bestScore: 95,
    attempts: [
      {
        id: "attempt-1",
        quizTitle: "React Basics Quiz",
        score: 8,
        percentage: 80,
        passed: true,
        submittedAt: "2026-07-14T00:00:00.000Z",
      },
    ],
  },
  assignments: {
    pending: 1,
    submissions: [],
  },
  security: {
    lastLogin: "2026-07-16T00:00:00.000Z",
    activeSessions: [],
  },
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton while loading", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Loading dashboard...")).toBeDefined();
  });

  it("shows error state when dashboard fails to load", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("Failed to load dashboard")).toBeDefined();
    expect(screen.getByText("Retry")).toBeDefined();
  });

  it("renders student name in hero section", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getAllByText(/John Doe/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders resume learning section with course title", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("Continue Learning")).toBeDefined();
    expect(screen.getAllByText("React Fundamentals").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Resume Learning")).toBeDefined();
  });

  it("renders my learning section with course details", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText(/My Learning/)).toBeDefined();
    expect(screen.getByText("Jane Smith")).toBeDefined();
    expect(screen.getByText("Frontend")).toBeDefined();
  });

  it("renders learning analytics section", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("Learning Analytics")).toBeDefined();
    expect(screen.getByText("Courses Enrolled")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
  });

  it("renders recent activity section", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("Recent Activity")).toBeDefined();
    expect(screen.getByText("Quiz Passed")).toBeDefined();
  });

  it("renders notifications section", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: {
        success: true,
        data: {
          unreadCount: 2,
          items: [
            {
              id: "notif-1",
              title: "New Lesson Available",
              message: "A new lesson has been added to your course.",
              type: "COURSE",
              isRead: false,
              createdAt: "2026-07-15T10:00:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("Notifications")).toBeDefined();
    expect(screen.getByText("New Lesson Available")).toBeDefined();
  });

  it("renders achievements section", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("Achievements")).toBeDefined();
    expect(screen.getAllByText("Certificates").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Completed")).toBeDefined();
  });

  it("renders empty states when no courses or notifications", () => {
    const emptyData: DashboardData = {
      ...mockDashboardData,
      myCourses: [],
      continueLearning: null,
      certificates: [],
      notifications: { unreadCount: 0, items: [] },
      bookmarks: [],
      notes: [],
      quizzes: null,
      statistics: {
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        hoursLearned: 0,
        lessonsCompleted: 0,
        quizzesPassed: 0,
        assignmentsSubmitted: 0,
      },
    };

    vi.mocked(useDashboard).mockReturnValue({
      data: emptyData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    vi.mocked(useNotifications).mockReturnValue({
      data: {
        success: true,
        data: { unreadCount: 0, items: [] },
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useNotifications>);

    renderDashboard();
    expect(screen.getByText("No course in progress")).toBeDefined();
    expect(screen.getByText("No activity yet")).toBeDefined();
  });
});
