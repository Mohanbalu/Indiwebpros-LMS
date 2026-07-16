import { RefreshCw, AlertOctagon } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading content. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 mb-4">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" className="flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
