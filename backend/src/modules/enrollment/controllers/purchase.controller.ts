import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { enrollmentService } from "../services/enrollment.service";
import { couponService } from "../services/coupon.service";
import { prisma } from "@/database/client";
import { ValidationError, ForbiddenError } from "@/errors/custom-errors";
import {
  purchaseCourseSchema,
  mockPaymentCallbackSchema,
  razorpayVerifySchema,
  razorpayWebhookSchema,
  refundPaymentSchema,
  validateCouponSchema,
  createCouponSchema,
} from "../validators/enrollment.validator";
import { PaymentProvider, PaymentStatus } from "@/generated/client";
import { RazorpayProvider } from "@/services/payment/providers/razorpay.provider";
import { paymentConfigSchema } from "@/services/shared/config.schema";
import {
  PaymentVerificationException,
  WebhookVerificationException,
  DuplicatePaymentException,
} from "../errors/enrollment-exceptions";
import { ServiceContainer } from "@/services/shared/service-container";

// ==========================================
// PurchaseController
// Handles all payment & enrollment endpoints
// ==========================================

export class PurchaseController {
  // ── Legacy / Mock ──────────────────────────────────────────────

  static async createPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = purchaseCourseSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid purchase request data", parsed.error.errors);

      const userId = req.user!.userId;
      const provider = parsed.data.provider === "MOCK"
        ? PaymentProvider.MOCK
        : PaymentProvider.RAZORPAY;

      const result = await paymentService.initializePurchase(
        userId,
        parsed.data.courseId,
        parsed.data.couponCode,
        provider
      );

      res.status(201).json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async mockPaymentCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = mockPaymentCallbackSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid callback data", parsed.error.errors);

      const userId = req.user!.userId;
      const payment = await enrollmentService.verifyPurchase(
        parsed.data.paymentId,
        { status: parsed.data.status, paymentMethod: parsed.data.paymentMethod },
        userId
      );

