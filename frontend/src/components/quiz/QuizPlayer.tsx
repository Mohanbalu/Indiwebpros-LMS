import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Eraser,
  Grid3X3,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { QuizQuestionData, LocalAnswer } from "@/types/quiz.types";
import { QuestionCard } from "./QuestionCard";
import { QuestionPalette, type QuestionStatus } from "./QuestionPalette";
import { QuizTimer } from "./QuizTimer";
import { QuizProgress } from "./QuizProgress";
import { SubmitDialog } from "./SubmitDialog";

interface QuizPlayerProps {
  questions: QuizQuestionData[];
  attemptId: string;
  quizId: string;
  title: string;
  startedAt: string;
  timeLimitMinutes: number;
  initialAnswers: Record<string, LocalAnswer>;
  initialMarked: string[];
  initialIndex: number;
  onAnswersChange: (answers: Record<string, LocalAnswer>, marked: string[], currentIndex: number) => void;
  onSubmit: (answers: LocalAnswer[]) => void;
  onTimeUp: () => void;
  isSubmitting: boolean;
}

export function QuizPlayer({
  questions,
  attemptId: _attemptId,
  quizId: _quizId,
  title: _title,
  startedAt,
  timeLimitMinutes,
  initialAnswers,
  initialMarked,
  initialIndex,
  onAnswersChange,
  onSubmit,
  onTimeUp,
  isSubmitting,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>(initialAnswers);
  const [markedForReview, setMarkedForReview] = useState<string[]>(initialMarked);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const currentQuestion = questions[currentIndex];

  const getMultiSelectedIds = useCallback(
    (questionId: string): string[] => {
      const answer = answers[questionId];
      if (!answer?.selectedOptionId) return [];
      try {
        const parsed = JSON.parse(answer.selectedOptionId);
        return Array.isArray(parsed) ? parsed : [answer.selectedOptionId];
      } catch {
        return [answer.selectedOptionId];
      }
    },
    [answers]
  );

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => {
      if (a.selectedOptionId) return true;
      if (a.answerText && a.answerText.trim().length > 0) return true;
      return false;
    }).length;
  }, [answers]);

  const updateAnswer = useCallback(
    (questionId: string, update: Partial<LocalAnswer>) => {
      setAnswers((prev) => {
        const existing = prev[questionId] || { questionId };
        const newAnswers = { ...prev, [questionId]: { ...existing, ...update } };
        return newAnswers;
      });
    },
    []
  );

  useEffect(() => {
    onAnswersChange(answers, markedForReview, currentIndex);
  }, [answers, markedForReview, currentIndex, onAnswersChange]);

  const handleSingleSelect = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      updateAnswer(currentQuestion.id, {
        selectedOptionId: optionId,
        answerText: undefined,
      });
    },
    [currentQuestion, updateAnswer]
  );

  const handleMultiToggle = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      const current = getMultiSelectedIds(currentQuestion.id);
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      updateAnswer(currentQuestion.id, {
        selectedOptionId: next.length > 0 ? JSON.stringify(next) : null,
        answerText: undefined,
      });
    },
    [currentQuestion, getMultiSelectedIds, updateAnswer]
  );

  const handleTextChange = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      updateAnswer(currentQuestion.id, {
        answerText: value,
        selectedOptionId: null,
      });
    },
    [currentQuestion, updateAnswer]
  );

  const toggleMarkForReview = useCallback(() => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => {
      const next = prev.includes(currentQuestion.id)
        ? prev.filter((id) => id !== currentQuestion.id)
        : [...prev, currentQuestion.id];
      return next;
    });
  }, [currentQuestion]);

  const clearResponse = useCallback(() => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  }, [currentQuestion]);

  const isAnswered = useCallback(
    (questionId: string) => {
      const a = answers[questionId];
      if (!a) return false;
      return !!(a.selectedOptionId || (a.answerText && a.answerText.trim().length > 0));
    },
    [answers]
  );

  const getStatuses = useCallback((): QuestionStatus[] => {
    return questions.map((q) => {
      const answered = isAnswered(q.id);
      const marked = markedForReview.includes(q.id);
      const visited = currentIndex >= 0 && (
        answers[q.id] !== undefined ||
        questions.indexOf(q) <= currentIndex
      );

      if (answered && marked) return "answered-marked";
      if (marked) return "marked";
      if (answered) return "answered";
      if (visited) return "not-answered";
      return "not-visited";
    });
  }, [questions, answers, markedForReview, currentIndex, isAnswered]);

  const handleSubmit = useCallback(() => {
    const answerList: LocalAnswer[] = questions.map((q) => {
      const a = answers[q.id];
      if (!a) return { questionId: q.id };
      return a;
    });
    onSubmit(answerList);
  }, [questions, answers, onSubmit]);

  const isCurrentMarked = currentQuestion ? markedForReview.includes(currentQuestion.id) : false;
  const isCurrentAnswered = currentQuestion ? isAnswered(currentQuestion.id) : false;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <QuizProgress
              current={currentIndex + 1}
              total={questions.length}
              answeredCount={answeredCount}
              markedCount={markedForReview.length}
            />
          </div>
          <QuizTimer
            startedAt={startedAt}
            timeLimitMinutes={timeLimitMinutes}
            onTimeUp={onTimeUp}
          />
        </div>

        {currentQuestion && (
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              selectedOptionId={
                currentQuestion.questionType === "MULTIPLE_CHOICE_MULTIPLE"
                  ? null
                  : answers[currentQuestion.id]?.selectedOptionId || null
              }
              selectedOptionIds={getMultiSelectedIds(currentQuestion.id)}
              answerText={answers[currentQuestion.id]?.answerText || ""}
              onSingleSelect={handleSingleSelect}
              onMultiToggle={handleMultiToggle}
              onTextChange={handleTextChange}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1 || isSubmitting}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMarkForReview}
              disabled={isSubmitting}
              className={cn(
                "text-xs",
                isCurrentMarked && "text-amber-500 hover:text-amber-600"
              )}
            >
              <Flag className="h-3.5 w-3.5 mr-1" />
              {isCurrentMarked ? "Unmark" : "Mark"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResponse}
              disabled={isSubmitting || !isCurrentAnswered}
            >
              <Eraser className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPalette(true)}
              className="lg:hidden"
            >
              <Grid3X3 className="h-3.5 w-3.5 mr-1" />
              Palette
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800">
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={isSubmitting}
            className="submit-quiz-btn w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Quiz
          </Button>
        </div>
      </div>

      <div className="w-full lg:w-64 flex-shrink-0 hidden lg:block">
        <QuestionPalette
          total={questions.length}
          currentIndex={currentIndex}
          statuses={getStatuses()}
          onSelect={setCurrentIndex}
          isOpen={showPalette}
          onClose={() => setShowPalette(false)}
        />
      </div>

      <QuestionPalette
        total={questions.length}
        currentIndex={currentIndex}
        statuses={getStatuses()}
        onSelect={setCurrentIndex}
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
      />

      <SubmitDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmit}
        answered={answeredCount}
        skipped={questions.length - answeredCount}
        marked={markedForReview.length}
        total={questions.length}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
