import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import { extractErrorMessage } from "@/types/api.types";
import type { CouponValidationResult, VerifyPaymentPayload } from "@/types/payment.types";

export type PaymentState =
  | "idle"
  | "creating_order"
  | "opening_razorpay"
  | "payment_processing"
  | "payment_success"
  | "payment_failed"
  | "payment_cancelled"
  | "verification_failed";

export function usePayment() {
  const queryClient = useQueryClient();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [couponData, setCouponData] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string>("");

  // ── Create Order ────────────────────────────────────────────

  const createOrderMutation = useMutation({
    mutationFn: ({ courseId, couponCode }: { courseId: string; couponCode?: string }) =>
      paymentService.createRazorpayOrder(courseId, couponCode),
    onMutate: () => {
      setPaymentState("creating_order");
      setErrorMsg("");
    },
    onError: (err) => {
      setPaymentState("payment_failed");
      setErrorMsg(extractErrorMessage(err, "Failed to create payment order"));
    },
  });

  // ── Verify Payment ──────────────────────────────────────────

  const verifyPaymentMutation = useMutation({
    mutationFn: (payload: VerifyPaymentPayload) =>
      paymentService.verifyRazorpayPayment(payload),
    onMutate: () => {
      setPaymentState("payment_processing");
    },
    onSuccess: () => {
      setPaymentState("payment_success");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
    onError: (err) => {
      setPaymentState("verification_failed");
      setErrorMsg(extractErrorMessage(err, "Payment verification failed"));
    },
  });

  // ── Free Enrollment ─────────────────────────────────────────

  const enrollFreeMutation = useMutation({
    mutationFn: ({ courseId, couponCode }: { courseId: string; couponCode?: string }) =>
      paymentService.initializeFreeEnrollment(courseId, couponCode),
    onMutate: () => {
      setPaymentState("payment_processing");
      setErrorMsg("");
    },
    onSuccess: () => {
      setPaymentState("payment_success");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      setPaymentState("payment_failed");
      setErrorMsg(extractErrorMessage(err, "Direct enrollment failed"));
    },
  });

  // ── Coupon Validation ───────────────────────────────────────

  const validateCouponMutation = useMutation({
    mutationFn: ({ code, courseId }: { code: string; courseId: string }) =>
      paymentService.validateCoupon(code, courseId),
    onMutate: () => {
      setCouponError("");
    },
    onSuccess: (res) => {
      setCouponData(res.data);
      setCouponError("");
    },
    onError: (err) => {
      setCouponData(null);
      setCouponError(extractErrorMessage(err, "Invalid coupon code"));
    },
  });

  const removeCoupon = () => {
    setCouponData(null);
    setCouponError("");
  };

  return {
    paymentState,
    setPaymentState,
    errorMsg,
    setErrorMsg,
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifying: verifyPaymentMutation.isPending,
    enrollFree: enrollFreeMutation.mutateAsync,
    isEnrollingFree: enrollFreeMutation.isPending,
    // Coupon
    validateCoupon: validateCouponMutation.mutateAsync,
    isValidatingCoupon: validateCouponMutation.isPending,
    couponData,
    couponError,
    removeCoupon,
  };
}
