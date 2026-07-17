import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  LogOut,
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Menu,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/config/routes.config";
import { APP_CONFIG } from "@/config/app.config";

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
import { useDashboard } from "@/hooks/useDashboard";
import { useMyCertificates, useGenerateStudentCertificate } from "@/hooks/useCertificate";
import {
  useStartQuizAttempt,
  useResumeQuizAttempt,
  useSubmitQuizAttempt,
  useQuizAttemptResult,
  useQuizDetail,
} from "@/hooks/useQuiz";
import { CourseSidebar } from "@/components/player/CourseSidebar";
import { VideoPlayerPanel } from "@/components/player/VideoPlayerPanel";
import { PdfPlayerPanel } from "@/components/player/PdfPlayerPanel";
import { ReadingPanel } from "@/components/player/ReadingPanel";
import { NotesPanel } from "@/components/player/NotesPanel";
import { BookmarkPanel } from "@/components/player/BookmarkPanel";
import { ResourceList } from "@/components/player/ResourceList";
import { CompletionDialog } from "@/components/player/CompletionDialog";
import { PlayerLesson } from "@/services/player.service";
import { QuizIntro } from "@/components/quiz/QuizIntro";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { ResultPage } from "@/components/quiz/ResultPage";
import { ReviewMode } from "@/components/quiz/ReviewMode";
import type {
  StartAttemptResponse,
  ResumeAttemptFinished,
  LocalAnswer,
  QuizPersistence,
  QuizAttemptMeta,
  AttemptResultResponse,
} from "@/types/quiz.types";
import { QUIZ_STORAGE_KEY } from "@/types/quiz.types";

type QuizView = "intro" | "playing" | "result" | "review";

