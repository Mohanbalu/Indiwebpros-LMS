import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizOption } from "@/types/quiz.types";

interface TrueFalseProps {
  options: QuizOption[];
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function TrueFalse({ options, selectedOptionId, onSelect, disabled }: TrueFalseProps) {
  return (
    <div className="flex gap-4" role="radiogroup" aria-label="True or False">
      {options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const isTrue = option.text.trim().toLowerCase() === "true";

        return (
          <label
            key={option.id}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all",
              isSelected
                ? isTrue
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                  : "bg-red-500/10 border-red-500/50 text-red-500"
                : "bg-zinc-850 hover:bg-zinc-800 border-zinc-800 text-zinc-400",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <input
              type="radio"
              name={`tf-${options[0]?.id}`}
              checked={isSelected}
              onChange={() => !disabled && onSelect(option.id)}
              disabled={disabled}
              className="sr-only"
              aria-label={option.text}
            />
            {isTrue ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm font-bold">{option.text}</span>
          </label>
        );
      })}
    </div>
  );
}
