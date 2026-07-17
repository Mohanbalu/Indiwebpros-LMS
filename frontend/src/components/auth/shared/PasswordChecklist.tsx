import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordChecklistProps {
  password: string;
  requirements?: PasswordRequirement[];
  className?: string;
  showWhenEmpty?: boolean;
  compact?: boolean;
}

const defaultRequirements: PasswordRequirement[] = [
  { label: "8+ Characters", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
  { label: "Special Char", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export function PasswordChecklist({
  password,
  requirements = defaultRequirements,
  className,
  showWhenEmpty = true,
  compact = false
}: PasswordChecklistProps) {
  const results = requirements.map((req) => ({
    label: req.label,
    met: req.test(password),
  }));

  const metCount = results.filter((r) => r.met).length;
  const totalCount = results.length;

  if (!showWhenEmpty && password.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800",
        compact && "p-3",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          compact && "text-[9px]"
        )}>
          Password Requirements
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-xs font-black",
            compact && "text-[10px]",
            metCount === totalCount ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
          )}>
            {metCount}/{totalCount}
          </span>
          <div className="h-1.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(metCount / totalCount) * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
        </div>
      </div>

      <div className={cn(
        "grid gap-2",
        compact ? "grid-cols-4" : "grid-cols-2"
      )}>
        {results.map((result, index) => (
          <motion.div
            key={result.label}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06 }}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200",
                compact ? "h-4 w-4" : "",
                result.met
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                  : "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              )}
            >
              <Check className={cn(
                "stroke-[3px] transition-opacity duration-200",
                compact ? "h-2.5 w-2.5" : "h-3 w-3",
                result.met ? "opacity-100" : "opacity-0"
              )} />
            </div>
            <span className={cn(
              "font-semibold transition-colors duration-200",
              compact ? "text-[10px]" : "text-[11px]",
              result.met ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"
            )}>
              {result.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Strength indicator */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500", compact && "text-[9px]")}>
            Password Strength
          </span>
          <span className={cn(
            "text-[10px] font-bold transition-colors duration-200",
            compact && "text-[9px]",
            metCount === totalCount ? "text-emerald-500" : metCount >= 3 ? "text-lime-500" : metCount >= 2 ? "text-amber-500" : "text-red-500"
          )}>
            {getStrengthLabel(metCount, totalCount)}
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{
              width: `${(metCount / totalCount) * 100}%`,
              backgroundColor: getStrengthColor(metCount, totalCount)
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function getStrengthLabel(met: number, total: number): string {
  const ratio = met / total;
  if (ratio === 1) return "Strong";
  if (ratio >= 0.75) return "Good";
  if (ratio >= 0.5) return "Fair";
  return "Weak";
}

function getStrengthColor(met: number, total: number): string {
  const ratio = met / total;
  if (ratio === 1) return "#22C55E";
  if (ratio >= 0.75) return "#84CC16";
  if (ratio >= 0.5) return "#F59E0B";
  return "#EF4444";
}
