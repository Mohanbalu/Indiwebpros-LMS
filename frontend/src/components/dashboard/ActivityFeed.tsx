import { memo, useMemo } from "react";
import { Award, BookOpen, Brain, Bookmark, StickyNote, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/time";
import type { DashboardData } from "@/types/dashboard.types";

interface ActivityFeedProps {
  data: DashboardData | null | undefined;
  isLoading: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}
const iconMap = (isDark: boolean): Record<string, React.ReactNode> => ({
  quiz_passed: <Brain className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
  quiz_failed: <Brain className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
  certificate_earned: <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
  course_enrolled: <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />,
  bookmark_added: <Bookmark className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />,
  note_created: <StickyNote className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />,
  lesson_viewed: <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />,
});

const colorMap: Record<string, string> = {
  quiz_passed: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-250 dark:border-emerald-800/30",
  quiz_failed: "bg-rose-50 dark:bg-rose-950/40 border-rose-250 dark:border-rose-800/30",
  certificate_earned: "bg-amber-50 dark:bg-amber-950/40 border-amber-250 dark:border-amber-800/30",
  course_enrolled: "bg-blue-50 dark:bg-blue-950/40 border-blue-250 dark:border-blue-800/30",
  bookmark_added: "bg-purple-50 dark:bg-purple-950/40 border-purple-250 dark:border-purple-800/30",
  note_created: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-250 dark:border-cyan-800/30",
  lesson_viewed: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-250 dark:border-indigo-800/30",
};

export const ActivityFeed = memo(function ActivityFeed({ data, isLoading }: ActivityFeedProps) {
  const activities = useMemo((): ActivityItem[] => {
    if (!data) return [];
    const items: ActivityItem[] = [];

    if (data.quizzes?.attempts) {
      for (const a of data.quizzes.attempts) {
        items.push({
          id: `quiz-${a.id}`,
          type: a.passed ? "quiz_passed" : "quiz_failed",
          title: a.passed ? "Quiz Passed" : "Quiz Attempted",
          description: `${a.quizTitle} — ${a.percentage.toFixed(0)}%`,
          timestamp: a.submittedAt,
        });
      }
    }

    if (data.certificates) {
      for (const c of data.certificates) {
        items.push({
          id: `cert-${c.id}`,
          type: "certificate_earned",
          title: "Certificate Earned",
          description: c.courseTitle,
          timestamp: c.issuedAt,
        });
      }
    }

    if (data.bookmarks) {
      for (const b of data.bookmarks) {
        items.push({
          id: `bm-${b.id}`,
          type: "bookmark_added",
          title: "Bookmarked",
          description: b.lessonTitle,
          timestamp: b.createdAt || new Date().toISOString(),
        });
      }
    }

    if (data.notes) {
      for (const n of data.notes) {
        items.push({
          id: `note-${n.id}`,
          type: "note_created",
          title: "Note Created",
          description: n.title || n.content.slice(0, 60),
          timestamp: n.createdAt,
        });
      }
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 8);
  }, [data]);

  const activeIcons = useMemo(() => iconMap(false), []);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <Skeleton className="h-5 w-24 bg-zinc-150 dark:bg-zinc-900" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-zinc-150 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28 bg-zinc-200 dark:bg-zinc-900" />
                <Skeleton className="h-3 w-36 bg-zinc-200 dark:bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Recent Activity</h3>
        <div className="mt-4">
          <EmptyState
            icon={<FileText className="h-6 w-6 text-zinc-400 dark:text-zinc-650" />}
            title="Timeline is silent"
            description="Your learning achievements will show up here."
            className="!min-h-[120px] !py-4 !px-6 !border-0 !bg-zinc-50/50 dark:!bg-zinc-950/40 !rounded-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Recent Activity</h3>
      </div>
      <div className="px-6 pb-6 mt-3">
        <div className="relative pl-6 space-y-0.5">
          <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
          {activities.map((activity) => (
            <div key={activity.id} className="relative pb-5 last:pb-0">
              <div
                className={`absolute -left-[23px] top-0.5 flex h-5 w-5 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm ${colorMap[activity.type] || "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"}`}
                aria-hidden="true"
              >
                {activeIcons[activity.type] || <FileText className="h-3.5 w-3.5 text-zinc-450 dark:text-zinc-400" />}
              </div>
              <div className="ml-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-none">{activity.title}</p>
                  <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 shrink-0">
                    {timeAgo(activity.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-1">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
