import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/config/routes.config";
import { useQuizDetail, useStartQuizAttempt, useResumeQuizAttempt, useSubmitQuizAttempt, useQuizAttemptResult } from "@/hooks/useQuiz";
import { QuizIntro } from "@/components/quiz/QuizIntro";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { ResultPage } from "@/components/quiz/ResultPage";
import { ReviewMode } from "@/components/quiz/ReviewMode";
import type { StartAttemptResponse, ResumeAttemptFinished, LocalAnswer, QuizPersistence, QuizAttemptMeta } from "@/types/quiz.types";
import { QUIZ_STORAGE_KEY } from "@/types/quiz.types";

type QuizView = "intro" | "playing" | "result" | "review";

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();

  const quizId = searchParams.get("quizId") || "";

  const [view, setView] = useState<QuizView>("intro");
  const [activeAttempt, setActiveAttempt] = useState<StartAttemptResponse | null>(null);
  const [attemptResultId, setAttemptResultId] = useState<string>("");
  const [answersState, setAnswersState] = useState<Record<string, LocalAnswer>>({});
  const [markedState, setMarkedState] = useState<string[]>([]);
  const [currentIndexState, setCurrentIndexState] = useState(0);

  const { data: quiz, isLoading: quizLoading } = useQuizDetail(quizId);
  const startMutation = useStartQuizAttempt();
  const submitMutation = useSubmitQuizAttempt();
  const { data: attemptResult } = useQuizAttemptResult(attemptResultId, view === "review");

  const persistedRef = useRef<QuizPersistence | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (stored) {
        const parsed: QuizPersistence = JSON.parse(stored);
        if (parsed.quizId === quizId && parsed.attemptId) {
          persistedRef.current = parsed;
        }
      }
    } catch { /* noop */ }
  }, [quizId]);

  const { data: resumedData, isLoading: resumingLoading } = useResumeQuizAttempt(
    persistedRef.current?.attemptId || "",
    !!persistedRef.current?.attemptId && view === "intro"
  );

  useEffect(() => {
    if (!resumedData || activeAttempt) return;

    const finished = resumedData as ResumeAttemptFinished;
    if ("finished" in finished && finished.finished) {
      if (finished.expired || finished.attempt.status !== "IN_PROGRESS") {
        setAttemptResultId(finished.attempt.id);
        setView("result");
        localStorage.removeItem(QUIZ_STORAGE_KEY);
      }
      return;
    }

    const attemptData = resumedData as StartAttemptResponse;
    setActiveAttempt(attemptData);
    if (persistedRef.current) {
      setAnswersState(persistedRef.current.answers);
      setMarkedState(persistedRef.current.markedForReview);
      setCurrentIndexState(persistedRef.current.currentQuestionIndex);
    }
    setView("playing");
  }, [resumedData, activeAttempt]);

  const attemptHistory: QuizAttemptMeta[] = [];

  const attemptsRemaining = quiz
    ? Math.max(0, quiz.maxAttempts - attemptHistory.length)
    : 3;

  const handleStart = useCallback(async () => {
    if (!quizId) return;
    try {
      const data = await startMutation.mutateAsync(quizId);
      setActiveAttempt(data);
      setAnswersState({});
      setMarkedState([]);
      setCurrentIndexState(0);
      const persistence: QuizPersistence = {
        attemptId: data.attemptId,
        quizId: data.quizId,
        answers: {},
        currentQuestionIndex: 0,
        markedForReview: [],
        startedAt: data.startedAt,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(persistence));
      setView("playing");
    } catch { /* noop */ }
  }, [quizId, startMutation]);

  const handleAnswersChange = useCallback(
    (answers: Record<string, LocalAnswer>, marked: string[], currentIndex: number) => {
      setAnswersState(answers);
      setMarkedState(marked);
      setCurrentIndexState(currentIndex);
      if (activeAttempt) {
        const persistence: QuizPersistence = {
          attemptId: activeAttempt.attemptId,
          quizId: activeAttempt.quizId,
          answers,
          currentQuestionIndex: currentIndex,
          markedForReview: marked,
          startedAt: activeAttempt.startedAt,
        };
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(persistence));
      }
    },
    [activeAttempt]
  );

  const handleSubmit = useCallback(
    async (answerList: LocalAnswer[]) => {
      if (!activeAttempt) return;
      try {
        await submitMutation.mutateAsync({
          attemptId: activeAttempt.attemptId,
          answers: answerList,
        });
        setAttemptResultId(activeAttempt.attemptId);
        localStorage.removeItem(QUIZ_STORAGE_KEY);
        setView("result");
      } catch { /* noop */ }
    },
    [activeAttempt, submitMutation]
  );

  const handleTimeUp = useCallback(async () => {
    if (!activeAttempt) return;
    try {
      await submitMutation.mutateAsync({
        attemptId: activeAttempt.attemptId,
        answers: [],
      });
      setAttemptResultId(activeAttempt.attemptId);
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      setView("result");
    } catch { /* noop */ }
  }, [activeAttempt, submitMutation]);

  const handleRetry = useCallback(() => {
    setActiveAttempt(null);
    setAnswersState({});
    setMarkedState([]);
    setCurrentIndexState(0);
    setView("intro");
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.login);
    } catch { /* noop */ }
  };

  if (quizLoading || resumingLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-zinc-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <Info className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold">Quiz Not Found</h2>
          <p className="text-xs text-zinc-500">
            The quiz you are looking for does not exist or is no longer available.
          </p>
          <Link to="/student">
            <Button size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/student"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-50 text-xs font-bold transition"
          >
            <ArrowLeft className="h-4 w-4" /> Exit Quiz
          </Link>
          <span className="h-4 w-px bg-zinc-800" />
          <h1 className="text-sm font-bold text-zinc-200 truncate">{quiz.title}</h1>
        </div>
        <div className="relative group">
          <button className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-xs focus:outline-none transition">
            U
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 hidden group-hover:block shadow-xl z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 p-2.5 rounded-xl hover:bg-zinc-800 text-xs text-rose-500 font-bold focus:outline-none transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {view === "intro" && (
          <QuizIntro
            quiz={quiz}
            onStart={handleStart}
            isLoading={startMutation.isPending}
            attemptHistory={attemptHistory}
            maxAttempts={quiz.maxAttempts}
            attemptsRemaining={attemptsRemaining}
          />
        )}

        {view === "playing" && activeAttempt && (
          <QuizPlayer
            questions={activeAttempt.questions}
            attemptId={activeAttempt.attemptId}
            quizId={activeAttempt.quizId}
            title={activeAttempt.title}
            startedAt={activeAttempt.startedAt}
            timeLimitMinutes={activeAttempt.timeLimitMinutes}
            initialAnswers={answersState}
            initialMarked={markedState}
            initialIndex={currentIndexState}
            onAnswersChange={handleAnswersChange}
            onSubmit={handleSubmit}
            onTimeUp={handleTimeUp}
            isSubmitting={submitMutation.isPending}
          />
        )}

        {view === "result" && attemptResult && (
          <ResultPage
            result={attemptResult}
            totalQuestions={activeAttempt?.questions.length || quiz.questions?.length || 0}
            onReview={() => setView("review")}
            onRetry={handleRetry}
            canRetry={attemptsRemaining > 0}
            attemptsRemaining={attemptsRemaining}
          />
        )}

        {view === "review" && attemptResult && (
          <ReviewMode
            result={attemptResult}
            onBack={() => setView("result")}
          />
        )}
      </div>
    </div>
  );
}
