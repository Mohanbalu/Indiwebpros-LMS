import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}

export function Drawer({ isOpen, onClose, title, children, side = "right" }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slideout Panel */}
      <div
        className={cn(
          "fixed inset-y-0 w-full max-w-md bg-white shadow-xl dark:bg-zinc-900 flex flex-col transition-transform transform duration-300 ease-in-out border-zinc-200 dark:border-zinc-800",
          {
            "left-0 border-r": side === "left",
            "right-0 border-l": side === "right",
          }
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <Button variant="ghost" size="sm" className="p-1 h-auto w-auto rounded-md" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1 text-sm text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
}
