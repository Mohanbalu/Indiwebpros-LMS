import { vi } from "vitest";

// Razorpay SDK Mock
export const mockRazorpaySDK = {
  orders: {
    create: vi
      .fn()
      .mockImplementation(async (data: { amount: number; currency: string; receipt: string }) => {
        return {
          id: `order_${Math.random().toString(36).substring(2, 15)}`,
          entity: "order",
          amount: data.amount,
          amount_paid: 0,
          amount_due: data.amount,
          currency: data.currency,
          receipt: data.receipt,
          status: "created",
          attempts: 0,
          notes: [],
          created_at: Math.floor(Date.now() / 1000),
        };
      }),
    fetch: vi.fn().mockImplementation(async (orderId: string) => {
      return {
        id: orderId,
        entity: "order",
        amount: 500000,
        amount_paid: 500000,
        amount_due: 0,
        currency: "INR",
        receipt: "receipt_123",
        status: "paid",
        attempts: 1,
        notes: [],
        created_at: Math.floor(Date.now() / 1000),
      };
    }),
  },
  payments: {
    fetch: vi.fn().mockImplementation(async (paymentId: string) => {
      return {
        id: paymentId,
        entity: "payment",
        amount: 500000,
        currency: "INR",
        status: "captured",
        order_id: "order_mock123",
        invoice_id: null,
        international: false,
        method: "card",
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: "LMS Course Purchase",
        card_id: "card_mock123",
        bank: null,
        wallet: null,
        vpa: null,
        email: "student@example.com",
        contact: "+919999999999",
        error_code: null,
        error_description: null,
        created_at: Math.floor(Date.now() / 1000),
      };
    }),
  },
};

// Razorpay Provider mock methods
export const mockRazorpayProvider = {
  initialize: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined),
  health: vi.fn().mockResolvedValue({
    status: "healthy",
    latency: 12,
    message: "Razorpay initialized",
    timestamp: new Date().toISOString(),
  }),
  createOrder: vi.fn().mockImplementation(async (orderId: string, amountINR: number) => {
    return {
      id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
      amount: amountINR * 100,
      currency: "INR",
      receipt: orderId,
      status: "created",
    };
  }),
  verifyPayment: vi
    .fn()
    .mockImplementation(async (orderId: string, paymentId: string, signature: string) => {
      return true; // Return valid verification
    }),
  verifyWebhookSignature: vi
    .fn()
    .mockImplementation((payload: string, signature: string, secret: string) => {
      return true;
    }),
};
export const RazorpayUtility = {
  validateWebhookSignature: vi.fn().mockReturnValue(true),
};
