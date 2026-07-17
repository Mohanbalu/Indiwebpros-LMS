import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
  startedAt: string;
  timeLimitMinutes: number;
  onTimeUp: () => void;
}

export function QuizTimer({ startedAt, timeLimitMinutes, onTimeUp }: QuizTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (timeLimitMinutes <= 0) return -1;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const totalSeconds = timeLimitMinutes * 60;
    return Math.max(0, totalSeconds - elapsed);
  });
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (remainingSeconds <= 0 && remainingSeconds !== -1) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds === -1]);

  const handleTimeUp = useCallback(() => {
    onTimeUpRef.current();
  }, []);

  useEffect(() => {
    if (remainingSeconds === 0 && timeLimitMinutes > 0) {
      handleTimeUp();
    }
  }, [remainingSeconds, timeLimitMinutes, handleTimeUp]);

  if (timeLimitMinutes <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-[11px] font-bold">No time limit</span>
      </div>
    );
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const isWarning = remainingSeconds <= 60 && remainingSeconds > 0;
  const isCritical = remainingSeconds <= 300 && remainingSeconds > 60;
  const isUrgent = remainingSeconds <= 600 && remainingSeconds > 300;

  const formatted = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono transition-colors",
        isWarning && "bg-red-500/15 text-red-500 animate-pulse",
        isCritical && "bg-red-500/15 text-red-500",
        isUrgent && "bg-amber-500/15 text-amber-500",
        !isWarning && !isCritical && !isUrgent && "bg-zinc-800 text-zinc-300"
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatted}`}
    >
      {isWarning ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      <span className="text-xs font-bold tabular-nums">{formatted}</span>
    </div>
  );
}
