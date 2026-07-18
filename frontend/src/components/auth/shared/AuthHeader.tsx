import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";

interface AuthHeaderProps {
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  illustration?: React.ReactNode;
}

export function AuthHeader({
  showLogo = true,
  title,
  subtitle,
  className,
  illustration
}: AuthHeaderProps) {
  return (
    <motion.header
      className={cn("text-center mb-10", className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {illustration && (
        <div className="flex justify-center mb-6">
          {illustration}
        </div>
      )}

      {!illustration && showLogo && (
        <motion.div
          className="inline-flex mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.2 }}
        >
          <Logo showText={false} size={36} />
        </motion.div>
      )}

      {title && (
        <motion.h1
          className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {title}
        </motion.h1>
      )}

      {subtitle && (
        <motion.p
          className="mt-3 text-sm xl:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.header>
  );
}

interface AuthFooterProps {
  children: React.ReactNode;
  className?: string;
  variant?: "divider" | "simple";
}

export function AuthFooter({ children, className, variant = "divider" }: AuthFooterProps) {
  if (variant === "simple") {
    return (
      <motion.div
        className={cn("mt-8 text-center", className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("mt-10", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-zinc-400 dark:text-zinc-500">
          <span className="bg-white dark:bg-zinc-900 px-3">Or continue with</span>
        </div>
      </div>
      <div className="text-center">
        {children}
      </div>
    </motion.div>
  );
}

interface SocialLoginProps {
  onGoogleClick?: () => void;
  onMicrosoftClick?: () => void;
  onGitHubClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SocialLoginSection({
  onGoogleClick,
  onMicrosoftClick,
  onGitHubClick,
  disabled = false,
  className
}: SocialLoginProps) {
  const providers = [
    {
      name: "Google",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      onClick: onGoogleClick,
    },
    {
      name: "Microsoft",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12.5 0v12.5h-12.5V0H12.5zm0 12.5V25h-12.5V12.5H0v12.5h12.5v-12.5H12.5zm12.5-12.5v12.5h-12.5V0h12.5zm0 12.5v12.5H12.5V12.5h12.5z"/>
        </svg>
      ),
      onClick: onMicrosoftClick,
    },
    {
      name: "GitHub",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      onClick: onGitHubClick,
    },
  ].filter(p => p.onClick);

  if (providers.length === 0) return null;

  return (
    <motion.div
      className={cn("grid grid-cols-2 gap-3", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      {providers.map((provider) => (
        <motion.button
          key={provider.name}
          type="button"
          onClick={provider.onClick}
          disabled={disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={`Continue with ${provider.name}`}
        >
          {provider.icon}
          <span className="hidden sm:inline">{provider.name}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

export function AuthTitle({
  title,
  subtitle,
  className
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("text-center mb-10", className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
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
