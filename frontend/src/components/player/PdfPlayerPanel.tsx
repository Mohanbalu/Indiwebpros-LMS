import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PdfPlayerPanelProps {
  pdfUrl: string;
  initialPage: number;
  onProgress: (pageNumber: number, totalPages: number) => void;
  completed: boolean;
}

export function PdfPlayerPanel({
  pdfUrl,
  initialPage,
  onProgress,
  completed,
}: PdfPlayerPanelProps) {
  // Default total pages to 10 for tracking if not specified, or allow customization
  const [totalPages, setTotalPages] = useState(10);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);

  useEffect(() => {
    setCurrentPage(initialPage || 1);
  }, [initialPage, pdfUrl]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    onProgress(newPage, totalPages);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-md">
      {/* PDF Viewport Frame */}
      <div className="flex-1 min-h-[450px] bg-zinc-950 relative">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#page=${currentPage}`}
            title="Lesson PDF Viewer"
            className="w-full h-full border-none bg-zinc-900"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-400 text-center">
            <FileText className="h-12 w-12 mb-3 animate-pulse" />
            <p className="text-xs font-bold">No PDF resource available</p>
          </div>
        )}
      </div>

      {/* PDF Reading Controls */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-800/50 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-800/50 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Sync Status / Celebration */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">Total pages:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={totalPages}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 10;
                setTotalPages(val);
                if (currentPage > val) {
                  setCurrentPage(val);
                  onProgress(val, val);
                }
              }}
              className="w-12 text-center text-xs py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            />
          </div>

          {completed ? (
            <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Fully Read
            </span>
          ) : (
            <Button
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="text-[10px]"
            >
              Mark PDF Completed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
