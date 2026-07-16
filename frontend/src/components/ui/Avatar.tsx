import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 select-none items-center justify-center font-medium border border-zinc-200 dark:border-zinc-800",
        {
          "h-8 w-8 text-xs": size === "sm",
          "h-10 w-10 text-sm": size === "md",
          "h-12 w-12 text-base": size === "lg",
        },
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || fallback}
          className="aspect-square h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <span className="text-zinc-600 dark:text-zinc-300 uppercase">{fallback.slice(0, 2)}</span>
    </div>
  );
}
