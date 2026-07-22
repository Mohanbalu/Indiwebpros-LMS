import { Clock, CheckCircle2, Play, Award, CreditCard, Shield, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

function getTimeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function getActivityIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("LESSON") || t.includes("PROGRESS")) return <Play className="h-3.5 w-3.5 text-blue-500" />;
  if (t.includes("QUIZ")) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (t.includes("CERTIFICATE")) return <Award className="h-3.5 w-3.5 text-amber-500" />;
  if (t.includes("PAYMENT") || t.includes("PURCHASE")) return <CreditCard className="h-3.5 w-3.5 text-purple-500" />;
  if (t.includes("SECURITY") || t.includes("LOGIN") || t.includes("PROFILE")) return <Shield className="h-3.5 w-3.5 text-indigo-500" />;
  return <FileText className="h-3.5 w-3.5 text-zinc-400" />;
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Recent Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-xs font-semibold text-zinc-400">
            No recent activity logged yet. Start a lesson or complete a quiz!
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-3 group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                  {getActivityIcon(act.type)}
                </div>

                <div className="flex-1 space-y-0.5 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{act.title}</h5>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {getTimeLabel(act.date)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-snug">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
