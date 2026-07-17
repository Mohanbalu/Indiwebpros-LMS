import { memo } from "react";
import { Link } from "react-router-dom";
import { Play, BookOpen, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/config/routes.config";
import type { DashboardContinueLearning } from "@/types/dashboard.types";

interface ContinueLearningSectionProps {
  data: DashboardContinueLearning | null | undefined;
  isLoading: boolean;
}

export const ContinueLearningSection = memo(function ContinueLearningSection({ data, isLoading }: ContinueLearningSectionProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <Skeleton className="h-5 w-40 bg-zinc-150 dark:bg-zinc-800" />
        <div className="mt-4 flex flex-col md:flex-row gap-5">
          <Skeleton className="h-28 w-full md:w-48 rounded-2xl shrink-0 bg-zinc-150 dark:bg-zinc-800" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-850" />
            <Skeleton className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-850" />
            <Skeleton className="h-2 w-full rounded-full bg-zinc-150 dark:bg-zinc-800" />
            <Skeleton className="h-10 w-36 rounded-xl bg-zinc-150 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Continue Learning</h3>
        <div className="mt-4">
          <EmptyState
            icon={<Play className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />}
            title="No courses currently in progress"
            description="Enroll in a learning pathway to begin your journey."
            action={
              <Link to={ROUTES.courses} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
                Browse Catalog
              </Link>
            }
            className="!min-h-[120px] !py-4 !px-6 !border-0 !bg-zinc-50/50 dark:!bg-zinc-950/40 !rounded-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      <div className="flex flex-col sm:flex-row items-stretch">
        <div className="relative w-full sm:w-56 h-40 sm:h-auto bg-gradient-to-br from-blue-600 to-indigo-700 shrink-0 flex items-center justify-center overflow-hidden">
          <BookOpen className="h-10 w-10 text-white/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="h-1.5 w-full rounded-full bg-white/25">
              <div
                className="h-1.5 rounded-full bg-white transition-all duration-1000"
                style={{ width: `${Math.min(data.progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/30 px-2 py-0.5 rounded-md">
                IN PROGRESS
              </span>
            </div>
            <h3 className="mt-2.5 text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{data.courseTitle}</h3>
            <p className="mt-1 text-sm text-zinc-550 dark:text-zinc-400 line-clamp-1 flex items-center gap-1.5">
              <Play className="h-3 w-3 text-blue-500 fill-blue-500/10 shrink-0" />
              Current Lesson: <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{data.lessonTitle}</span>
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {Math.round(data.progressPercentage)}% completed
            </div>
            <Link
              to={`${ROUTES.player}?courseId=${data.courseId}&lessonId=${data.lessonId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Resume Learning
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});
