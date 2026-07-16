import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
}

export function Badge({ className, variant = "primary", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none",
        {
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400": variant === "primary",
          "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300": variant === "secondary",
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400": variant === "success",
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400": variant === "danger",
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}
