import { prisma } from "@/database/client";
import {
  Enrollment,
  EnrollmentStatus,
  AccessType,
  Payment,
  PaymentStatus,
  PaymentProvider,
  Prisma,
} from "@/generated/client";
import { NotFoundError, ValidationError, ForbiddenError } from "@/errors/custom-errors";
import {
  EnrollmentAlreadyExistsException,
  PaymentFailedException,
  EnrollmentExpiredException,
} from "../errors/enrollment-exceptions";
import { paymentService } from "./payment.service";
import { ServiceContainer } from "@/services/shared/service-container";

export class EnrollmentService {
  async verifyPurchase(paymentId: string, payload: any, userId: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: true, user: true },
    });

    if (!payment) throw new NotFoundError("Payment record not found");
    if (payment.userId !== userId) throw new ForbiddenError("Ownership verification failed for this payment");

    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }

    if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.REFUNDED) {
      throw new PaymentFailedException(`Cannot verify a payment with status: ${payment.status}`);
    }

    const provider = paymentService.getProvider(payment.provider);
    const verifyResult = await provider.verifyPayment(payment.transactionId || "", payload);

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: verifyResult.status,
          paymentMethod: verifyResult.paymentMethod || null,
          paidAt: verifyResult.success ? new Date() : null,
          metadata: verifyResult.metadata ? (verifyResult.metadata as Prisma.InputJsonValue) : undefined,
        },
      });

      // 2. Log payment attempt
      await tx.paymentAttempt.create({
        data: {
          paymentId,
          provider: payment.provider,
          status: verifyResult.status,
          requestPayload: payload,
          responsePayload: verifyResult as any,
        },
      });

      // Log Payment Verified Audit
      await ServiceContainer.audit.log({
        userId,
        action: "PAYMENT_VERIFIED",
        resource: "Payment",
        resourceId: paymentId,
        details: { status: verifyResult.status, transactionId: verifyResult.transactionId },
        status: verifyResult.success ? "SUCCESS" : "FAILED",
      });

      if (verifyResult.success) {
        // 3. Create active Enrollment
        const enrollment = await tx.enrollment.create({
          data: {
            userId: payment.userId,
            courseId: payment.courseId,
            paymentId: payment.id,
            status: EnrollmentStatus.ACTIVE,
            accessType: AccessType.LIFETIME,
            expiresAt: null,
          },
        });

        // 4. Log Enrollment Audits
        await ServiceContainer.audit.log({
          userId: payment.userId,
          action: "ENROLLMENT_CREATED",
          resource: "Enrollment",
          resourceId: enrollment.id,
          details: { accessType: AccessType.LIFETIME },
          status: "SUCCESS",
        });

        await ServiceContainer.audit.log({
          userId: payment.userId,
          action: "ENROLLMENT_ACTIVATED",
          resource: "Enrollment",
          resourceId: enrollment.id,
          details: {},
          status: "SUCCESS",
        });
      } else {
        throw new PaymentFailedException("Verification returned failed status");
      }

      return updatedPayment;
    });

    if (verifyResult.success) {
      // Send notifications & emails outside transaction context to prevent timeouts
      try {
        await ServiceContainer.notification.create({
          userId: payment.userId,
          title: "Purchase Successful! 💳",
          message: `Thank you for purchasing "${payment.course.title}".`,
          type: "PAYMENT" as any,
          priority: "NORMAL" as any,
        });

        await ServiceContainer.notification.create({
          userId: payment.userId,
          title: "Enrollment Successful! 📚",
          message: `You have successfully enrolled in "${payment.course.title}".`,
          type: "ENROLLMENT" as any,
          priority: "HIGH" as any,
        });

        await ServiceContainer.notification.create({
          userId: payment.userId,
          title: "Course Activated! 🚀",
          message: `Your access to "${payment.course.title}" is now active.`,
          type: "ENROLLMENT" as any,
          priority: "HIGH" as any,
        });

        await ServiceContainer.email.send(
          payment.user.email,
          `Purchase Receipt for ${payment.course.title}`,
          `<p>Thank you for your purchase of ₹${payment.finalAmount.toNumber()} for <b>${payment.course.title}</b>.</p>`
        );

        await ServiceContainer.email.send(
          payment.user.email,
          `Enrollment Confirmation: ${payment.course.title}`,
          `<p>Your enrollment in ${payment.course.title} has been confirmed. Start learning now!</p>`
        );

        await ServiceContainer.email.send(
          payment.user.email,
          `Course Access Granted`,
          `<p>Your lifetime access to ${payment.course.title} has been successfully activated.</p>`
        );
      } catch (err) {
        ServiceContainer.logger.error(`Failed to dispatch notifications/emails: ${err}`);
      }
    }

    return updatedPayment;
  }

  async refundPurchase(paymentId: string, amount: number | undefined, adminUserId: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: true, user: true, enrollments: true },
    });

    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new ValidationError("Only successful payments can be refunded");
    }

    const refundAmount = amount ?? payment.finalAmount.toNumber();
    const provider = paymentService.getProvider(payment.provider);
    const refundRes = await provider.refundPayment(payment.transactionId || "", refundAmount);

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      // Update enrollments status to REFUNDED/CANCELLED and expire them
      for (const enrollment of payment.enrollments) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: EnrollmentStatus.REFUNDED,
            expiresAt: new Date(),
          },
        });

        await ServiceContainer.audit.log({
          userId: adminUserId,
          action: "ENROLLMENT_CANCELLED",
          resource: "Enrollment",
          resourceId: enrollment.id,
          details: { reason: "Payment Refunded" },
          status: "SUCCESS",
        });
      }

      await ServiceContainer.audit.log({
        userId: adminUserId,
        action: "REFUND_ISSUED",
        resource: "Payment",
        resourceId: paymentId,
        details: { refundAmount },
        status: "SUCCESS",
      });

      try {
        await ServiceContainer.notification.create({
          userId: payment.userId,
          title: "Refund Completed 💰",
          message: `A refund of ₹${refundAmount} has been processed for the course "${payment.course.title}".`,
          type: "PAYMENT" as any,
          priority: "HIGH" as any,
        });

        await ServiceContainer.email.send(
          payment.user.email,
          `Refund Confirmation for ${payment.course.title}`,
          `<p>A refund of ₹${refundAmount} has been processed successfully for <b>${payment.course.title}</b>. Your enrollment has been cancelled.</p>`
        );
      } catch (err) {
        ServiceContainer.logger.error(`Failed to send refund notification/email: ${err}`);
      }

      return updatedPayment;
    });
  }

  async grantEnrollmentManual(
    userId: string,
    courseId: string,
    accessType: AccessType,
    durationDays: number | undefined,
    adminUserId: string
  ): Promise<Enrollment> {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) throw new NotFoundError("Course not found");

    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        accessType,
        expiresAt,
      },
      include: { user: true },
    });

    await ServiceContainer.audit.log({
      userId: adminUserId,
      action: "ENROLLMENT_CREATED",
      resource: "Enrollment",
      resourceId: enrollment.id,
      details: { accessType, grantedManually: true },
      status: "SUCCESS",
    });

    await ServiceContainer.audit.log({
      userId: adminUserId,
      action: "ENROLLMENT_ACTIVATED",
      resource: "Enrollment",
      resourceId: enrollment.id,
      details: {},
      status: "SUCCESS",
    });

    try {
      await ServiceContainer.notification.create({
        userId,
        title: "Course Activated! 🚀",
        message: `Admin granted you access to "${course.title}".`,
        type: "ENROLLMENT" as any,
        priority: "HIGH" as any,
      });

      await ServiceContainer.email.send(
        enrollment.user.email,
        `Course Access Granted`,
        `<p>You have been granted manual access to course: <b>${course.title}</b> by the Administrator.</p>`
      );
    } catch (err) {
      ServiceContainer.logger.error(`Manual grant email/notification failed: ${err}`);
    }

    return enrollment;
  }

  async cancelEnrollmentManual(enrollmentId: string, adminUserId: string): Promise<Enrollment> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, course: true },
    });

    if (!enrollment) throw new NotFoundError("Enrollment not found");

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.CANCELLED,
        expiresAt: new Date(),
      },
    });

    await ServiceContainer.audit.log({
      userId: adminUserId,
      action: "ENROLLMENT_CANCELLED",
      resource: "Enrollment",
      resourceId: enrollmentId,
      details: { manualCancellation: true },
      status: "SUCCESS",
    });

    try {
      await ServiceContainer.notification.create({
        userId: enrollment.userId,
        title: "Enrollment Cancelled 🛑",
        message: `Your access to the course "${enrollment.course.title}" has been cancelled.`,
        type: "ENROLLMENT" as any,
        priority: "HIGH" as any,
      });
    } catch {}

    return updated;
  }

  async expireEnrollmentManual(enrollmentId: string, adminUserId: string): Promise<Enrollment> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, course: true },
    });

    if (!enrollment) throw new NotFoundError("Enrollment not found");

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.EXPIRED,
        expiresAt: new Date(),
      },
    });

    await ServiceContainer.audit.log({
      userId: adminUserId,
      action: "ENROLLMENT_EXPIRED",
      resource: "Enrollment",
      resourceId: enrollmentId,
      details: { manualExpiration: true },
      status: "SUCCESS",
    });

    try {
      await ServiceContainer.notification.create({
        userId: enrollment.userId,
        title: "Enrollment Expired ⏳",
        message: `Your access to the course "${enrollment.course.title}" has expired.`,
        type: "ENROLLMENT" as any,
        priority: "HIGH" as any,
      });

      await ServiceContainer.email.send(
        enrollment.user.email,
        `Enrollment Expired`,
        `<p>Your enrollment access to <b>${enrollment.course.title}</b> has expired. Please purchase again to continue.</p>`
      );
    } catch {}

    return updated;
  }

  async findMyCourses(userId: string): Promise<any[]> {
    const now = new Date();
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      accessType: e.accessType,
      expiresAt: e.expiresAt,
      enrolledAt: e.enrolledAt,
      course: e.course,
    }));
  }

  async getEnrollmentById(id: string, userId: string, role: string): Promise<Enrollment> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { user: true, course: true },
    });

    if (!enrollment) throw new NotFoundError("Enrollment not found");

    // IDOR check: students see only their own. Instructors see enrollments for their own courses. Admins see all.
    if (role === "Student" && enrollment.userId !== userId) {
      throw new ForbiddenError("Ownership check failed for this enrollment record");
    }

    if (role === "Instructor" && enrollment.course.instructorId !== userId) {
      throw new ForbiddenError("You can only access enrollments for your own courses");
    }

    return enrollment;
  }

  async listAllEnrollments(
    userId: string,
    role: string,
    filters: {
      userId?: string;
      courseId?: string;
      status?: EnrollmentStatus;
      accessType?: AccessType;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      ...(role === "Student" && { userId }),
      ...(role === "Instructor" && { course: { instructorId: userId } }),
      ...(role === "Admin" && filters.userId && { userId: filters.userId }),
      ...(filters.courseId && { courseId: filters.courseId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.accessType && { accessType: filters.accessType }),
      deletedAt: null,
    };

    const [data, total] = await prisma.$transaction([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, course: true },
        orderBy: { enrolledAt: "desc" },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const enrollmentService = new EnrollmentService();
