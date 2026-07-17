import { X, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionStatus = "not-visited" | "not-answered" | "answered" | "marked" | "answered-marked";

interface QuestionPaletteProps {
  total: number;
  currentIndex: number;
  statuses: QuestionStatus[];
  onSelect: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STYLES: Record<QuestionStatus, string> = {
  "not-visited": "bg-zinc-800 text-zinc-500 border-zinc-700",
  "not-answered": "bg-red-500/15 text-red-500 border-red-500/30",
  "answered": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "marked": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "answered-marked": "bg-purple-500/15 text-purple-500 border-purple-500/30",
};

export function QuestionPalette({
  total,
  currentIndex,
  statuses,
  onSelect,
  isOpen,
  onClose,
}: QuestionPaletteProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4",
          "lg:block",
          isOpen
            ? "fixed inset-y-20 right-4 z-50 w-72 shadow-2xl lg:relative lg:inset-auto lg:z-auto lg:w-full lg:shadow-none"
            : "hidden lg:block"
        )}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <Grid3X3 className="h-3.5 w-3.5" />
            Question Palette
          </h4>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-zinc-800 text-zinc-500"
            aria-label="Close palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(i);
                onClose();
              }}
              className={cn(
                "h-9 w-full rounded-lg text-xs font-bold border transition-all",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                STATUS_STYLES[statuses[i] || "not-visited"],
                i === currentIndex && "ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900"
              )}
              aria-label={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
          {([
            ["answered", "Answered", "bg-emerald-500"],
            ["not-answered", "Not Answered", "bg-red-500"],
            ["marked", "Marked for Review", "bg-amber-500"],
            ["not-visited", "Not Visited", "bg-zinc-600"],
          ] as const).map(([status, label, color]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
              <span className="text-[10px] font-bold text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
