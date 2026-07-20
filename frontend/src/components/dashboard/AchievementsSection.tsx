import { memo } from "react";
import { Award, Flame, Trophy, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/config/routes.config";
import type { DashboardCertificate, DashboardStatistics, DashboardWelcome } from "@/types/dashboard.types";

interface AchievementsSectionProps {
  certificates: DashboardCertificate[];
  statistics: DashboardStatistics | null | undefined;
  welcome: DashboardWelcome | null | undefined;
  isLoading: boolean;
}

interface AchievementBadge {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const AchievementsSection = memo(function AchievementsSection({
  certificates,
  statistics,
  welcome,
  isLoading,
}: AchievementsSectionProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        <Skeleton className="h-5 w-28 bg-zinc-150 dark:bg-zinc-800" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 text-center">
              <Skeleton className="h-8 w-8 rounded-full mx-auto bg-zinc-150 dark:bg-zinc-800" />
              <Skeleton className="mt-1.5 h-5 w-10 mx-auto bg-zinc-200 dark:bg-zinc-900" />
              <Skeleton className="mt-0.5 h-3 w-16 mx-auto bg-zinc-200 dark:bg-zinc-900" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const badges: AchievementBadge[] = [];

  if (certificates.length > 0) {
    badges.push({
      label: "Certificates",
      value: certificates.length,
      icon: <Award className="h-4.5 w-4.5" />,
      color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/35",
    });
  }

  if (statistics) {
    if (statistics.coursesCompleted > 0) {
      badges.push({
        label: "Completed",
        value: statistics.coursesCompleted,
        icon: <CheckCircle className="h-4.5 w-4.5" />,
        color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/35",
      });
    }
    if (statistics.quizzesPassed > 0) {
      badges.push({
        label: "Quizzes Passed",
        value: statistics.quizzesPassed,
        icon: <Trophy className="h-4.5 w-4.5" />,
        color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/35",
      });
    }
  }

  if (welcome && welcome.learningStreak > 0) {
    badges.push({
      label: "Day Streak",
      value: welcome.learningStreak,
      icon: <Flame className="h-4.5 w-4.5" />,
      color: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/35",
    });
  }

  if (badges.length === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
            <Trophy className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-350 uppercase tracking-wide">Achievements</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Earn certificates & milestones</p>
          </div>
          <Link to={ROUTES.courses} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-0.5">
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Achievements</h3>
      </div>
      <div className="px-6 pb-6 mt-2 grid grid-cols-2 gap-3.5">
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/50">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.color} shrink-0 shadow-sm`}>
              {badge.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{badge.value}</p>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">{badge.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
