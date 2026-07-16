import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <input
            id={id}
            type="checkbox"
            ref={ref}
            className={cn(
              "h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus:ring-blue-500",
              {
                "border-red-500 dark:border-red-500": error,
              },
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 select-none cursor-pointer"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium pl-6">{error}</p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
