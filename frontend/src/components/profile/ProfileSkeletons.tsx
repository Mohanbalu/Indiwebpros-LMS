import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden select-none">
      <Skeleton className="h-44 w-full bg-zinc-150 dark:bg-zinc-800" />
      <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-5 -mt-10">
        <Skeleton className="h-28 w-28 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 shrink-0" />
        <div className="flex-1 text-center md:text-left space-y-2 mt-4 md:mt-0">
          <Skeleton className="h-6 w-44 bg-zinc-200 dark:bg-zinc-850 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-32 bg-zinc-150 dark:bg-zinc-800 mx-auto md:mx-0" />
        </div>
      </div>
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Skeleton className="h-4 w-16 bg-zinc-150 dark:bg-zinc-800" />
          <Skeleton className="h-8 w-24 bg-zinc-200 dark:bg-zinc-850" />
        </div>
      ))}
    </div>
  );
}

export function ProfileListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex gap-4">
          <Skeleton className="h-20 w-32 rounded-xl bg-zinc-150 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-850" />
            <Skeleton className="h-3 w-1/3 bg-zinc-150 dark:bg-zinc-800" />
            <Skeleton className="h-2 w-1/4 rounded-full bg-zinc-150 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
