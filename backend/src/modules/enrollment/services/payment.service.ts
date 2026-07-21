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
    // Only database writes inside the transaction — no audit, notifications, or emails.
    const txResult = await prisma.$transaction(async (tx) => {
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
        if (couponId) {
          await tx.couponUsage.create({
            data: { couponId, userId, paymentId: payment.id },
          });
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

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

        return { payment, enrollmentId: enrollment.id, isFree: true as const };
      }

      // Paid course flow: Call Payment Provider
      const paymentProvider = this.getProvider(provider);
      const providerRes = await paymentProvider.createPayment({
        id: payment.id,
        finalAmount,
        currency: "INR",
        course: { title: course.title },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: providerRes.status,
          transactionId: providerRes.providerPaymentId,
          metadata: providerRes.metadata || {},
        },
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          provider,
          status: providerRes.status,
          requestPayload: { finalAmount, currency: "INR" },
          responsePayload: providerRes as any,
        },
      });

      return {
        payment: updatedPayment,
        approvalUrl: providerRes.approvalUrl,
        isFree: false as const,
      };
    });

    // Audit logs, notifications, and emails — all AFTER transaction commits
    if (txResult.isFree) {
      try {
        await ServiceContainer.audit.log({
          userId,
          action: "PAYMENT_CREATED",
          resource: "Payment",
          resourceId: txResult.payment.id,
          details: { amount: 0, isFree: true },
          status: "SUCCESS",
        });
        await ServiceContainer.audit.log({
          userId,
          action: "ENROLLMENT_CREATED",
          resource: "Enrollment",
          resourceId: txResult.enrollmentId,
          details: { accessType: AccessType.LIFETIME },
          status: "SUCCESS",
        });
        await ServiceContainer.audit.log({
          userId,
          action: "ENROLLMENT_ACTIVATED",
          resource: "Enrollment",
          resourceId: txResult.enrollmentId,
          details: {},
          status: "SUCCESS",
        });

        await ServiceContainer.notification.create({
          userId,
          title: "Course Activated! 📚",
          message: `Your access to the course "${course.title}" has been successfully activated.`,
          type: "ENROLLMENT" as any,
          priority: "HIGH" as any,
        });

        const userEmail = (await prisma.user.findUnique({ where: { id: userId } }))!.email;
        await ServiceContainer.email.send(
          userEmail,
          `Enrollment Confirmation: ${course.title}`,
          `<p>Welcome! Your access to the course <b>${course.title}</b> has been successfully activated. Start learning today!</p>`
        );
      } catch (err) {
        ServiceContainer.logger.error(`Notification/Email dispatch failed for free course enrollment: ${err}`);
      }

      return txResult as { payment: Payment; isFree: true };
    }

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "PAYMENT_CREATED",
        resource: "Payment",
        resourceId: txResult.payment.id,
        details: { amount: finalAmount, providerPaymentId: txResult.payment.transactionId },
        status: "SUCCESS",
      });
    } catch {}

    return txResult as { payment: Payment; approvalUrl?: string; isFree: false };
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true, course: true },
    });
    if (!payment) throw new NotFoundError("Payment not found");
    return payment;
  }

  async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          course: {
            include: {
              instructor: { select: { id: true, firstName: true, lastName: true } },
              thumbnail: { select: { url: true } },
            },
          },
          couponUsages: {
            include: {
              coupon: {
                select: { code: true, discountType: true, discountValue: true },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return {
      data: payments.map((p) => ({
        ...p,
        amount: p.amount.toNumber(),
        discount: p.discount.toNumber(),
        tax: p.tax.toNumber(),
        finalAmount: p.finalAmount.toNumber(),
        course: {
          ...p.course,
          instructor: p.course.instructor,
          thumbnail: p.course.thumbnail,
          price: p.course.price.toNumber(),
          discountPrice: p.course.discountPrice?.toNumber() ?? null,
        },
        couponUsages: p.couponUsages.map((cu) => ({
          ...cu,
          coupon: {
            ...cu.coupon,
            discountValue: cu.coupon.discountValue.toNumber(),
          },
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInvoiceData(paymentId: string, userId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        couponUsages: {
          include: { coupon: { select: { code: true } } },
        },
      },
    });

    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.userId !== userId) throw new NotFoundError("Payment not found");

    const metadata = payment.metadata as Record<string, any> | null;
    const razorpayPaymentId = metadata?.razorpayPaymentId || null;
    // Generate invoice number from payment ID (last 8 chars uppercased)
    const invoiceNumber = `INV-${payment.id.replace(/-/g, "").slice(-8).toUpperCase()}`;

    return {
      invoiceNumber,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      razorpayPaymentId,
      status: payment.status,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      amount: payment.amount.toNumber(),
      discount: payment.discount.toNumber(),
      tax: payment.tax.toNumber(),
      finalAmount: payment.finalAmount.toNumber(),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      couponCode: payment.couponUsages[0]?.coupon?.code ?? null,
      course: payment.course,
      student: payment.user,
      company: {
        name: "IndiWebPros Learning Pvt. Ltd.",
        email: "admin@indiwebpros.in",
        website: "https://www.indiwebpros.in",
        gstin: "N/A",
        address: "India",
      },
    };
  }
}

export const paymentService = new PaymentService();
