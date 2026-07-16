import { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[300px]",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-4">
        {icon || <Info className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
