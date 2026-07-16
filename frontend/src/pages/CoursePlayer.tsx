import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Play,
  CheckCircle2,
  Award,
  LogOut,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  FileText,
  Clock,
  Menu,
  X,
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/config/routes.config";

// Services, Hooks & Components
import {
  useCourseStructure,
  useLessonDetails,
  useUpdateVideoProgress,
  useUpdatePdfProgress,
  useUpdateArticleProgress,
  useAddBookmark,
  useRemoveBookmark,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTrackDownload,
  useResumeLearning
} from "@/hooks/usePlayer";
import { CourseSidebar } from "@/components/player/CourseSidebar";
import { VideoPlayerPanel } from "@/components/player/VideoPlayerPanel";
import { PdfPlayerPanel } from "@/components/player/PdfPlayerPanel";
import { ReadingPanel } from "@/components/player/ReadingPanel";
import { NotesPanel } from "@/components/player/NotesPanel";
import { BookmarkPanel } from "@/components/player/BookmarkPanel";
import { ResourceList } from "@/components/player/ResourceList";
import { CompletionDialog } from "@/components/player/CompletionDialog";
import { PlayerLesson } from "@/services/player.service";

export default function CoursePlayer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();
  const queryClientRef = useRef(false);

  // Read courseId from query params
  const courseId = searchParams.get("courseId") || "";

  // Resume learning query to fetch course list fallback if courseId is missing
  const { data: resumeList } = useResumeLearning();

  // Redirect to most recently viewed course if no courseId is provided
  useEffect(() => {
    if (!courseId && resumeList && resumeList.length > 0) {
      setSearchParams({ courseId: resumeList[0].courseId });
    }
  }, [courseId, resumeList, setSearchParams]);

  // Main Queries
  const {
    data: structure,
    isLoading: isStructureLoading,
    error: structureError
  } = useCourseStructure(courseId);

  // States
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes" | "bookmarks" | "quiz">("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [completionCelebrated, setCompletionCelebrated] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  // E2E Simulation States for Quiz
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<string>("");
  const [certificateGenerating, setCertificateGenerating] = useState<boolean>(false);
  const [certificateLink, setCertificateLink] = useState<string>("");

  // Auto-resume logic: pick lastAccessedLessonId or first unlocked lesson
  useEffect(() => {
    if (structure && !activeLessonId) {
      const lastLessonId = structure.progress?.lastLessonId;
      const flatLessons = structure.modules.flatMap((m) => m.lessons);

      if (lastLessonId && flatLessons.some((l) => l.id === lastLessonId)) {
        setActiveLessonId(lastLessonId);
      } else if (flatLessons.length > 0) {
        setActiveLessonId(flatLessons[0].id);
      }
    }
  }, [structure, activeLessonId]);

  // Lesson details query
  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError
  } = useLessonDetails(activeLessonId || "", !!activeLessonId);

  // Progress mutations
  const updateVideoProgress = useUpdateVideoProgress();
  const updatePdfProgress = useUpdatePdfProgress();
  const updateArticleProgress = useUpdateArticleProgress();

  // Note & Bookmark mutations
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const trackDownload = useTrackDownload();

  // Compute Unlocked Lessons list (Sequential locking helper)
  const unlockedLessonIds = new Set<string>();
  const flatLessons: PlayerLesson[] = [];
  if (structure) {
    structure.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        flatLessons.push(l);
      });
    });
  }

  // Populate unlockedSet sequentially
  let allPreviousCompleted = true;
  flatLessons.forEach((l, idx) => {
    if (idx === 0 || allPreviousCompleted) {
      unlockedLessonIds.add(l.id);
    }
    if (!l.progress?.completed) {
      allPreviousCompleted = false;
    }
  });

  // Watch for 100% course progress completion to launch celebration dialog
  const progressPercentage = structure?.progress?.progressPercentage || 0;
  const isCourseComplete = progressPercentage === 100;

  useEffect(() => {
    if (isCourseComplete && !completionCelebrated) {
      setCompletionCelebrated(true);
      setIsCompletionDialogOpen(true);
    }
  }, [isCourseComplete, completionCelebrated]);

  const handleSelectLesson = (selectedLesson: PlayerLesson) => {
    setActiveLessonId(selectedLesson.id);
    setCurrentTimestamp(0);
    setMobileSidebarOpen(false);
  };

  const handleVideoProgress = (position: number, duration: number) => {
    if (!activeLessonId) return;
    updateVideoProgress.mutate({
      lessonId: activeLessonId,
      positionSeconds: position,
      durationSeconds: duration
    });
  };

  const handlePdfProgress = (page: number, total: number) => {
    if (!activeLessonId) return;
    updatePdfProgress.mutate({
      lessonId: activeLessonId,
      pageNumber: page,
      totalPages: total
    });
  };

  const handleArticleProgress = () => {
    if (!activeLessonId) return;
    updateArticleProgress.mutate({
      lessonId: activeLessonId,
      completed: true
    });
  };

  const toggleBookmark = () => {
    if (!activeLessonId || !lesson) return;
    if (lesson.isBookmarked) {
      removeBookmark.mutate(activeLessonId);
    } else {
      addBookmark.mutate(activeLessonId);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.login);
    } catch {}
  };

  // Navigations helper
  const handleNextLesson = () => {
    if (!structure || !activeLessonId) return;
    const currentIdx = flatLessons.findIndex((l) => l.id === activeLessonId);
    if (currentIdx !== -1 && currentIdx < flatLessons.length - 1) {
      const nextLesson = flatLessons[currentIdx + 1];
      if (unlockedLessonIds.has(nextLesson.id)) {
        handleSelectLesson(nextLesson);
      }
    }
  };

  const handlePrevLesson = () => {
    if (!structure || !activeLessonId) return;
    const currentIdx = flatLessons.findIndex((l) => l.id === activeLessonId);
    if (currentIdx > 0) {
      handleSelectLesson(flatLessons[currentIdx - 1]);
    }
  };

  if (isStructureLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-450">Loading study pathway structure...</p>
        </div>
      </div>
    );
  }

  if (structureError || !structure) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <Info className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold">Failed to load Course Structure</h2>
          <p className="text-xs text-zinc-450">
            Verify you are enrolled in this pathway or try returning to catalog.
          </p>
          <Link to="/student">
            <Button size="sm" className="mt-2">
              My Pathways
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col h-screen overflow-hidden">
      {/* 1. Header Navigation Bar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/student"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-50 text-xs font-bold transition flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Exit Player
          </Link>
          <span className="h-4 w-px bg-zinc-800 flex-shrink-0" />
          <h1 className="text-sm font-bold truncate pr-4 text-zinc-200">
            {structure.title}
          </h1>
        </div>

        {/* Profile Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative group">
            <button className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-xs logout-profile-dropdown cursor-pointer focus:outline-none transition">
              U
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 hidden group-hover:block hover:block shadow-xl z-50 animate-fade-in">
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-xl hover:bg-zinc-805 text-xs text-rose-500 font-bold logout-btn focus:outline-none transition"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile drawer overlay */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-35 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Curriculum Sidebar */}
        <div
          className={`fixed inset-y-16 left-0 z-40 transform lg:static lg:translate-x-0 transition duration-300 flex-shrink-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <CourseSidebar
            structure={structure}
            activeLessonId={activeLessonId}
            onSelectLesson={handleSelectLesson}
            unlockedLessonIds={unlockedLessonIds}
          />
        </div>

        {/* Main lesson detail focus panel */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-zinc-950">
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6 scrollbar-thin">
            {isLessonLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-zinc-550 font-bold">Loading lesson contents...</p>
                </div>
              </div>
            ) : lessonError || !lesson ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-sm p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                  <Info className="h-8 w-8 text-zinc-500 mx-auto" />
                  <h3 className="text-xs font-bold text-zinc-300">Select a Lesson</h3>
                  <p className="text-[11px] text-zinc-500">
                    Use the curriculum sidebar to navigate and unlock lessons in order.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Lesson Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-zinc-100">{lesson.title}</h2>
                    <span className="text-[10px] text-zinc-500 font-semibold block mt-1 uppercase tracking-wider">
                      Type: {lesson.lessonType} | Duration: {Math.round(lesson.durationSeconds / 60)} mins
                    </span>
                  </div>

                  {/* Bookmark action icon */}
                  <button
                    onClick={toggleBookmark}
                    className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 transition text-zinc-400 hover:text-blue-500 focus:outline-none"
                  >
                    {lesson.isBookmarked ? (
                      <BookmarkCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Main Media Player Viewport */}
                <div className="w-full">
                  {lesson.lessonType === "VIDEO" && lesson.videoUrl && (
                    <VideoPlayerPanel
                      videoUrl={lesson.videoUrl}
                      initialPosition={lesson.progress?.lastPositionSeconds || 0}
                      onProgress={handleVideoProgress}
                      onTimeUpdate={setCurrentTimestamp}
                    />
                  )}

                  {lesson.lessonType === "PDF" && lesson.videoUrl && (
                    <PdfPlayerPanel
                      pdfUrl={lesson.videoUrl}
                      initialPage={lesson.progress?.lastPageRead || 1}
                      onProgress={handlePdfProgress}
                      completed={lesson.progress?.completed}
                    />
                  )}

                  {lesson.lessonType === "ARTICLE" && (
                    <ReadingPanel
                      title={lesson.title}
                      description={lesson.description}
                      completed={lesson.progress?.completed}
                      onComplete={handleArticleProgress}
                    />
                  )}
                </div>

                {/* Lesson Navigation Buttons */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevLesson}
                    disabled={flatLessons.findIndex((l) => l.id === activeLessonId) === 0}
                  >
                    Previous Lesson
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNextLesson}
                    disabled={
                      flatLessons.findIndex((l) => l.id === activeLessonId) === flatLessons.length - 1 ||
                      !unlockedLessonIds.has(
                        flatLessons[flatLessons.findIndex((l) => l.id === activeLessonId) + 1]?.id
                      )
                    }
                  >
                    Next Lesson
                  </Button>
                </div>

                {/* Tabs Panel */}
                <div className="border-b border-zinc-800/80 flex gap-4 mt-8 flex-wrap">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "resources", label: "Resources" },
                    { id: "notes", label: "Notes" },
                    { id: "bookmarks", label: "Bookmarks" },
                    { id: "quiz", label: "Curriculum Quiz" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 text-xs font-bold focus:outline-none transition relative ${
                        activeTab === tab.id
                          ? "text-blue-500 border-b-2 border-blue-500"
                          : "text-zinc-500 hover:text-zinc-350"
                      } ${tab.id === "quiz" ? "lesson-tab-quiz" : ""}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content wrappers */}
                <div className="py-4">
                  {activeTab === "overview" && (
                    <div className="space-y-4 max-w-3xl">
                      <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">
                        About this segment
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {lesson.description || "No description provided for this lesson segment."}
                      </p>
                    </div>
                  )}

                  {activeTab === "resources" && (
                    <ResourceList
                      resources={lesson.resources}
                      onDownload={(resId) => trackDownload.mutate(resId)}
                    />
                  )}

                  {activeTab === "notes" && (
                    <NotesPanel
                      notes={lesson.notes}
                      currentTimestamp={currentTimestamp}
                      onCreateNote={(payload) => createNote.mutate({ ...payload, lessonId: lesson.id })}
                      onUpdateNote={(id, payload) => updateNote.mutate({ id, payload })}
                      onDeleteNote={(id) => deleteNote.mutate({ id })}
                    />
                  )}

                  {activeTab === "bookmarks" && (
                    <BookmarkPanel
                      bookmarks={structure.modules.flatMap((m) =>
                        m.lessons
                          .filter((l) => l.bookmarked)
                          .map((l) => ({
                            id: l.id,
                            userId: "",
                            lessonId: l.id,
                            createdAt: new Date().toISOString(),
                            lesson: { id: l.id, title: l.title, slug: l.slug, module: { courseId } }
                          }))
                      )}
                      onRemoveBookmark={(id) => removeBookmark.mutate(id)}
                      onNavigateToLesson={(lessonId) => {
                        const matched = flatLessons.find((l) => l.id === lessonId);
                        if (matched) handleSelectLesson(matched);
                      }}
                    />
                  )}

                  {activeTab === "quiz" && (
                    <div className="max-w-xl p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                      {!quizStarted ? (
                        <div className="text-center space-y-4 py-4">
                          <BookOpen className="h-10 w-10 text-blue-500 mx-auto" />
                          <h3 className="text-sm font-bold">Ready to test your comprehension?</h3>
                          <p className="text-xs text-zinc-500">Complete the auto-graded multi-choice quiz below.</p>
                          <Button onClick={() => setQuizStarted(true)} className="start-quiz-btn">
                            Start Quiz
                          </Button>
                        </div>
                      ) : !quizSubmitted ? (
                        <div className="space-y-6">
                          <h3 className="text-sm font-bold">Question 1: Which Prisma configuration sets a unique row parameter?</h3>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 rounded-xl cursor-pointer">
                              <input type="radio" name="quiz-opt" className="text-blue-600 focus:ring-0" />
                              <span className="text-xs font-semibold">@relation</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 rounded-xl cursor-pointer">
                              <input type="radio" name="quiz-opt" className="text-blue-600 focus:ring-0" />
                              <span className="text-xs font-semibold">@unique</span>
                            </label>
                          </div>
                          <Button
                            onClick={() => {
                              setQuizSubmitted(true);
                              setQuizScore("Passed");
                            }}
                            className="submit-quiz-btn w-full"
                          >
                            Submit Answers
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-6 py-4">
                          <Award className="h-10 w-10 text-emerald-500 mx-auto animate-bounce" />
                          <h3 className="text-sm font-bold">Quiz Attempt Results</h3>
                          <div className="text-lg font-black text-emerald-500 quiz-score">{quizScore}</div>

                          {/* Certificate generation controls */}
                          {!certificateLink ? (
                            <Button
                              onClick={() => {
                                setCertificateGenerating(true);
                                setTimeout(() => {
                                  setCertificateGenerating(false);
                                  setCertificateLink("https://indiwebpros.s3.amazonaws.com/certificates/sample.pdf");
                                }, 1000);
                              }}
                              className="generate-certificate-btn"
                              disabled={certificateGenerating}
                            >
                              {certificateGenerating ? "Compiling Certificate..." : "Generate Certificate"}
                            </Button>
                          ) : (
                            <a
                              href={certificateLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl transition certificate-download-link"
                            >
                              Download PDF Certificate
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 3. Right Sidebar widgets (Overall pathway details) */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/40 p-4 md:p-6 space-y-6 flex-shrink-0 overflow-y-auto">
            {/* Progress Card */}
            <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/60 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Overall Progress
              </h3>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-white">{Math.round(progressPercentage)}%</span>
                <span className="text-[10px] font-bold text-zinc-500">
                  {structure.progress?.completedLessons} / {structure.progress?.totalLessons} Lessons
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* General pathway metrics info */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-zinc-450 tracking-widest">
                Course Details
              </h4>
              <div className="space-y-3 text-xs text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Pathway Status:</span>
                  <span className="font-bold text-zinc-200">
                    {isCourseComplete ? "Completed" : "In Progress"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certificate status:</span>
                  <span className="font-bold text-zinc-200">
                    {isCourseComplete ? "Unlocked" : "Locked (Complete lessons)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confetti celebration dialog overlay */}
      <CompletionDialog
        isOpen={isCompletionDialogOpen}
        onClose={() => setIsCompletionDialogOpen(false)}
        courseTitle={structure.title}
        hasQuiz={true}
        onStartQuiz={() => {
          setActiveTab("quiz");
          setQuizStarted(true);
        }}
      />
    </div>
  );
}
