import { Award, Lock, CheckCircle2, Sparkles, Flame, Target, Zap, Trophy, Percent } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  icon?: string;
}

interface AchievementsBadgeGridProps {
  achievements: AchievementBadge[];
}

function getBadgeIcon(id: string) {
  switch (id) {
    case "first-course":
      return <Trophy className="h-6 w-6 text-amber-500" />;
    case "streak-7":
      return <Flame className="h-6 w-6 text-orange-500" />;
    case "quiz-master":
      return <Target className="h-6 w-6 text-emerald-500" />;
    case "fast-learner":
      return <Zap className="h-6 w-6 text-blue-500" />;
    case "perfect-score":
      return <Percent className="h-6 w-6 text-purple-500" />;
    default:
      return <Award className="h-6 w-6 text-amber-500" />;
  }
}

export function AchievementsBadgeGrid({ achievements }: AchievementsBadgeGridProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Earned Achievements & Badges
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {unlockedCount} / {achievements.length} Unlocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {achievements.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-2xl p-4 border text-center flex flex-col items-center justify-between transition-all duration-300 relative group overflow-hidden ${
                badge.unlocked
                  ? "bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-zinc-900 border-amber-200 dark:border-amber-900/40 shadow-xs hover:-translate-y-1"
                  : "bg-zinc-50/40 dark:bg-zinc-950/30 border-zinc-200/50 dark:border-zinc-800/60 opacity-60"
              }`}
            >
              {/* Icon container */}
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center relative ${
                  badge.unlocked
                    ? "bg-white dark:bg-zinc-800 shadow-sm border border-amber-200/60 dark:border-amber-900/30"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                {badge.unlocked ? (
                  getBadgeIcon(badge.id)
                ) : (
                  <Lock className="h-6 w-6 text-zinc-400" />
                )}
                {badge.unlocked && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px]">
                    ✓
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <div className="space-y-1 mt-3">
                <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                  {badge.name}
                </h5>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Progress */}
              <div className="w-full mt-3 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                  <span>{badge.unlocked ? "Unlocked" : "Locked"}</span>
                  <span>{badge.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked ? "bg-amber-500" : "bg-zinc-400"
                    }`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
