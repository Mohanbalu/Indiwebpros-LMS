import { prisma } from "@/database/client";
import { Payment, PaymentStatus, PaymentProvider, EnrollmentStatus, AccessType } from "@/generated/client";
import { NotFoundError, ValidationError } from "@/errors/custom-errors";
import {
  EnrollmentAlreadyExistsException,
  PaymentFailedException,
} from "../errors/enrollment-exceptions";
import { IPaymentProvider } from "../interfaces/payment-provider.interface";
import { MockPaymentProvider } from "../providers/mock-payment.provider";
import { RazorpayPaymentProvider } from "../providers/razorpay-payment.provider";
import { couponService } from "./coupon.service";
import { ServiceContainer } from "@/services/shared/service-container";

export class PaymentService {
  private providers: Record<PaymentProvider, IPaymentProvider>;

  constructor() {
    this.providers = {
      [PaymentProvider.MOCK]: new MockPaymentProvider(),
      [PaymentProvider.RAZORPAY]: new RazorpayPaymentProvider(),
      [PaymentProvider.STRIPE]: null as any,
      [PaymentProvider.PAYPAL]: null as any,
      [PaymentProvider.CASHFREE]: null as any,
    };
  }

  getProvider(provider: PaymentProvider): IPaymentProvider {
    const p = this.providers[provider];
    if (!p) {
      throw new ValidationError(`Payment provider ${provider} is not configured or supported yet.`);
    }
    return p;
  }

  async initializePurchase(
    userId: string,
    courseId: string,
    couponCode?: string,
    provider: PaymentProvider = PaymentProvider.RAZORPAY
  ): Promise<{ payment: Payment; approvalUrl?: string; isFree: boolean }> {
    // 1. Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
        deletedAt: null,
      },
    });

    if (existingEnrollment) {
      // Check if it's active and not expired
      if (existingEnrollment.expiresAt === null || existingEnrollment.expiresAt > new Date()) {
        throw new EnrollmentAlreadyExistsException();
      }
    }

    // 2. Fetch the course
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (course.status !== "PUBLISHED") {
      throw new ValidationError("Cannot purchase an unpublished course");
    }

    const basePrice = course.price.toNumber();
    let discount = 0;
    let couponId: string | undefined;

    // 3. Apply coupon if provided
    if (couponCode) {
      const coupon = await couponService.validateCoupon(couponCode, userId, basePrice);
      const discountResult = await couponService.applyDiscount(coupon, basePrice);
      discount = discountResult.discountAmount;
      couponId = coupon.id;
    }

    const tax = 0.0; // Assume 0 tax for now
    const finalAmount = Math.max(0, basePrice - discount + tax);
    const isFree = finalAmount === 0;

    // 4. Create Payment record and process
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId,
          courseId,
          provider,
          amount: basePrice,
          discount,
          tax,
          finalAmount,
          currency: "INR",
          status: isFree ? PaymentStatus.SUCCESS : PaymentStatus.INITIATED,
          paidAt: isFree ? new Date() : null,
          paymentMethod: isFree ? "FREE" : null,
        },
      });

      if (isFree) {
        // Create CouponUsage if discount was applied
        if (couponId) {
          await tx.couponUsage.create({
            data: {
              couponId,
              userId,
              paymentId: payment.id,
            },
          });
          // Update Coupon usedCount
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Create active Enrollment immediately for free courses
        const enrollment = await tx.enrollment.create({
          data: {
            userId,
            courseId,
            paymentId: payment.id,
            status: EnrollmentStatus.ACTIVE,
            accessType: AccessType.LIFETIME,
            expiresAt: null,
          },
        });

        // Audit & notifications
        try {
          await ServiceContainer.audit.log({
            userId,
            action: "PAYMENT_CREATED",
            resource: "Payment",
            resourceId: payment.id,
            details: { amount: 0, isFree: true },
            status: "SUCCESS",
          });
          await ServiceContainer.audit.log({
            userId,
            action: "ENROLLMENT_CREATED",
            resource: "Enrollment",
            resourceId: enrollment.id,
            details: { accessType: AccessType.LIFETIME },
            status: "SUCCESS",
          });
          await ServiceContainer.audit.log({
            userId,
            action: "ENROLLMENT_ACTIVATED",
            resource: "Enrollment",
            resourceId: enrollment.id,
            details: {},
            status: "SUCCESS",
          });

          // Dispatch notifications
          await ServiceContainer.notification.create({
            userId,
            title: "Course Activated! 📚",
            message: `Your access to the course "${course.title}" has been successfully activated.`,
            type: "ENROLLMENT" as any,
            priority: "HIGH" as any,
          });

          // Send Email
          const userEmail = (await tx.user.findUnique({ where: { id: userId } }))!.email;
          await ServiceContainer.email.send(
            userEmail,
            `Enrollment Confirmation: ${course.title}`,
            `<p>Welcome! Your access to the course <b>${course.title}</b> has been successfully activated. Start learning today!</p>`
          );
        } catch (err) {
          // Log notification failure but do not roll back transaction
          ServiceContainer.logger.error(`Notification/Email dispatch failed for free course enrollment: ${err}`);
        }

        return { payment, isFree: true };
      }

      // Paid course flow: Call Payment Provider
      const paymentProvider = this.getProvider(provider);
      const providerRes = await paymentProvider.createPayment({
        id: payment.id,
        finalAmount,
        currency: "INR",
        course: { title: course.title },
      });

      // Update payment with providerPaymentId (transactionId)
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: providerRes.status,
          transactionId: providerRes.providerPaymentId,
          metadata: providerRes.metadata || {},
        },
      });

      // Create PaymentAttempt record
      await tx.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          provider,
          status: providerRes.status,
          requestPayload: { finalAmount, currency: "INR" },
          responsePayload: providerRes as any,
        },
      });

      // Log Payment Created Audit
      try {
        await ServiceContainer.audit.log({
          userId,
          action: "PAYMENT_CREATED",
          resource: "Payment",
          resourceId: payment.id,
          details: { amount: finalAmount, providerPaymentId: providerRes.providerPaymentId },
          status: "SUCCESS",
        });
      } catch {}

      return {
        payment: updatedPayment,
        approvalUrl: providerRes.approvalUrl,
        isFree: false,
      };
    });
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true, course: true },
    });
    if (!payment) throw new NotFoundError("Payment not found");
    return payment;
  }
}

export const paymentService = new PaymentService();
