import { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ type = "info", title, children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "flex p-4 rounded-lg border text-sm items-start gap-3",
        {
          "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400":
            type === "info",
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400":
            type === "success",
          "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400":
            type === "warning",
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400":
            type === "error",
        },
        className
      )}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">
        {type === "info" && <Info className="h-5 w-5 text-current" />}
        {type === "success" && <CheckCircle className="h-5 w-5 text-current" />}
        {type === "warning" && <AlertTriangle className="h-5 w-5 text-current" />}
        {type === "error" && <AlertCircle className="h-5 w-5 text-current" />}
      </div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 text-current">{title}</h5>}
        <div className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm">{children}</div>
      </div>
    </div>
  );
}
