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
  refundPaymentSchema,
  validateCouponSchema,
  createCouponSchema,
} from "../validators/enrollment.validator";
import { PaymentProvider, PaymentStatus } from "@/generated/client";
import { DuplicatePaymentException } from "../errors/enrollment-exceptions";

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
