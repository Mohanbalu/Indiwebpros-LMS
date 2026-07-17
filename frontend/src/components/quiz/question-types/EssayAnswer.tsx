import { cn } from "@/lib/utils";

interface EssayAnswerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function EssayAnswer({ value, onChange, disabled }: EssayAnswerProps) {
  const charCount = value.length;
  const maxChars = 5000;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxChars) {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        placeholder="Write your detailed answer here..."
        rows={6}
        className={cn(
          "w-full rounded-xl border border-zinc-800 bg-zinc-850 px-4 py-3 text-sm font-semibold text-zinc-200",
          "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 resize-y min-h-[120px]",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-label="Essay answer input"
      />
      <p className="text-[10px] text-zinc-600 text-right">
        {charCount} / {maxChars} characters
      </p>
    </div>
  );
}
