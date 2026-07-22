import { motion } from "framer-motion";
import { Sparkles, Trophy, Award, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface XpVaultSectionProps {
  currentLevel: number;
  xpPoints: number;
  xpProgressPct: number;
  leaderboardRank: number;
  coursesEnrolled: number;
  lessonsCompleted: number;
  quizzesPassed: number;
}

export function XpVaultSection({
  currentLevel,
  xpPoints,
  xpProgressPct,
  leaderboardRank,
  coursesEnrolled,
  lessonsCompleted,
  quizzesPassed,
}: XpVaultSectionProps) {
  const nextLevelXp = currentLevel * 1000;
  const xpNeeded = nextLevelXp - xpPoints;

  const xpRules = [
    { title: "Course Enrollment", points: "+500 XP", desc: "Awarded per pathway unlocked", count: coursesEnrolled, icon: <BookOpen className="h-4 w-4 text-blue-500" /> },
    { title: "Lesson Completed", points: "+100 XP", desc: "Awarded per lesson finished", count: lessonsCompleted, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
    { title: "Quiz Passed", points: "+250 XP", desc: "Awarded per quiz cleared", count: quizzesPassed, icon: <Award className="h-4 w-4 text-amber-500" /> },
  ];

  return (
    <Card className="overflow-hidden border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/20 via-white to-zinc-50 dark:from-amber-950/10 dark:via-zinc-900 dark:to-zinc-900 shadow-xs">
      <CardHeader className="pb-3 border-b border-amber-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 fill-amber-400" />
            Dynamic XP Progress & Rank Vault
          </CardTitle>
          <Badge variant="warning" className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Rank #{leaderboardRank}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Main Level & XP Gauge */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center text-white shadow-md shrink-0">
              <Trophy className="h-6 w-6" />
              <span className="text-[10px] font-black tracking-widest uppercase">LVL {currentLevel}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{xpPoints} XP</h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-extrabold">Total Earned</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                {xpNeeded > 0 ? `${xpNeeded} XP needed to reach Level ${currentLevel + 1}` : `Congratulations! Reached Level ${currentLevel}`}
              </p>
            </div>
          </div>

          <div className="w-full md:w-72 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
              <span>Progress to LVL {currentLevel + 1}</span>
              <span>{xpProgressPct}%</span>
            </div>
            <div className="h-3.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/60 dark:border-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* XP Rules Breakdown Grid */}
        <div className="space-y-2">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            XP Earning Activity Breakdown
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {xpRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 shrink-0">
                    {rule.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{rule.title}</h5>
                    <p className="text-[10px] text-zinc-400 font-medium">{rule.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">{rule.points}</span>
                  <span className="block text-[10px] font-bold text-zinc-400">x{rule.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
