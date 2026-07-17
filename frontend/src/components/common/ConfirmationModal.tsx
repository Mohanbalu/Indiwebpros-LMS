import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
}: ConfirmationModalProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside target */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDanger 
                ? "bg-rose-500/10 text-rose-500 dark:bg-rose-950/20" 
                : "bg-blue-500/10 text-blue-500 dark:bg-blue-950/20"
            }`}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-zinc-550 dark:text-zinc-450 leading-relaxed font-semibold">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 py-3 text-xs font-bold rounded-xl"
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`flex-1 py-3 text-xs font-bold rounded-xl text-white ${
              isDanger 
                ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800" 
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
