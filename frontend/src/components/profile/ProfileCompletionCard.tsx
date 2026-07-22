import { motion } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProfileCompletionCardProps {
  percentage: number;
  missingFields: string[];
  onOpenEditModal: () => void;
  onOpenAvatarModal: () => void;
  onOpenCoverModal: () => void;
}

export function ProfileCompletionCard({
  percentage,
  missingFields,
  onOpenEditModal,
  onOpenAvatarModal,
  onOpenCoverModal,
}: ProfileCompletionCardProps) {
  const checklist = [
    { label: "Profile Avatar Image", key: "Profile Avatar Image", action: onOpenAvatarModal },
    { label: "Profile Cover Banner", key: "Profile Cover Banner", action: onOpenCoverModal },
    { label: "First & Last Name", key: "First/Last Name", action: onOpenEditModal },
    { label: "Phone Number", key: "Phone Number", action: onOpenEditModal },
    { label: "Biography (Bio)", key: "Bio", action: onOpenEditModal },
    { label: "College Name", key: "College Name", action: onOpenEditModal },
    { label: "Social Links (GitHub/LinkedIn)", key: "Social Links (GitHub/LinkedIn)", action: onOpenEditModal },
  ];

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Profile Completion Meter
          </CardTitle>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            {percentage}% Complete
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium text-right">
            {percentage === 100 ? "🎉 Your profile is 100% complete!" : `${100 - percentage}% remaining to reach full profile status`}
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2 pt-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Profile Strength Checklist
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklist.map((item, idx) => {
              const isMissing = missingFields.includes(item.key);
              return (
                <div
                  key={idx}
                  onClick={() => isMissing && item.action()}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition ${
                    isMissing
                      ? "border-amber-200/70 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20 text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-amber-300"
                      : "border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isMissing ? (
                      <Circle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className={!isMissing ? "line-through" : ""}>{item.label}</span>
                  </div>
                  {isMissing && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      Add <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
