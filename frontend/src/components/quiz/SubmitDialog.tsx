import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface SubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answered: number;
  skipped: number;
  marked: number;
  total: number;
  isSubmitting: boolean;
}

export function SubmitDialog({
  isOpen,
  onClose,
  onConfirm,
  answered,
  skipped,
  marked,
  total,
  isSubmitting,
}: SubmitDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Quiz"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm Submit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-500">
            Are you sure you want to submit? You cannot change your answers after submission.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Summary</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/50">
              <span className="text-[11px] font-bold text-zinc-400">Answered</span>
              <span className="text-xs font-black text-emerald-500">{answered}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/50">
              <span className="text-[11px] font-bold text-zinc-400">Skipped</span>
              <span className="text-xs font-black text-red-500">{skipped}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/50">
              <span className="text-[11px] font-bold text-zinc-400">Marked</span>
              <span className="text-xs font-black text-amber-500">{marked}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/50">
              <span className="text-[11px] font-bold text-zinc-400">Total</span>
              <span className="text-xs font-black text-zinc-200">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
