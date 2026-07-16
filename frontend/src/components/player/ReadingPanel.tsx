import React from "react";
import { CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReadingPanelProps {
  title: string;
  description: string | null;
  completed: boolean;
  onComplete: () => void;
}

export function ReadingPanel({
  title,
  description,
  completed,
  onComplete,
}: ReadingPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[400px]">
      {/* Article Content Header & Body */}
      <div>
        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-4">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Reading Assignment</span>
        </div>
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-6 leading-snug">
          {title}
        </h2>
        <div className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed space-y-4 max-w-3xl whitespace-pre-wrap">
          {description || "No text available for this reading assignment. Please read the linked external resources."}
        </div>
      </div>

      {/* Completion Button / Celebration */}
      <div className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          Ensure you have read the details thoroughly before completing.
        </span>

        {completed ? (
          <span className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
            <CheckCircle2 className="h-4 w-4" /> Lesson Completed
          </span>
        ) : (
          <Button
            onClick={onComplete}
            className="flex items-center gap-1.5 shadow-sm"
          >
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
}
