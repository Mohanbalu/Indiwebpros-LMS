import { Spinner } from "../ui/Spinner";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 select-none">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Loading IndiWebPros...</p>
    </div>
  );
}
