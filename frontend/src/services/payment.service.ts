import { api } from "./api";
import type {
  CreateOrderResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
  PaymentHistoryResponse,
  InvoiceData,
  CouponValidationResult,
} from "@/types/payment.types";

export type { CreateOrderResponse, VerifyPaymentPayload, VerifyPaymentResponse };

export const paymentService = {
  /** Create a Razorpay order for a course */
  createRazorpayOrder: async (courseId: string, couponCode?: string): Promise<CreateOrderResponse> => {
    const res = await api.post("/payments/razorpay/create-order", { courseId, couponCode });
    return res.data;
  },

  /** Verify Razorpay payment after checkout widget callback */
  verifyRazorpayPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
    const res = await api.post("/payments/razorpay/verify", payload);
    return res.data;
  },

  /** Enroll in a free course directly */
  initializeFreeEnrollment: async (courseId: string, couponCode?: string): Promise<CreateOrderResponse> => {
    const res = await api.post("/purchases", { courseId, couponCode, provider: "RAZORPAY" });
    return res.data;
  },

  /** Get paginated payment history for the logged-in student */
  getPaymentHistory: async (page = 1, limit = 20): Promise<PaymentHistoryResponse> => {
    const res = await api.get(`/payments/history?page=${page}&limit=${limit}`);
    return { success: true, ...res.data };
  },

  /** Get invoice data for a specific payment */
  getInvoice: async (paymentId: string): Promise<{ success: boolean; data: InvoiceData }> => {
    const res = await api.get(`/payments/invoice/${paymentId}`);
    return res.data;
  },

  /** Validate a coupon code for a course */
  validateCoupon: async (
    code: string,
    courseId: string
  ): Promise<{ success: boolean; data: CouponValidationResult }> => {
    const res = await api.post("/payments/coupons/validate", { code, courseId });
    return res.data;
  },
};
