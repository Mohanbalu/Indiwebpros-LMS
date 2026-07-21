import type { CouponValidationResult } from "@/types/payment.types";
import { Tag } from "lucide-react";

interface OrderSummaryCardProps {
  basePrice: number;
  couponData: CouponValidationResult | null;
  gstRate?: number; // e.g. 0.18 for 18%
  currency?: string;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function OrderSummaryCard({
  basePrice,
  couponData,
  gstRate = 0,
  currency = "INR",
}: OrderSummaryCardProps) {
  const discount = couponData?.discountAmount ?? 0;
  const priceAfterDiscount = Math.max(0, basePrice - discount);
  const gstAmount = Math.round(priceAfterDiscount * gstRate * 100) / 100;
  const finalAmount = priceAfterDiscount + gstAmount;

  const currencySymbol = currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-3 text-sm">
      {/* Base Price */}
      <div className="flex justify-between items-center">
        <span className="text-zinc-500 dark:text-zinc-400">Course Price</span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {currencySymbol}{formatINR(basePrice)}
        </span>
      </div>

      {/* Coupon Discount */}
      {discount > 0 && couponData && (
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Tag className="h-3.5 w-3.5" />
            Coupon ({couponData.code})
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            -{currencySymbol}{formatINR(discount)}
          </span>
        </div>
      )}

      {/* GST */}
      {gstRate > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 dark:text-zinc-400">GST ({Math.round(gstRate * 100)}%)</span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {currencySymbol}{formatINR(gstAmount)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-zinc-200 dark:border-zinc-700/60 pt-3 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-base font-black text-zinc-900 dark:text-zinc-50">Total</span>
          <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {currencySymbol}{formatINR(finalAmount)}
          </span>
        </div>
        {discount > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right mt-1 font-semibold">
            You save {currencySymbol}{formatINR(discount)}!
          </p>
        )}
      </div>
    </div>
  );
}

export function computeFinalAmount(
  basePrice: number,
  couponData: CouponValidationResult | null,
  gstRate = 0
): number {
  const discount = couponData?.discountAmount ?? 0;
  const priceAfterDiscount = Math.max(0, basePrice - discount);
  const gstAmount = Math.round(priceAfterDiscount * gstRate * 100) / 100;
  return priceAfterDiscount + gstAmount;
}
