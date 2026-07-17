import { BookOpen, Clock, Target, Hash, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { QuizDetail, QuizAttemptMeta } from "@/types/quiz.types";

interface QuizIntroProps {
  quiz: QuizDetail;
  onStart: () => void;
  isLoading: boolean;
  attemptHistory: QuizAttemptMeta[];
  maxAttempts: number;
  attemptsRemaining: number;
}

export function QuizIntro({
  quiz,
  onStart,
  isLoading,
  attemptHistory,
  maxAttempts,
  attemptsRemaining,
}: QuizIntroProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="h-16 w-16 bg-blue-600/15 rounded-2xl flex items-center justify-center mx-auto">
          <BookOpen className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-lg font-black text-zinc-100">{quiz.title}</h2>
        {quiz.description && (
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            {quiz.description}
          </p>
        )}
      </div>

      {quiz.instructions && (
        <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            Instructions
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {quiz.instructions}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <Hash className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <p className="text-sm font-black text-zinc-100">{quiz.questions?.length || 0}</p>
          <p className="text-[10px] font-bold text-zinc-500">Questions</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-sm font-black text-zinc-100">
            {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m` : "None"}
          </p>
          <p className="text-[10px] font-bold text-zinc-500">Duration</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <Target className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-black text-zinc-100">{quiz.passingPercentage}%</p>
          <p className="text-[10px] font-bold text-zinc-500">Passing</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-850 border border-zinc-800 text-center">
          <RotateCcw className="h-4 w-4 text-purple-500 mx-auto mb-1" />
          <p className="text-sm font-black text-zinc-100">
            {attemptsRemaining}/{maxAttempts}
          </p>
          <p className="text-[10px] font-bold text-zinc-500">Attempts</p>
        </div>
      </div>

      {attemptHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            Attempt History
          </h4>
          <div className="space-y-2">
            {attemptHistory.map((attempt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-850 border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-zinc-500">
                    Attempt #{attempt.attemptNumber}
                  </span>
                  <Badge variant={attempt.passed ? "success" : "danger"}>
                    {attempt.passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                  {attempt.percentage !== null && (
                    <span className="font-bold">{attempt.percentage.toFixed(1)}%</span>
                  )}
                  {attempt.timeTakenSeconds !== null && (
                    <span>{Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attemptsRemaining > 0 ? (
        <Button
          onClick={onStart}
          isLoading={isLoading}
          disabled={isLoading}
          className="w-full start-quiz-btn"
          size="lg"
        >
          {attemptHistory.length > 0 ? "Retry Quiz" : "Start Quiz"}
        </Button>
      ) : (
        <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-bold text-red-500">
            You have exhausted all {maxAttempts} attempts for this quiz.
          </p>
        </div>
      )}
    </div>
  );
}
