import { History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { QuizAttemptMeta } from "@/types/quiz.types";

interface AttemptHistoryProps {
  attempts: QuizAttemptMeta[];
}

export function AttemptHistory({ attempts }: AttemptHistoryProps) {
  if (attempts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
        <History className="h-3 w-3" />
        Previous Attempts
      </h4>
      <div className="space-y-2">
        {attempts.map((attempt, idx) => {
          const minutes = attempt.timeTakenSeconds
            ? Math.floor(attempt.timeTakenSeconds / 60)
            : 0;
          const seconds = attempt.timeTakenSeconds ? attempt.timeTakenSeconds % 60 : 0;

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-850 border border-zinc-800"
            >
              <div className="flex items-center gap-3">
                {attempt.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <span className="text-[11px] font-bold text-zinc-300">
                    Attempt #{attempt.attemptNumber}
                  </span>
                  <Badge
                    variant={attempt.passed ? "success" : "danger"}
                    className="ml-2"
                  >
                    {attempt.passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                {attempt.percentage !== null && (
                  <span className="font-bold">{attempt.percentage.toFixed(1)}%</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {minutes}m {seconds}s
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
