import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GraduationCap, Monitor, Users } from "lucide-react";

interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  features?: string[];
  accentColor?: "blue" | "purple" | "emerald";
}

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: RoleOption[];
  className?: string;
  disabled?: boolean;
}

const defaultOptions: RoleOption[] = [
  {
    value: "Student",
    label: "Student",
    description: "Learn modern technology with expert-curated paths",
    icon: <GraduationCap className="h-6 w-6" />,
    features: ["40+ Courses", "Projects", "Certificates", "Mentorship"],
    accentColor: "blue",
  },
  {
    value: "Instructor",
    label: "Instructor",
    description: "Design curriculum, mock setups, and learning modules",
    icon: <Monitor className="h-6 w-6" />,
    features: ["Course Builder", "Analytics", "Revenue Share", "Students"],
    accentColor: "purple",
  },
  {
    value: "Mentor",
    label: "Mentor",
    description: "Verify capstones and guide developers to mastery",
    icon: <Users className="h-6 w-6" />,
    features: ["Review Queue", "Guidance Tools", "Expert Network", "Recognition"],
    accentColor: "emerald",
  },
];

const accentStyles = {
  blue: {
    selected: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md shadow-blue-500/5",
    icon: "bg-blue-500/20 border-blue-500/30 text-blue-500",
    iconIdle: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    label: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    pill: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    check: "bg-blue-500 border-blue-500 text-white",
  },
  purple: {
    selected: "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-md shadow-purple-500/5",
    icon: "bg-purple-500/20 border-purple-500/30 text-purple-500",
    iconIdle: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    label: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    pill: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    check: "bg-purple-500 border-purple-500 text-white",
  },
  emerald: {
    selected: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/5",
    icon: "bg-emerald-500/20 border-emerald-500/30 text-emerald-500",
    iconIdle: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    label: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    check: "bg-emerald-500 border-emerald-500 text-white",
  },
};

export function RoleSelector({
  value,
  onChange,
  options = defaultOptions,
  className,
  disabled = false
}: RoleSelectorProps) {
  return (
    <div className={cn("space-y-4", className)} role="radiogroup" aria-label="Select your role">
      <div className="sr-only" aria-live="polite">
        {value ? `Selected: ${value}` : "No role selected"}
      </div>

      <AnimatePresence mode="popLayout">
        {options.map((option, index) => {
          const accent = accentStyles[option.accentColor || "blue"];
          const isSelected = value === option.value;

          return (
            <motion.label
              key={option.value}
              className="block group cursor-pointer select-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, delay: index * 0.08 }}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={isSelected}
                onChange={(e) => !disabled && onChange(e.target.value)}
                disabled={disabled}
                className="sr-only"
                aria-describedby={`${option.value}-desc`}
              />
              <motion.div
                className={cn(
                  "relative p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-200",
                  isSelected
                    ? accent.selected
                    : "border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-700",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                whileHover={{
                  y: -2,
                  boxShadow: isSelected
                    ? "0 10px 30px -5px rgba(59, 130, 246, 0.15)"
                    : "0 4px 20px -5px rgba(0, 0, 0, 0.05)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated check indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 17 }}
                      className="absolute top-3 right-3"
                    >
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                        accent.check
                      )}>
                        <svg className="h-3.5 w-3.5 stroke-[3px]" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  className={cn(
                    "p-3 rounded-xl border shadow-sm shrink-0 transition-all duration-200",
                    isSelected ? accent.icon : accent.iconIdle
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  {option.icon}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-black",
                      isSelected ? accent.label : "text-zinc-900 dark:text-white"
                    )}>
                      {option.label}
                    </span>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          key="badge"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider border",
                            accent.badge
                          )}
                        >
                          Recommended
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <p
                    id={`${option.value}-desc`}
                    className={cn(
                      "mt-1.5 text-sm leading-relaxed",
                      isSelected
                        ? "text-zinc-600 dark:text-zinc-300 font-medium"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {option.description}
                  </p>

                  {option.features && (
                    <div className="mt-3 flex flex-wrap gap-1.5" role="list" aria-label={`${option.label} features`}>
                      {option.features.map((feature, i) => (
                        <motion.span
                          key={feature}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className={cn(
                            "px-2.5 py-0.5 text-[10px] font-semibold rounded-full border",
                            isSelected
                              ? accent.pill
                              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800"
                          )}
                          role="listitem"
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.label>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
