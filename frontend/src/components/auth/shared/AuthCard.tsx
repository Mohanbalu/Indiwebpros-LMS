import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "transparent";
}

export function AuthCard({ children, className, variant = "primary" }: AuthCardProps) {
  const variants = {
    primary: "bg-white dark:bg-zinc-900 shadow-2xl dark:shadow-black/40 border border-zinc-100/60 dark:border-zinc-800/60",
    secondary: "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-xl dark:shadow-black/30 border border-zinc-100/50 dark:border-zinc-800/50",
    transparent: "bg-transparent shadow-none border-none",
  };

  return (
    <motion.div
      className={cn(
        "w-full rounded-3xl p-8 sm:p-10",
        variants[variant],
        className
      )}
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AuthCardHeader({
  title,
  subtitle,
  illustration,
  showBack = false,
  onBack
}: {
  title: string;
  subtitle?: string;
  illustration?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <motion.div
      className="text-center mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {showBack && onBack && (
        <div className="absolute left-0 top-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {illustration && (
        <div className="relative inline-flex mb-6">
          {illustration}
        </div>
      )}

      <h1 className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-sm xl:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

export function AuthCardFooter({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("mt-10 pt-6 border-t border-zinc-100/60 dark:border-zinc-800/60 text-center", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export function DividerWithText({ text = "Or continue with" }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
        <span className="bg-white dark:bg-zinc-900 px-3">{text}</span>
      </div>
    </div>
  );
}