export default function CoursePlayer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();

  const courseId = searchParams.get("courseId") || "";
  const { data: resumeList } = useResumeLearning();
  const { data: dashboardData } = useDashboard();

  useEffect(() => {
    if (!courseId) {
      if (resumeList && resumeList.length > 0 && resumeList[0]) {
        setSearchParams({ courseId: resumeList[0].courseId });
      } else if (dashboardData?.myCourses && dashboardData.myCourses.length > 0 && dashboardData.myCourses[0]) {
        setSearchParams({ courseId: dashboardData.myCourses[0].courseId });
      }
    }
  }, [courseId, resumeList, dashboardData, setSearchParams]);

  const {
    data: structure,
    isLoading: isStructureLoading,
    error: structureError
  } = useCourseStructure(courseId);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError
  } = useLessonDetails(activeLessonId || "", !!activeLessonId);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes" | "bookmarks" | "quiz">("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [completionCelebrated, setCompletionCelebrated] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  const [quizView, setQuizView] = useState<QuizView>("intro");
  const [quizAttempt, setQuizAttempt] = useState<StartAttemptResponse | null>(null);
  const [quizResultId, setQuizResultId] = useState<string>("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, LocalAnswer>>({});
  const [quizMarked, setQuizMarked] = useState<string[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);

  const startQuizMut = useStartQuizAttempt();
  const submitQuizMut = useSubmitQuizAttempt();
  const { data: quizResult } = useQuizAttemptResult(quizResultId, quizView === "review");

  const startAttemptPersistedRef = useRef<QuizPersistence | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (stored) {
        const parsed: QuizPersistence = JSON.parse(stored);
        startAttemptPersistedRef.current = parsed;
      }
    } catch { /* noop */ }
  }, []);

  const activeLessonQuizId = lesson?.quizId || null;
  const isQuizLesson = lesson?.lessonType === "QUIZ";

  const { data: resumedQuizData, isLoading: quizResuming } = useResumeQuizAttempt(
    startAttemptPersistedRef.current?.attemptId || "",
    !!startAttemptPersistedRef.current?.attemptId && activeTab === "quiz" && quizView === "intro"
  );

  useEffect(() => {
    if (!resumedQuizData || quizAttempt) return;

    const finishedCheck = resumedQuizData as ResumeAttemptFinished;
    if ("finished" in finishedCheck && finishedCheck.finished) {
      setQuizResultId(finishedCheck.attempt.id);
      setQuizView("result");
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      startAttemptPersistedRef.current = null;
      return;
    }

    const attemptData = resumedQuizData as StartAttemptResponse;
    setQuizAttempt(attemptData);
    if (startAttemptPersistedRef.current) {
      setQuizAnswers(startAttemptPersistedRef.current.answers);
      setQuizMarked(startAttemptPersistedRef.current.markedForReview);
      setQuizCurrentIndex(startAttemptPersistedRef.current.currentQuestionIndex);
    }
    setQuizView("playing");
  }, [resumedQuizData, quizAttempt]);

  const quizAttemptHistory: QuizAttemptMeta[] = [];
  const quizAttemptsRemaining = 3;

  const handleStartQuiz = useCallback(async () => {
    const quizIdToUse = activeLessonQuizId;
    if (!quizIdToUse) return;
    try {
      const data = await startQuizMut.mutateAsync(quizIdToUse);
      setQuizAttempt(data);
      setQuizAnswers({});
      setQuizMarked([]);
      setQuizCurrentIndex(0);
      const persistence: QuizPersistence = {
        attemptId: data.attemptId,
        quizId: data.quizId,
        answers: {},
        currentQuestionIndex: 0,
        markedForReview: [],
        startedAt: data.startedAt,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(persistence));
      setQuizView("playing");
    } catch { /* noop */ }
  }, [activeLessonQuizId, startQuizMut]);

  const handleQuizAnswersChange = useCallback(
    (answers: Record<string, LocalAnswer>, marked: string[], currentIndex: number) => {
      setQuizAnswers(answers);
      setQuizMarked(marked);
      setQuizCurrentIndex(currentIndex);
      if (quizAttempt) {
        const persistence: QuizPersistence = {
          attemptId: quizAttempt.attemptId,
          quizId: quizAttempt.quizId,
          answers,
          currentQuestionIndex: currentIndex,
          markedForReview: marked,
          startedAt: quizAttempt.startedAt,
        };
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(persistence));
      }
    },
    [quizAttempt]
  );

  const handleQuizSubmit = useCallback(
    async (answerList: LocalAnswer[]) => {
      if (!quizAttempt) return;
      try {
        const result = await submitQuizMut.mutateAsync({
          attemptId: quizAttempt.attemptId,
          answers: answerList,
        });
        if (result.passed) {
          setQuizPassed(true);
        }
        setQuizResultId(quizAttempt.attemptId);
        localStorage.removeItem(QUIZ_STORAGE_KEY);
        setQuizView("result");
      } catch { /* noop */ }
    },
    [quizAttempt, submitQuizMut]
  );

  const handleQuizTimeUp = useCallback(async () => {
    if (!quizAttempt) return;
    try {
      await submitQuizMut.mutateAsync({
        attemptId: quizAttempt.attemptId,
        answers: [],
      });
      setQuizResultId(quizAttempt.attemptId);
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      setQuizView("result");
    } catch { /* noop */ }
  }, [quizAttempt, submitQuizMut]);

  const handleQuizRetry = useCallback(() => {
    setQuizAttempt(null);
    setQuizAnswers({});
    setQuizMarked([]);
    setQuizCurrentIndex(0);
    setQuizView("intro");
  }, []);

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


  const updateVideoProgress = useUpdateVideoProgress();
  const updatePdfProgress = useUpdatePdfProgress();
  const updateArticleProgress = useUpdateArticleProgress();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const trackDownload = useTrackDownload();

  const { data: certificatesList, refetch: refetchCertificates } = useMyCertificates();
  const generateCertificateMut = useGenerateStudentCertificate();
  const activeCourseCertificate = certificatesList?.find((c) => c.course.id === courseId);

  const handleGenerateCertificate = async () => {
    if (!courseId || generateCertificateMut.isPending) return;
    try {
      await generateCertificateMut.mutateAsync(courseId);
      refetchCertificates();
    } catch (err) {
      console.error("Failed to generate certificate:", err);
    }
  };

  const unlockedLessonIds = new Set<string>();
  const flatLessons: PlayerLesson[] = [];
  if (structure) {
    structure.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        flatLessons.push(l);
      });
    });
  }

  const hasQuizLessons = flatLessons.some((l) => l.lessonType === "QUIZ");

  let allPreviousCompleted = true;
  flatLessons.forEach((l, idx) => {
    if (idx === 0 || allPreviousCompleted) {
      unlockedLessonIds.add(l.id);
    }
    if (!l.progress?.completed) {
      allPreviousCompleted = false;
    }
  });

  const totalLessonsCount = flatLessons.length;
  const completedLessonsCount = flatLessons.filter((l) => l.progress?.completed).length;
  const progressPercentage = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0;
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
    if (!activeLessonId || !duration || isNaN(duration) || duration <= 0) return;
    updateVideoProgress.mutate({
      lessonId: activeLessonId,
      positionSeconds: position,
      durationSeconds: duration
    });
  };

  const handlePdfProgress = (page: number, total: number) => {
    if (!activeLessonId || !total || isNaN(total) || total <= 0) return;
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
    } catch { /* noop */ }
  };

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

  const renderQuizTab = () => {
    if (quizView === "playing" && quizAttempt) {
      return (
        <QuizPlayer
          questions={quizAttempt.questions}
          attemptId={quizAttempt.attemptId}
          quizId={quizAttempt.quizId}
          title={quizAttempt.title}
          startedAt={quizAttempt.startedAt}
          timeLimitMinutes={quizAttempt.timeLimitMinutes}
          initialAnswers={quizAnswers}
          initialMarked={quizMarked}
          initialIndex={quizCurrentIndex}
          onAnswersChange={handleQuizAnswersChange}
          onSubmit={handleQuizSubmit}
          onTimeUp={handleQuizTimeUp}
          isSubmitting={submitQuizMut.isPending}
        />
      );
    }

    if (quizView === "result" && quizAttempt) {
      return (
        <ResultPage
          result={{
            id: quizAttempt.attemptId,
            userId: "",
            quizId: quizAttempt.quizId,
            attemptNumber: quizAttempt.attemptNumber,
            startedAt: quizAttempt.startedAt,
            submittedAt: new Date().toISOString(),
            timeTakenSeconds: 0,
            score: 0,
            percentage: 0,
            passed: false,
            status: "SUBMITTED",
          }}
          totalQuestions={quizAttempt.questions.length}
          onReview={() => setQuizView("review")}
          onRetry={handleQuizRetry}
          canRetry={quizAttemptsRemaining > 0}
          attemptsRemaining={quizAttemptsRemaining}
        />
      );
    }

    if (quizView === "review" && quizResult && "quiz" in quizResult) {
      return (
        <ReviewMode
          result={quizResult as AttemptResultResponse}
          onBack={() => setQuizView("result")}
        />
      );
    }

    if (quizResuming) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Spinner size="md" />
            <p className="text-xs text-zinc-500 font-bold">Resuming your attempt...</p>
          </div>
        </div>
      );
    }

    if (isQuizLesson && activeLessonQuizId) {
      return (
        <QuizIntroInline
          quizId={activeLessonQuizId}
          onStart={handleStartQuiz}
          isLoading={startQuizMut.isPending}
          attemptHistory={quizAttemptHistory}
          maxAttempts={3}
          attemptsRemaining={quizAttemptsRemaining}
        />
      );
    }

    return (
      <div className="max-w-xl p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
        <div className="text-center space-y-4 py-4">
          <BookOpen className="h-10 w-10 text-blue-500 mx-auto" />
          <h3 className="text-sm font-bold">Ready to test your comprehension?</h3>
          <p className="text-xs text-zinc-500">Complete the auto-graded multi-choice quiz below.</p>
          <Button onClick={() => {}} className="start-quiz-btn" disabled>
            Start Quiz
          </Button>
          <p className="text-[10px] text-zinc-600">
            Navigate to the quiz lesson in the sidebar to begin the assessment.
          </p>
        </div>
      </div>
    );
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <BookOpen className="h-10 w-10 text-blue-500 mx-auto" />
          <h2 className="text-sm font-bold">Select a Course to Learn</h2>
          <p className="text-xs text-zinc-450">
            You don't have an active course session. Choose a course from your dashboard or browse the catalog.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/student">
              <Button size="sm" variant="primary" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/courses">
              <Button size="sm" variant="outline" className="w-full">
                Browse Course Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950 px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/student"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 text-xs font-black tracking-tight transition flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-blue-500" /> Exit Player
          </Link>
          <span className="h-4 w-px bg-zinc-800/80 flex-shrink-0" />
          <h1 className="text-xs font-extrabold tracking-wide uppercase pr-4 text-zinc-300">
            {structure.title}
          </h1>
        </div>

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

      <div className="flex-1 flex overflow-hidden relative">
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-35 lg:hidden backdrop-blur-xs"
          />
        )}

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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-zinc-100">{lesson.title}</h2>
                    <span className="text-[10px] text-zinc-500 font-semibold block mt-1 uppercase tracking-wider">
                      Type: {lesson.lessonType} | Duration: {Math.round(lesson.durationSeconds / 60)} mins
                    </span>
                  </div>

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

                <div className="w-full rounded-2xl overflow-hidden border border-zinc-800/85 bg-zinc-950 shadow-[0_15px_35px_rgba(0,0,0,0.4)]">
                  {lesson.lessonType === "VIDEO" && lesson.videoUrl && (
                    <VideoPlayerPanel
                      videoUrl={`${APP_CONFIG.apiBaseUrl}/player/video-stream/${lesson.id}?token=${localStorage.getItem("token") || ""}`}
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

                <div className="flex items-center justify-between border-t border-zinc-900/60 pt-6">
                  <button
                    onClick={handlePrevLesson}
                    disabled={flatLessons.findIndex((l) => l.id === activeLessonId) === 0}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 text-zinc-300"
                  >
                    ← Previous Lesson
                  </button>
                  {flatLessons.findIndex((l) => l.id === activeLessonId) < flatLessons.length - 1 ? (
                    <button
                      onClick={handleNextLesson}
                      disabled={
                        !unlockedLessonIds.has(
                          flatLessons[flatLessons.findIndex((l) => l.id === activeLessonId) + 1]?.id
                        )
                      }
                      className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-blue-500/10"
                    >
                      Next Lesson →
                    </button>
                  ) : (
                    <div className="px-5 py-2.5 text-xs font-black uppercase text-zinc-500 border border-zinc-800/80 bg-zinc-900/40 rounded-xl tracking-wider select-none">
                      End of Pathway
                    </div>
                  )}
                </div>

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
                      onClick={() => setActiveTab(tab.id as "overview" | "resources" | "notes" | "bookmarks" | "quiz")}
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
                    <div className="max-w-2xl">
                      {renderQuizTab()}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-850 bg-zinc-950 p-4 md:p-6 space-y-6 flex-shrink-0 overflow-y-auto">
            <div className="p-5 rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-md shadow-xl space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-widest">
                Overall Progress
              </h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  {Math.round(progressPercentage)}%
                </span>
                <span className="text-[10px] font-bold text-zinc-500">
                  {completedLessonsCount} / {totalLessonsCount} Lessons
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800/60 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-md shadow-xl space-y-4">
              <h4 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-widest">
                Pathway Info
              </h4>
              <div className="space-y-3.5 text-xs text-zinc-450">
                <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
                  <span>Pathway Status:</span>
                  <span className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                    isCourseComplete 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-blue-500/10 text-blue-450 border border-blue-500/20"
                  }`}>
                    {isCourseComplete ? "Completed" : "Active"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Certificate:</span>
                  {activeCourseCertificate ? (
                    <Link
                      to={`/certificates/${activeCourseCertificate.id}`}
                      className="font-black text-[10px] px-2.5 py-1 rounded-xl bg-purple-600/15 text-purple-400 hover:bg-purple-600/25 border border-purple-500/20 transition cursor-pointer select-none"
                    >
                      View Certificate
                    </Link>
                  ) : isCourseComplete ? (
                    <button
                      onClick={handleGenerateCertificate}
                      disabled={generateCertificateMut.isPending}
                      className="font-black text-[10px] px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5 focus:outline-none select-none"
                    >
                      {generateCertificateMut.isPending ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </button>
                  ) : (
                    <span className="font-black text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-550 select-none">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CompletionDialog
        isOpen={isCompletionDialogOpen}
        onClose={() => setIsCompletionDialogOpen(false)}
        courseTitle={structure.title}
        hasQuiz={hasQuizLessons}
        quizPassed={quizPassed}
        certificateAvailable={true}
        onStartQuiz={() => {
          setActiveTab("quiz");
        }}
        onViewCertificate={() => {
          setIsCompletionDialogOpen(false);
          navigate("/certificates");
        }}
      />
    </div>
  );
}

function QuizIntroInline({
  quizId,
  onStart,
  isLoading,
  attemptHistory,
  maxAttempts,
  attemptsRemaining,
}: {
  quizId: string;
  onStart: () => void;
  isLoading: boolean;
  attemptHistory: QuizAttemptMeta[];
  maxAttempts: number;
  attemptsRemaining: number;
}) {
  const { data: quiz, isLoading: isQuizLoading } = useQuizDetail(quizId);

  if (isQuizLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Spinner size="md" />
          <p className="text-xs text-zinc-500 font-bold">Loading quiz details...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
        <Info className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
        <p className="text-xs font-bold text-zinc-400">Quiz data unavailable</p>
      </div>
    );
  }

  return (
    <QuizIntro
      quiz={quiz}
      onStart={onStart}
      isLoading={isLoading}
      attemptHistory={attemptHistory}
      maxAttempts={maxAttempts}
      attemptsRemaining={attemptsRemaining}
    />
  );
}
