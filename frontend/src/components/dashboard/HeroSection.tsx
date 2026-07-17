import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Play, Flame, Clock, Award, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/config/routes.config";
import type { DashboardWelcome, DashboardContinueLearning } from "@/types/dashboard.types";

interface HeroSectionProps {
  welcome: DashboardWelcome | null | undefined;
  continueLearning: DashboardContinueLearning | null | undefined;
  isLoading: boolean;
}

export const HeroSection = memo(function HeroSection({ welcome, continueLearning, isLoading }: HeroSectionProps) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-72 bg-white/20" />
            <Skeleton className="h-5 w-56 bg-white/20" />
            <Skeleton className="h-2 w-48 bg-white/20 rounded-full" />
            <Skeleton className="h-10 w-44 bg-white/20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!welcome) return null;

  const initials = welcome.studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 md:p-10 shadow-xl">
      {/* Decorative premium glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 min-w-0 flex-1">
          <Avatar
            src={welcome.avatarUrl || undefined}
            fallback={initials}
            size="lg"
            className="h-16 w-16 md:h-20 md:w-20 ring-4 ring-zinc-800/80 shadow-2xl rounded-full"
          />

          <div className="space-y-4 min-w-0 flex-1">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{greeting}</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-50 tracking-tight mt-1">
                {welcome.studentName} <span className="inline-block animate-bounce origin-bottom">👋</span>
              </h2>
            </div>

            {continueLearning ? (
              <div className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <p className="text-zinc-400 text-sm font-medium">
                    You're <span className="text-blue-400 font-bold">{Math.round(continueLearning.progressPercentage)}%</span> through
                  </p>
                  <h2 className="text-xl font-bold text-zinc-100 line-clamp-1">
                    {continueLearning.courseTitle}
                  </h2>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                    <span className="flex items-center gap-1.5 text-zinc-350">
                      <Play className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                      Lesson: {continueLearning.lessonTitle}
                    </span>
                    <span>{Math.round(continueLearning.progressPercentage)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                      style={{ width: `${Math.min(continueLearning.progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`${ROUTES.player}?courseId=${continueLearning.courseId}&lessonId=${continueLearning.lessonId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Resume Learning
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">Welcome back! Start your learning journey today by exploring courses.</p>
                <div>
                  <Link
                    to={ROUTES.courses}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Explore Course Catalog
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integrated Quick Action Stats strip */}
        <div className="flex flex-row sm:flex-col lg:flex-row gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-6 lg:pt-0 lg:pl-8">
          <div className="flex items-center gap-3 bg-zinc-800/30 border border-zinc-800/50 rounded-2xl px-5 py-3.5 flex-1 sm:flex-initial">
            <Flame className="h-5 w-5 text-orange-400 shrink-0" />
            <div>
              <p className="text-zinc-100 text-lg font-black">{welcome.learningStreak} Days</p>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Learning Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-800/30 border border-zinc-800/50 rounded-2xl px-5 py-3.5 flex-1 sm:flex-initial">
            <Clock className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-zinc-100 text-lg font-black">{welcome.totalLearningHours.toFixed(1)}h</p>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Time Invested</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
