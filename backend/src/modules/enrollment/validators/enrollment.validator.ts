import { z } from "zod";
import { AccessType, DiscountType, PaymentProvider } from "@/generated/client";

export const purchaseCourseSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  couponCode: z.string().trim().toUpperCase().optional(),
  provider: z.enum(["RAZORPAY", "MOCK"]).default("RAZORPAY"),
});

export const mockPaymentCallbackSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  status: z.enum(["SUCCESS", "FAILED", "PENDING"]),
  paymentMethod: z.string().default("MOCK_CARD"),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  providerTransactionId: z.string().min(1, "Transaction ID is required"),
  status: z.enum(["SUCCESS", "FAILED"]),
});

// ==========================================
// Razorpay Schemas (Milestone 23)
// ==========================================

/**
 * Schema for Razorpay frontend callback verification.
 * The frontend sends these fields after Razorpay checkout completes.
 */
export const razorpayVerifySchema = z.object({
  paymentId: z.string().uuid("Invalid internal payment record ID"),
  razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required"),
});

/**
 * Schema for Razorpay webhook events (parsed JSON body).
 * Razorpay sends signed events to this endpoint.
 */
export const razorpayWebhookSchema = z.object({
  event: z.enum([
    "payment.captured",
    "payment.failed",
    "payment.authorized",
    "refund.created",
    "refund.processed",
    "order.paid",
  ]),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string().optional(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        status: z.string().optional(),
        method: z.string().optional(),
      }),
    }).optional(),
    refund: z.object({
      entity: z.object({
        id: z.string(),
        payment_id: z.string(),
        amount: z.number().optional(),
        status: z.string().optional(),
      }),
    }).optional(),
  }).optional(),
});

export const adminGrantEnrollmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  courseId: z.string().uuid("Invalid course ID"),
  accessType: z.nativeEnum(AccessType).default(AccessType.LIFETIME),
  durationDays: z.coerce.number().int().min(1).optional(),
});

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase().regex(/^[A-Z0-9_-]+$/, "Code must contain only alphanumeric characters, hyphens, or underscores"),
  description: z.string().trim().max(255).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().positive("Discount value must be positive"),
  maxUsage: z.coerce.number().int().positive().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  minimumAmount: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const validateCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Coupon code is required"),
  courseId: z.string().uuid("Invalid course ID"),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  amount: z.coerce.number().positive().optional(),
});

export type PurchaseCourseInput = z.infer<typeof purchaseCourseSchema>;
export type MockPaymentCallbackInput = z.infer<typeof mockPaymentCallbackSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
export type RazorpayWebhookInput = z.infer<typeof razorpayWebhookSchema>;
export type AdminGrantEnrollmentInput = z.infer<typeof adminGrantEnrollmentSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
