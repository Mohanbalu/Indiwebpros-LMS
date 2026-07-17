import { motion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps extends MotionProps {
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedBackground({ className, children, ...props }: AnimatedBackgroundProps) {
  return (
    <motion.div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      initial="hidden"
      animate="visible"
      {...props}
    >
      <motion.div
        className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      {children}
    </motion.div>
  );
}

interface FloatingIconProps {
  icon: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "blue" | "purple" | "indigo" | "emerald";
  animate?: boolean;
}

export function FloatingIcon({ icon, className, delay = 0, variant = "blue", animate = true }: FloatingIconProps) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/5 dark:border-purple-500/10",
    indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/5 dark:border-indigo-500/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/10",
  };

  if (!animate) {
    return (
      <div className={cn("p-2.5 rounded-xl border shadow-lg", colors[variant], className)}>
        {icon}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("p-2.5 rounded-xl border shadow-lg", colors[variant], className)}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.05 }}
    >
      {icon}
    </motion.div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, delay = 0.1 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
