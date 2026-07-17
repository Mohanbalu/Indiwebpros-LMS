import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { QuizOption } from "@/types/quiz.types";

interface MCQMultipleProps {
  options: QuizOption[];
  selectedOptionIds: string[];
  onToggle: (optionId: string) => void;
  disabled?: boolean;
}

export function MCQMultiple({ options, selectedOptionIds, onToggle, disabled }: MCQMultipleProps) {
  return (
    <div className="space-y-2" role="group" aria-label="Select all that apply">
      <p className="text-[11px] text-zinc-500 font-semibold mb-3">Select all that apply</p>
      {options.map((option, index) => {
        const isSelected = selectedOptionIds.includes(option.id);
        const letter = String.fromCharCode(65 + index);

        return (
          <label
            key={option.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
              isSelected
                ? "bg-blue-500/10 border-blue-500/50 dark:bg-blue-500/10 dark:border-blue-500/40"
                : "bg-zinc-850 hover:bg-zinc-800 border-zinc-800 dark:border-zinc-800",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => !disabled && onToggle(option.id)}
              disabled={disabled}
              className="sr-only"
              aria-label={option.text}
            />
            <span
              className={cn(
                "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold border transition",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {isSelected ? <Check className="h-3.5 w-3.5" /> : letter}
            </span>
            <span className="text-xs font-semibold text-zinc-200">{option.text}</span>
          </label>
        );
      })}
    </div>
  );
}
