import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BarChart3,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { QuizAttemptRecord } from "@/types/quiz.types";

interface ResultPageProps {
  result: QuizAttemptRecord;
  totalQuestions: number;
  onReview?: () => void;
  onRetry?: () => void;
  canRetry: boolean;
  attemptsRemaining: number;
}

export function ResultPage({
  result,
  totalQuestions,
  onReview,
  onRetry,
  canRetry,
  attemptsRemaining,
}: ResultPageProps) {
  const percentage = result.percentage ?? 0;
  const passed = result.passed ?? false;
  const score = result.score ?? 0;
  const timeTaken = result.timeTakenSeconds ?? 0;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-4 py-4">
        <div
          className={cn(
            "h-20 w-20 rounded-full flex items-center justify-center mx-auto",
            passed
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-red-500/15 text-red-500"
          )}
        >
          {passed ? (
            <Award className="h-10 w-10" />
          ) : (
            <XCircle className="h-10 w-10" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-black text-zinc-100">
            {passed ? "Congratulations!" : "Better Luck Next Time"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {passed
              ? "You have successfully passed this assessment."
              : "You did not meet the passing criteria this time."}
          </p>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2 rounded-xl",
            passed
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-red-500/15 text-red-500"
          )}
        >
          <span className="text-3xl font-black quiz-score">{percentage.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <BarChart3 className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-black text-zinc-100">{score}</p>
          <p className="text-[10px] font-bold text-zinc-500">Score</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <Target className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-black text-zinc-100">{totalQuestions}</p>
          <p className="text-[10px] font-bold text-zinc-500">Questions</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-black text-zinc-100">
            {minutes}m {seconds}s
          </p>
          <p className="text-[10px] font-bold text-zinc-500">Time Taken</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <CheckCircle2 className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-black text-zinc-100">#{result.attemptNumber}</p>
          <p className="text-[10px] font-bold text-zinc-500">Attempt</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Badge variant={passed ? "success" : "danger"}>
          {passed ? "PASSED" : "FAILED"}
        </Badge>
        <span className="text-[11px] text-zinc-500">
          Passing: {percentage.toFixed(1)}% required
        </span>
      </div>

      <div className="flex gap-3">
        {onReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReview}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Review Answers
          </Button>
        )}
        {canRetry && onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Retry ({attemptsRemaining} left)
          </Button>
        )}
      </div>

      {!canRetry && (
        <p className="text-center text-[11px] text-zinc-600">
          You have no more attempts remaining for this quiz.
        </p>
      )}
    </div>
  );
}
