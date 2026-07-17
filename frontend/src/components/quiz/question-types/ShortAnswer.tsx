import { cn } from "@/lib/utils";

interface ShortAnswerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ShortAnswer({ value, onChange, disabled }: ShortAnswerProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer here..."
        className={cn(
          "w-full rounded-xl border border-zinc-800 bg-zinc-850 px-4 py-3 text-sm font-semibold text-zinc-200",
          "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-label="Short answer input"
      />
    </div>
  );
}
