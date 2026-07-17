interface QuizProgressProps {
  current: number;
  total: number;
  answeredCount: number;
  markedCount: number;
}

export function QuizProgress({ current, total, answeredCount, markedCount }: QuizProgressProps) {
  const progressPercent = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-400">
          Question {current} of {total}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-emerald-500">
            {answeredCount} answered
          </span>
          {markedCount > 0 && (
            <span className="text-[10px] font-bold text-amber-500">
              {markedCount} marked
            </span>
          )}
        </div>
      </div>
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
