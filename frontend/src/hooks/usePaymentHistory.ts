import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";

export function usePaymentHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["payment-history", page, limit],
    queryFn: () => paymentService.getPaymentHistory(page, limit),
    staleTime: 30_000,
  });
}

export function useInvoice(paymentId: string | null) {
  return useQuery({
    queryKey: ["invoice", paymentId],
    queryFn: () => paymentService.getInvoice(paymentId!),
    enabled: !!paymentId,
    staleTime: 5 * 60_000,
  });
}
