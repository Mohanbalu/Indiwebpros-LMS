import { PaymentStatus } from "@/generated/client";
import { IPaymentProvider, PaymentCreateResult, PaymentVerifyResult } from "../interfaces/payment-provider.interface";
import { RazorpayProvider } from "@/services/payment/providers/razorpay.provider";
import { paymentConfigSchema } from "@/services/shared/config.schema";
import { ServiceContainer } from "@/services/shared/service-container";

// ==========================================
// RazorpayPaymentProvider
// Adapts RazorpayProvider (core REST client)
// to IPaymentProvider (enrollment abstraction)
// ==========================================

export class RazorpayPaymentProvider implements IPaymentProvider {
  private rzp: RazorpayProvider;

  constructor() {
    const config = paymentConfigSchema.parse({});
    this.rzp = new RazorpayProvider(config);
  }

  /**
   * Creates a Razorpay order and returns a PaymentCreateResult.
   * The approvalUrl is not needed in the redirect sense — instead we return the
   * orderId and keyId so the frontend can invoke the Razorpay checkout widget.
   */
  async createPayment(payment: {
    id: string;
    finalAmount: number;
    currency: string;
    course: { title: string };
  }): Promise<PaymentCreateResult> {
    const order = await this.rzp.createOrder(
      payment.finalAmount,
      payment.currency || "INR",
      payment.id,
      { course_title: payment.course.title, internal_payment_id: payment.id }
    ) as any;

    const config = paymentConfigSchema.parse({});

    return {
      providerPaymentId: order.id,          // Razorpay order ID (order_xxx)
      status: PaymentStatus.PENDING,
      approvalUrl: undefined,               // No redirect — Razorpay uses JS checkout widget
      metadata: {
        razorpayOrderId: order.id,
        razorpayKeyId: config.razorpayKeyId,
        amount: order.amount,              // Amount in paise
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        info: "Razorpay Order Created",
      },
    };
  }

  /**
   * Verifies the Razorpay payment signature from the frontend callback.
   * payload should include: razorpay_order_id, razorpay_payment_id, razorpay_signature
   */
  async verifyPayment(paymentId: string, payload: any): Promise<PaymentVerifyResult> {
    // paymentId here is the internal payment record ID (UUID), not the Razorpay payment ID
    // The actual Razorpay IDs are in payload
    const razorpayOrderId = payload?.razorpay_order_id || payload?.orderId;
    const razorpayPaymentId = payload?.razorpay_payment_id || payload?.paymentId;
    const razorpaySignature = payload?.razorpay_signature || payload?.signature;

    // If no signature is provided, this is not a proper Razorpay callback
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      ServiceContainer.logger.warn(
        `[RazorpayPaymentProvider] Missing required fields for signature verification: ${JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature })}`
      );
      return {
        success: false,
        transactionId: razorpayPaymentId || paymentId,
        status: PaymentStatus.FAILED,
        paymentMethod: "RAZORPAY",
        metadata: { error: "Missing required Razorpay signature fields" },
      };
    }

    const isValid = await this.rzp.verifyPayment({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });

    if (!isValid) {
      return {
        success: false,
        transactionId: razorpayPaymentId,
        status: PaymentStatus.FAILED,
        paymentMethod: "RAZORPAY",
        metadata: { error: "Payment signature verification failed" },
      };
    }

    // Optionally fetch payment method from Razorpay
    let paymentMethod = "RAZORPAY";
    try {
      const paymentDetails = await this.rzp.getPayment(razorpayPaymentId) as any;
      paymentMethod = (paymentDetails?.method || "RAZORPAY").toUpperCase();
    } catch (err) {
      ServiceContainer.logger.warn(`[RazorpayPaymentProvider] Could not fetch payment details for method: ${err}`);
    }

    return {
      success: true,
      transactionId: razorpayPaymentId,
      status: PaymentStatus.SUCCESS,
      paymentMethod,
      metadata: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Refund a Razorpay payment.
   * transactionId is the Razorpay payment_id (pay_...)
   */
  async refundPayment(transactionId: string, amount: number): Promise<any> {
    const refund = await this.rzp.refund(transactionId, amount, "Admin refund");
    return {
      success: true,
      refundId: (refund as any).id,
      refundedAmount: amount,
      status: "REFUNDED",
      transactionId,
      metadata: refund,
    };
  }

  /**
   * Cancel (no-op for Razorpay — orders auto-expire).
   */
  async cancelPayment(paymentId: string): Promise<any> {
    await this.rzp.cancel(paymentId);
    return { success: true, status: "CANCELLED", paymentId };
  }

  /**
   * Fetch payment status from Razorpay and translate to PaymentStatus.
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.rzp.getPayment(paymentId) as any;
    switch (payment?.status) {
      case "captured":
        return PaymentStatus.SUCCESS;
      case "failed":
        return PaymentStatus.FAILED;
      case "refunded":
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
