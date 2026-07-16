import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService, VerifyPaymentPayload } from "@/services/payment.service";

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

  const createOrderMutation = useMutation({
    mutationFn: async ({ courseId, couponCode }: { courseId: string; couponCode?: string }) => {
      setPaymentState("creating_order");
      setErrorMsg("");
      return paymentService.createRazorpayOrder(courseId, couponCode);
    },
    onError: (err: any) => {
      setPaymentState("payment_failed");
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create payment order");
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: VerifyPaymentPayload) => {
      setPaymentState("payment_processing");
      return paymentService.verifyRazorpayPayment(payload);
    },
    onSuccess: () => {
      setPaymentState("payment_success");
      // Invalidate queries to refresh enrollment states
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err: any) => {
      setPaymentState("verification_failed");
      setErrorMsg(err.response?.data?.message || err.message || "Payment verification failed");
    },
  });

  const enrollFreeMutation = useMutation({
    mutationFn: async ({ courseId, couponCode }: { courseId: string; couponCode?: string }) => {
      setPaymentState("payment_processing");
      setErrorMsg("");
      return paymentService.initializeFreeEnrollment(courseId, couponCode);
    },
    onSuccess: () => {
      setPaymentState("payment_success");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err: any) => {
      setPaymentState("payment_failed");
      setErrorMsg(err.response?.data?.message || err.message || "Direct enrollment failed");
    },
  });

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
  };
}
