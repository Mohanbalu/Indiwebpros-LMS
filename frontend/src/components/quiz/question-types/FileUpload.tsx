import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function FileUpload({ value, onChange, disabled }: FileUploadProps) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500 font-semibold">
        Describe your file submission or provide a link to your work.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Provide a description of your submission or paste a link to your file..."
        rows={4}
        className={cn(
          "w-full rounded-xl border border-zinc-800 bg-zinc-850 px-4 py-3 text-sm font-semibold text-zinc-200",
          "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 resize-y",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-label="File upload description"
      />
      <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50">
        <Upload className="h-4 w-4 text-zinc-500" />
        <span className="text-[11px] text-zinc-500 font-semibold">
          File upload support — describe your submission above
        </span>
      </div>
    </div>
  );
}