      res.json({ success: true, data: payment });
    } catch (e) { next(e); }
  }

  // ── Razorpay Flow ─────────────────────────────────────────────

  /**
   * POST /payments/razorpay/create-order
   * Creates a Razorpay order and returns orderId + keyId for frontend checkout widget
   */
  static async createRazorpayOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = purchaseCourseSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid purchase request data", parsed.error.errors);

      const userId = req.user!.userId;
      const result = await paymentService.initializePurchase(
        userId,
        parsed.data.courseId,
        parsed.data.couponCode,
        PaymentProvider.RAZORPAY
      );

      res.status(201).json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  /**
   * POST /payments/razorpay/verify
   * Verifies Razorpay payment signature on the backend after client-side checkout.
   * Client sends: razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId (our DB id)
   */
  static async verifyRazorpayPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = razorpayVerifySchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid Razorpay verification data", parsed.error.errors);

      const userId = req.user!.userId;
      const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

      // Check for duplicate processing
      const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!existing) throw new ValidationError("Payment record not found");
      if (existing.status === PaymentStatus.SUCCESS) throw new DuplicatePaymentException();

      const payment = await enrollmentService.verifyPurchase(
        paymentId,
        {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        userId
      );

      res.json({ success: true, data: payment });
    } catch (e) { next(e); }
  }

  /**
   * POST /payments/razorpay/webhook
   * Razorpay signed webhook handler — validates signature from raw body
   * Must be mounted BEFORE express.json() middleware (uses req.rawBody)
   */
  static async razorpayWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const rawBody: string = (req as any).rawBody;
      const signature = req.headers["x-razorpay-signature"] as string | undefined;

      if (!rawBody || !signature) {
        throw new WebhookVerificationException("Missing webhook body or signature header");
      }

      const config = paymentConfigSchema.parse({});
      const rzp = new RazorpayProvider(config);
      const isValid = rzp.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        throw new WebhookVerificationException("Webhook HMAC signature mismatch");
      }

      // Parse the JSON event
      let event: any;
      try {
        event = JSON.parse(rawBody);
      } catch {
        throw new WebhookVerificationException("Webhook body is not valid JSON");
      }

      const parsed = razorpayWebhookSchema.safeParse(event);
      if (!parsed.success) {
        // Unknown event — acknowledge but don't process
        ServiceContainer.logger.info(`[RazorpayWebhook] Unknown event type, ignoring: ${event?.event}`);
        return res.status(200).json({ received: true });
      }

      const { event: eventType, payload: webhookPayload } = parsed.data;
      const rzpPayment = webhookPayload?.payment?.entity;
      const rzpOrderId = rzpPayment?.order_id;
      const rzpPaymentId = rzpPayment?.id;

      ServiceContainer.logger.info(`[RazorpayWebhook] Event received: ${eventType} | Order: ${rzpOrderId} | Payment: ${rzpPaymentId}`);

      switch (eventType) {
        case "payment.captured": {
          // Find our payment record by the Razorpay order ID stored in transactionId
          const payment = await prisma.payment.findFirst({
            where: { transactionId: rzpOrderId, status: { not: PaymentStatus.SUCCESS } },
          });

          if (payment) {
            await enrollmentService.verifyPurchase(
              payment.id,
              {
                razorpay_order_id: rzpOrderId,
                razorpay_payment_id: rzpPaymentId,
                razorpay_signature: "WEBHOOK_VERIFIED", // Already verified above
                _webhookVerified: true,
              },
              payment.userId
            ).catch((err) => {
              ServiceContainer.logger.error(`[RazorpayWebhook] verifyPurchase failed: ${err}`);
            });
          }
          break;
        }

        case "payment.failed": {
          const payment = await prisma.payment.findFirst({
            where: { transactionId: rzpOrderId, status: { not: PaymentStatus.FAILED } },
          });

          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.FAILED,
                metadata: { razorpayPaymentId: rzpPaymentId, failedAt: new Date().toISOString() },
              },
            });
            ServiceContainer.logger.info(`[RazorpayWebhook] Payment marked FAILED for order: ${rzpOrderId}`);
          }
          break;
        }

        case "refund.created":
        case "refund.processed": {
          ServiceContainer.logger.info(`[RazorpayWebhook] Refund event received: ${eventType}`);
          break;
        }

        default:
          ServiceContainer.logger.info(`[RazorpayWebhook] Unhandled event: ${eventType}`);
      }

      // Always acknowledge immediately to avoid Razorpay retries
      res.status(200).json({ received: true });
    } catch (e) { next(e); }
  }

  // ── Generic / Admin ────────────────────────────────────────────

  /**
   * POST /payments/verify (legacy generic verify endpoint)
   */
  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { paymentId, ...rest } = req.body;

      if (!paymentId) throw new ValidationError("paymentId is required");

      const payment = await enrollmentService.verifyPurchase(paymentId, rest, userId);
      res.json({ success: true, data: payment });
    } catch (e) { next(e); }
  }

  static async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = refundPaymentSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid refund data", parsed.error.errors);

      const adminUserId = req.user!.userId;
      const payment = await enrollmentService.refundPurchase(
        parsed.data.paymentId,
        parsed.data.amount,
        adminUserId
      );

      res.json({ success: true, data: payment });
    } catch (e) { next(e); }
  }

  static async getPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const payment = await paymentService.getPaymentById(paymentId);

      // Prevent IDOR
      if (req.user!.role === "Student" && payment.userId !== req.user!.userId) {
        throw new ForbiddenError("You cannot view details of other users' payments");
      }

      res.json({ success: true, data: payment });
    } catch (e) { next(e); }
  }

  static async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

      const result = await paymentService.getPaymentHistory(userId, page, limit);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const userId = req.user!.userId;

      const invoice = await paymentService.getInvoiceData(paymentId, userId);
      res.json({ success: true, data: invoice });
    } catch (e) { next(e); }
  }

  static async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = validateCouponSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid coupon validation request", parsed.error.errors);

      const userId = req.user!.userId;
      const course = await prisma?.course.findUnique({ where: { id: parsed.data.courseId } });
      if (!course) throw new ValidationError("Course not found");

      const coupon = await couponService.validateCoupon(parsed.data.code, userId, course.price.toNumber());
      res.json({ success: true, data: coupon });
    } catch (e) { next(e); }
  }

  static async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCouponSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid coupon configurations", parsed.error.errors);

      const adminUserId = req.user!.userId;
      const coupon = await couponService.createCoupon(parsed.data, adminUserId);

      res.status(201).json({ success: true, data: coupon });
    } catch (e) { next(e); }
  }

  static async listCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await couponService.listCoupons();
      res.json({ success: true, data: coupons });
    } catch (e) { next(e); }
  }
}
