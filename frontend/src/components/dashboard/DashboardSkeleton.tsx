import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 animate-pulse" role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard...</span>

      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44 bg-zinc-150 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-72 bg-zinc-200 dark:bg-zinc-850" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-xl bg-zinc-150 dark:bg-zinc-800" />
          ))}
        </div>
      </div>

      {/* ABOVE THE FOLD */}
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1">
              <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-zinc-150 dark:bg-zinc-800" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-4 w-28 bg-zinc-150 dark:bg-zinc-800" />
                <Skeleton className="h-8 w-60 bg-zinc-200 dark:bg-zinc-855" />
                <Skeleton className="h-3 w-44 bg-zinc-200 dark:bg-zinc-855 rounded-full" />
              </div>
            </div>
            <div className="flex flex-row lg:flex-row gap-4">
              <Skeleton className="h-16 w-24 rounded-2xl bg-zinc-150/40 dark:bg-zinc-800/40" />
              <Skeleton className="h-16 w-24 rounded-2xl bg-zinc-150/40 dark:bg-zinc-800/40" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-zinc-150 dark:bg-zinc-800" />
                  <Skeleton className="h-9 w-16 bg-zinc-200 dark:bg-zinc-850" />
                </div>
                <Skeleton className="h-12 w-12 rounded-2xl bg-zinc-150 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
            <Skeleton className="h-4 w-40 bg-zinc-150 dark:bg-zinc-800" />
            <div className="mt-4 flex flex-col md:flex-row gap-5">
              <Skeleton className="h-28 w-full md:w-48 rounded-2xl shrink-0 bg-zinc-150 dark:bg-zinc-800" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-855" />
                <Skeleton className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-855" />
                <Skeleton className="h-2 w-full rounded-full bg-zinc-150 dark:bg-zinc-800" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <Skeleton className="h-4 w-32 bg-zinc-150 dark:bg-zinc-800" />
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
                <Skeleton className="w-44 h-28 rounded-xl shrink-0 bg-zinc-150 dark:bg-zinc-800" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-850" />
                  <Skeleton className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-855" />
                  <Skeleton className="h-2 w-full max-w-xs rounded-full bg-zinc-150 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <Skeleton className="h-4 w-28 bg-zinc-150 dark:bg-zinc-850" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-zinc-150 dark:bg-zinc-800" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32 bg-zinc-200 dark:bg-zinc-855" />
                  <Skeleton className="h-3 w-40 bg-zinc-200 dark:bg-zinc-855" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <Skeleton className="h-4 w-24 bg-zinc-150 dark:bg-zinc-850" />
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2].map((i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-zinc-50/40 dark:bg-zinc-955/40 border border-zinc-200 dark:border-zinc-850/50 space-y-2">
                  <Skeleton className="h-9 w-9 rounded-xl bg-zinc-150 dark:bg-zinc-800" />
                  <Skeleton className="h-6 w-10 bg-zinc-200 dark:bg-zinc-850" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
