import { Spinner } from "./Spinner";

export interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/75 backdrop-blur-[2px] dark:bg-zinc-950/75 select-none">
      <Spinner size="lg" />
      {message && <p className="mt-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{message}</p>}
    </div>
  );
}
