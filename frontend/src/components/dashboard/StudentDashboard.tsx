import { useCallback } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ContinueLearningSection } from "@/components/dashboard/ContinueLearningSection";
import { MyLearningCard } from "@/components/dashboard/MyLearningCard";
import { WeeklyAnalytics } from "@/components/dashboard/WeeklyAnalytics";
import { NotificationDrawer } from "@/components/dashboard/NotificationDrawer";
import { AchievementsSection } from "@/components/dashboard/AchievementsSection";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActionBar } from "@/components/dashboard/QuickActionBar";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export function StudentDashboard() {
  const { data: dashboard, isLoading, isError, error, refetch } = useDashboard();
  const { data: notifRes, isLoading: notifLoading, isError: notifError, error: notifErr, refetch: notifRefetch } = useNotifications();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const handleDashboardRetry = useCallback(() => { refetch(); }, [refetch]);
  const handleNotifRetry = useCallback(() => { notifRefetch(); }, [notifRefetch]);
  const handleMarkRead = useCallback((id: string) => { markRead.mutate(id); }, [markRead]);
  const handleMarkAllRead = useCallback(() => { markAllRead.mutate(); }, [markAllRead]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorState
          title="Failed to load dashboard"
          message={error instanceof Error ? error.message : "Unable to load dashboard data. Please try again."}
          onRetry={handleDashboardRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-250 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Welcome back to your personalized learning workspace</p>
        </div>
        <QuickActionBar />
      </div>

      {/* ABOVE THE FOLD */}
      <div className="space-y-6">
        <HeroSection
          welcome={dashboard?.welcome}
          continueLearning={dashboard?.continueLearning}
          isLoading={false}
        />
        <KpiCards
          statistics={dashboard?.statistics}
          welcome={dashboard?.welcome}
          isLoading={false}
        />
      </div>

      {/* TWO-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN (66% width on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          <ContinueLearningSection
            data={dashboard?.continueLearning}
            isLoading={false}
          />
          <MyLearningCard
            courses={dashboard?.myCourses ?? []}
            isLoading={false}
          />
          <WeeklyAnalytics
            data={dashboard?.statistics}
            isLoading={false}
          />
        </div>

        {/* RIGHT COLUMN (33% width on desktop) */}
        <div className="space-y-8">
          <NotificationDrawer
            data={
              notifRes?.data
                ? { unreadCount: notifRes.data.unreadCount ?? 0, items: notifRes.data.items ?? [] }
                : null
            }
            isLoading={notifLoading}
            isError={notifError}
            error={notifErr as Error | null}
            onRetry={handleNotifRetry}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            isMarkingRead={markRead.isPending}
            isMarkingAllRead={markAllRead.isPending}
          />
          <AchievementsSection
            certificates={dashboard?.certificates ?? []}
            statistics={dashboard?.statistics}
            welcome={dashboard?.welcome}
            isLoading={false}
          />
          <ActivityFeed
            data={dashboard ?? null}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}
