import { api } from "./api";

export interface CreateOrderResponse {
  success: boolean;
  payment: {
    id: string;
    courseId: string;
    amount: number;
    discount: number;
    finalAmount: number;
    currency: string;
    status: string;
  };
  approvalUrl?: string;
  isFree: boolean;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    transactionId: string;
  };
}

export const paymentService = {
  createRazorpayOrder: async (courseId: string, couponCode?: string): Promise<CreateOrderResponse> => {
    const res = await api.post("/payments/razorpay/create-order", { courseId, couponCode });
    return res.data;
  },

  verifyRazorpayPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
    const res = await api.post("/payments/razorpay/verify", payload);
    return res.data;
  },

  initializeFreeEnrollment: async (courseId: string, couponCode?: string): Promise<CreateOrderResponse> => {
    const res = await api.post("/purchases", { courseId, couponCode, provider: "RAZORPAY" });
    return res.data;
  },
};
