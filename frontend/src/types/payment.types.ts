// ============================================================
// Payment Module — Frontend TypeScript Types
// ============================================================

export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIAL_REFUND";
export type PaymentProvider = "RAZORPAY" | "MOCK" | "STRIPE" | "PAYPAL" | "CASHFREE";
export type DiscountType = "PERCENTAGE" | "FIXED";

// ── Coupon ────────────────────────────────────────────────

export interface CouponValidationResult {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
  minimumAmount: number;
  endDate: string;
}

// ── Checkout ──────────────────────────────────────────────

export interface CheckoutSummary {
  basePrice: number;
  couponDiscount: number;
  gst: number;
  finalAmount: number;
  currency: string;
  couponCode?: string;
  couponData?: CouponValidationResult;
}

// ── Payment Record ────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  courseId: string;
  provider: PaymentProvider;
  transactionId: string | null;
  amount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: { url: string } | null;
    instructor: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  couponUsages?: Array<{
    coupon: {
      code: string;
      discountType: DiscountType;
      discountValue: number;
    };
  }>;
}

// ── Payment History ───────────────────────────────────────

export interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Invoice ───────────────────────────────────────────────

export interface InvoiceData {
  invoiceNumber: string;
  paymentId: string;
  transactionId: string | null;
  razorpayPaymentId: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  amount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  currency: string;
  paymentMethod: string | null;
  couponCode: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  company: {
    name: string;
    email: string;
    website: string;
    gstin: string;
    address: string;
  };
}

// ── Razorpay Checkout Response ────────────────────────────

export interface RazorpayCallbackResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ── Create Order Response ─────────────────────────────────

export interface CreateOrderResponse {
  success: boolean;
  payment: {
    id: string;
    courseId: string;
    amount: number;
    discount: number;
    tax: number;
    finalAmount: number;
    currency: string;
    status: PaymentStatus;
    metadata?: {
      razorpayOrderId?: string;
      razorpayKeyId?: string;
    };
  };
  approvalUrl?: string;
  isFree: boolean;
}

// ── Verify Payment ────────────────────────────────────────

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
    status: PaymentStatus;
    transactionId: string;
  };
}
