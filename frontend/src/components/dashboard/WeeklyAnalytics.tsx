import { memo } from "react";
import { Clock, CheckCircle2, Award, Brain, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardStatistics } from "@/types/dashboard.types";

interface WeeklyAnalyticsProps {
  data: DashboardStatistics | null | undefined;
  isLoading: boolean;
}

export const WeeklyAnalytics = memo(function WeeklyAnalytics({ data, isLoading }: WeeklyAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <Skeleton className="h-5 w-40 bg-zinc-150 dark:bg-zinc-850" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-950/40" />
          <Skeleton className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-950/40" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Let's create beautiful SVG path metrics
  const hoursData = data.weeklyHours && data.weeklyHours.length > 0 ? data.weeklyHours : [0, 0, 0, 0, 0, 0, 0];
  const maxHours = Math.max(...hoursData, 1);
  const sparkPoints = hoursData
    .map((h, i) => `${(i / (hoursData.length - 1)) * 140 + 10},${85 - (h / maxHours) * 60}`)
    .join(" ");

  // Quiz passing circular dash math
  const maxQuizzesGoal = Math.max(data.quizzesPassed + 2, 5);
  const quizPct = (data.quizzesPassed / maxQuizzesGoal) * 100;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (quizPct / 100) * circumference;

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Weekly Performance Analytics</h3>
      </div>

      <div className="px-6 pb-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric 1: Hours Invested Sparkline */}
        <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/50 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-555 font-bold uppercase tracking-wider">Hours Invested</span>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">{data.hoursLearned.toFixed(1)} hrs</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          {/* SVG Sparkline */}
          <div className="h-12 w-full mt-2 self-end">
            <svg className="w-full h-full" viewBox="0 0 160 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill path under the line */}
              <path
                d={`M 10,95 L ${sparkPoints} L 150,95 Z`}
                fill="url(#hoursGrad)"
              />
              {/* Line path */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkPoints}
              />
              {/* Glowing endpoint dot */}
              <circle
                cx={150}
                cy={85 - (hoursData[hoursData.length - 1] / maxHours) * 60}
                r="4.5"
                fill="#f97316"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* Metric 2: Lessons Completed Bars */}
        <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/50 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-555 font-bold uppercase tracking-wider">Lessons Finished</span>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">{data.lessonsCompleted} items</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Inline bar chart layout */}
          <div className="flex items-end justify-between gap-2.5 h-12 mt-2 pt-2">
            {[20, 45, 30, 65, 85, 100].map((heightPct, idx) => {
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden h-9 relative border border-zinc-200/20 dark:border-0">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-500 transition-all duration-700"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-500 dark:text-zinc-650 font-semibold uppercase">{["M", "T", "W", "T", "F", "S"][idx]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric 3: Quizzes Ring Gauge */}
        <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/50 flex items-center justify-between h-36">
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-555 font-bold uppercase tracking-wider">Quizzes Passed</span>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">{data.quizzesPassed} passed</p>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold leading-relaxed">
              Target goal is {maxQuizzesGoal} quizzes.<br />Keep testing your mastery!
            </p>
          </div>

          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-zinc-200 dark:text-zinc-800"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-purple-600 dark:text-purple-500"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 mt-0.5">{Math.round(quizPct)}%</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Assessments & Achievements Summary */}
        <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/50 flex items-center justify-between h-36">
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-555 font-bold uppercase tracking-wider">Syllabus Completion</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {data.coursesCompleted} completed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span>{data.certificatesEarned} credentials earned</span>
            </div>
          </div>

          <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
});
