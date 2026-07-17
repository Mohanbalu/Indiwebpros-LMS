import { memo } from "react";
import { BookOpen, Flame, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardStatistics, DashboardWelcome } from "@/types/dashboard.types";

interface KpiCardsProps {
  statistics: DashboardStatistics | null | undefined;
  welcome: DashboardWelcome | null | undefined;
  isLoading: boolean;
}

interface KpiItem {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

const KpiCard = memo(function KpiCard({ item }: { item: KpiItem }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-28 h-28 ${item.gradient} rounded-bl-[48px] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`} />
      <div className="relative flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-wider">{item.label}</p>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">{item.value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} shrink-0 shadow-sm`}>
          {item.icon}
        </div>
      </div>
    </div>
  );
});

const KpiSkeleton = memo(function KpiSkeleton() {
  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800" />
          <Skeleton className="h-9 w-16 bg-zinc-200 dark:bg-zinc-850" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl bg-zinc-150 dark:bg-zinc-800" />
      </div>
    </div>
  );
});

export const KpiCards = memo(function KpiCards({ statistics, welcome, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  const kpiItems: KpiItem[] = [];

  if (statistics) {
    kpiItems.push({
      label: "Active Courses",
      value: statistics.coursesEnrolled - statistics.coursesCompleted,
      icon: <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      gradient: "bg-blue-600",
      iconBg: "bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100/50 dark:border-blue-800/30",
    });
    kpiItems.push({
      label: "Learning Streak",
      value: welcome?.learningStreak ?? 0,
      icon: <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      gradient: "bg-orange-600",
      iconBg: "bg-orange-50/80 dark:bg-orange-950/40 border border-orange-100/50 dark:border-orange-800/30",
    });
    kpiItems.push({
      label: "Certificates Earned",
      value: statistics.certificatesEarned,
      icon: <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      gradient: "bg-amber-600",
      iconBg: "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100/50 dark:border-amber-800/30",
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {kpiItems.map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}
    </div>
  );
});
