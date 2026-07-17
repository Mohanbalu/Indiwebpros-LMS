import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService, VerifyPaymentPayload } from "@/services/payment.service";
import { extractErrorMessage } from "@/types/api.types";

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
    },
    onError: (err) => {
      setPaymentState("verification_failed");
      setErrorMsg(extractErrorMessage(err, "Payment verification failed"));
    },
  });

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

  return {
    paymentState,
    setPaymentState,
    errorMsg,
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifying: verifyPaymentMutation.isPending,
    enrollFree: enrollFreeMutation.mutateAsync,
    isEnrollingFree: enrollFreeMutation.isPending,
  };
}
