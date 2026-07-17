import { cn } from "@/lib/utils";
import type { QuizOption } from "@/types/quiz.types";

interface MCQSingleProps {
  options: QuizOption[];
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function MCQSingle({ options, selectedOptionId, onSelect, disabled }: MCQSingleProps) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Multiple choice options">
      {options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;
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
              type="radio"
              name={`mcq-single-${options[0]?.id}`}
              checked={isSelected}
              onChange={() => !disabled && onSelect(option.id)}
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
              {letter}
            </span>
            <span className="text-xs font-semibold text-zinc-200">{option.text}</span>
            {isSelected && (
              <span className="ml-auto flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </label>
        );
      })}
    </div>
  );
}
