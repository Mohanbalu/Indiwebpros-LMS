import { useState } from "react";
import { Tag, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CouponValidationResult } from "@/types/payment.types";

interface CouponInputProps {
  courseId: string;
  onValidate: (params: { code: string; courseId: string }) => Promise<{ data: CouponValidationResult }>;
  onRemove: () => void;
  couponData: CouponValidationResult | null;
  couponError: string;
  isLoading: boolean;
}

export function CouponInput({
  courseId,
  onValidate,
  onRemove,
  couponData,
  couponError,
  isLoading,
}: CouponInputProps) {
  const [code, setCode] = useState("");

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    try {
      await onValidate({ code: trimmed, courseId });
    } catch {
      // error handled by hook
    }
  };

  const handleRemove = () => {
    setCode("");
    onRemove();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
        Coupon Code
      </label>

      {couponData ? (
        // Applied coupon display
        <AnimatePresence mode="wait">
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <div>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                  {couponData.code}
                </span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
                  {couponData.discountType === "PERCENTAGE"
                    ? `${couponData.discountValue}% off applied`
                    : `₹${couponData.discountValue} off applied`}
                  {" — saving ₹"}
                  {couponData.discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-500 transition-colors"
              aria-label="Remove coupon"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </AnimatePresence>
      ) : (
        // Coupon input
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="ENTER CODE"
              className="w-full pl-9 pr-4 py-2.5 text-sm font-mono font-bold tracking-widest rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              maxLength={30}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!code.trim() || isLoading}
            className="px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {couponError && !couponData && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs font-semibold text-rose-500"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {couponError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
