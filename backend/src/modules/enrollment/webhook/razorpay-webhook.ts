import { Request, Response } from "express";
import { prisma } from "@/database/client";
import { RazorpayProvider } from "@/services/payment/providers/razorpay.provider";
import { paymentConfigSchema } from "@/services/shared/config.schema";
import { ServiceContainer } from "@/services/shared/service-container";
import { PaymentStatus, EnrollmentStatus, AccessType, PaymentProvider } from "@/generated/client";

// ==========================================
// Razorpay Webhook Handler
// Mounted before express.json() in app.ts
// Handles: payment.captured, payment.failed,
//          refund.created, refund.processed
// ==========================================

export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const rawBody: string = (req as any).rawBody;
  const signature = req.headers["x-razorpay-signature"] as string | undefined;

  // 1. Validate presence of body and signature
  if (!rawBody || !signature) {
    ServiceContainer.logger.warn("[RazorpayWebhook] Missing body or signature header");
    res.status(200).json({ received: true });
    return;
  }

  // 2. Verify HMAC signature
  let config;
  try {
    config = paymentConfigSchema.parse({});
  } catch (err) {
    ServiceContainer.logger.error(`[RazorpayWebhook] Failed to load payment config: ${err}`);
    res.status(200).json({ received: true });
    return;
  }

  const rzp = new RazorpayProvider(config);
  if (!rzp.verifyWebhookSignature(rawBody, signature)) {
    ServiceContainer.logger.warn("[RazorpayWebhook] Invalid signature — rejecting");
    res.status(200).json({ received: true });
    return;
  }

  // 3. Parse event JSON
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    ServiceContainer.logger.warn("[RazorpayWebhook] Body is not valid JSON");
    res.status(200).json({ received: true });
    return;
  }

  const eventType: string = event?.event;
  const eventId: string | undefined = event?.id;

  if (!eventType) {
    res.status(200).json({ received: true });
    return;
  }

  ServiceContainer.logger.info(`[RazorpayWebhook] Event: ${eventType} | ID: ${eventId}`);

  // 4. Idempotency check — skip if this event was already processed
  if (eventId) {
    try {
      const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
      if (existing) {
        ServiceContainer.logger.info(`[RazorpayWebhook] Duplicate event ${eventId} (status: ${existing.status}) — skipping`);
        res.status(200).json({ received: true });
        return;
      }
    } catch (err) {
      // If WebhookEvent table doesn't exist yet (migration pending), log and continue
      ServiceContainer.logger.warn(`[RazorpayWebhook] Idempotency check failed (table may not exist): ${err}`);
    }
  }

  // 5. Create event record before processing (prevents concurrent duplicates)
  if (eventId) {
    try {
      await prisma.webhookEvent.create({
        data: {
          eventId,
          provider: "razorpay",
          eventType,
          payload: event as any,
          status: "PENDING",
        },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation = duplicate event
      if (err?.code === "P2002") {
        ServiceContainer.logger.info(`[RazorpayWebhook] Concurrent duplicate event ${eventId} — skipping`);
        res.status(200).json({ received: true });
        return;
      }
      ServiceContainer.logger.warn(`[RazorpayWebhook] Failed to create event record: ${err}`);
    }
  }

  // 6. Process event
  try {
    await processEvent(eventType, event);
    if (eventId) {
      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: "PROCESSED", processedAt: new Date() },
      }).catch(() => {});
    }
  } catch (err) {
    ServiceContainer.logger.error(`[RazorpayWebhook] Processing failed for ${eventType}: ${err}`);
    if (eventId) {
      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: "FAILED", errorMessage: String(err) },
      }).catch(() => {});
    }
  }

  // 7. Always return 200 to Razorpay (prevents retry storms)
  res.status(200).json({ received: true });
}

// ==========================================
// Event Processing
// ==========================================

async function processEvent(eventType: string, event: any): Promise<void> {
  switch (eventType) {
    case "payment.captured":
      await handlePaymentCaptured(event);
      break;
    case "payment.failed":
      await handlePaymentFailed(event);
      break;
    case "refund.created":
    case "refund.processed":
      await handleRefund(event, eventType);
      break;
    default:
      ServiceContainer.logger.info(`[RazorpayWebhook] Unhandled event type: ${eventType}`);
  }
}

// ── payment.captured ────────────────────────────────────────

async function handlePaymentCaptured(event: any): Promise<void> {
  const rzpPayment = event?.payload?.payment?.entity;
  const rzpOrderId = rzpPayment?.order_id;
  const rzpPaymentId = rzpPayment?.id;

  if (!rzpOrderId) {
    ServiceContainer.logger.warn("[RazorpayWebhook] payment.captured: missing order_id");
    return;
  }

  // Find our payment record — only process if not already SUCCESS
  const payment = await prisma.payment.findFirst({
    where: { transactionId: rzpOrderId, status: { not: PaymentStatus.SUCCESS } },
  });

  if (!payment) {
    ServiceContainer.logger.info(`[RazorpayWebhook] payment.captured: no pending payment for order ${rzpOrderId}`);
    return;
  }

  // Use idempotent enrollment check inside transaction
  await prisma.$transaction(async (tx) => {
    // Re-check inside transaction to prevent race condition
    const current = await tx.payment.findUnique({ where: { id: payment.id } });
    if (!current || current.status === PaymentStatus.SUCCESS) {
      ServiceContainer.logger.info(`[RazorpayWebhook] payment.captured: payment ${payment.id} already processed — skipping`);
      return;
    }

    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        paymentMethod: rzpPayment?.method?.toUpperCase() || "RAZORPAY",
        paidAt: new Date(),
        metadata: {
          ...(current.metadata as Record<string, any> || {}),
          razorpayPaymentId: rzpPaymentId,
          webhookCapturedAt: new Date().toISOString(),
        },
      },
    });

    // Log payment attempt
    await tx.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        provider: PaymentProvider.RAZORPAY,
        status: PaymentStatus.SUCCESS,
        requestPayload: { source: "webhook", event: "payment.captured" },
        responsePayload: rzpPayment || {},
      },
    });

    // Create enrollment only if one doesn't already exist
    const existingEnrollment = await tx.enrollment.findFirst({
      where: { userId: payment.userId, courseId: payment.courseId },
    });

    if (!existingEnrollment) {
      await tx.enrollment.create({
        data: {
          userId: payment.userId,
          courseId: payment.courseId,
          paymentId: payment.id,
          status: EnrollmentStatus.ACTIVE,
          accessType: AccessType.LIFETIME,
          expiresAt: null,
        },
      });

      ServiceContainer.logger.info(`[RazorpayWebhook] Enrollment created for user ${payment.userId}, course ${payment.courseId}`);
    }

    // Audit log
    await ServiceContainer.audit.log({
      userId: payment.userId,
      action: "PAYMENT_VERIFIED",
      resource: "Payment",
      resourceId: payment.id,
      details: { source: "webhook", razorpayPaymentId: rzpPaymentId },
      status: "SUCCESS",
    });
  });

  // Send notifications/emails outside transaction
  try {
    const paymentWithDetails = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { course: true, user: true },
    });

    if (paymentWithDetails?.user?.email) {
      await ServiceContainer.notification.create({
        userId: payment.userId,
        title: "Payment Confirmed! \uD83D\uDCB3",
        message: `Your payment for "${paymentWithDetails.course.title}" has been confirmed.`,
        type: "PAYMENT" as any,
        priority: "NORMAL" as any,
      });

      await ServiceContainer.email.send(
        paymentWithDetails.user.email,
        `Payment Confirmation: ${paymentWithDetails.course.title}`,
        `<p>Your payment of \u20B9${paymentWithDetails.finalAmount.toNumber()} for <b>${paymentWithDetails.course.title}</b> has been confirmed. Your course access is now active.</p>`
      );
    }
  } catch (err) {
    ServiceContainer.logger.error(`[RazorpayWebhook] Failed to send payment.captured notifications: ${err}`);
  }
}

// ── payment.failed ──────────────────────────────────────────

async function handlePaymentFailed(event: any): Promise<void> {
  const rzpPayment = event?.payload?.payment?.entity;
  const rzpOrderId = rzpPayment?.order_id;
  const rzpPaymentId = rzpPayment?.id;

  if (!rzpOrderId) {
    ServiceContainer.logger.warn("[RazorpayWebhook] payment.failed: missing order_id");
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionId: rzpOrderId, status: { not: PaymentStatus.FAILED } },
  });

  if (!payment) {
    ServiceContainer.logger.info(`[RazorpayWebhook] payment.failed: no match for order ${rzpOrderId}`);
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      metadata: {
        ...(payment.metadata as Record<string, any> || {}),
        razorpayPaymentId: rzpPaymentId,
        failedAt: new Date().toISOString(),
        failureReason: rzpPayment?.error_description || rzpPayment?.error_reason || "Payment failed via webhook",
      },
    },
  });

  await ServiceContainer.audit.log({
    userId: payment.userId,
    action: "PAYMENT_VERIFIED",
    resource: "Payment",
    resourceId: payment.id,
    details: { source: "webhook", event: "payment.failed", razorpayPaymentId: rzpPaymentId },
    status: "FAILED",
  });

  ServiceContainer.logger.info(`[RazorpayWebhook] Payment marked FAILED: ${payment.id}`);
}

// ── refund.created / refund.processed ───────────────────────

async function handleRefund(event: any, eventType: string): Promise<void> {
  const rzpRefund = event?.payload?.refund?.entity;
  const rzpPaymentId = rzpRefund?.payment_id;
  const refundId = rzpRefund?.id;
  const refundAmount = rzpRefund?.amount ? rzpRefund.amount / 100 : undefined; // Convert from paise

  if (!rzpPaymentId) {
    ServiceContainer.logger.warn(`[RazorpayWebhook] ${eventType}: missing payment_id in refund entity`);
    return;
  }

  // Find the payment by Razorpay payment ID stored in metadata
  const payment = await prisma.payment.findFirst({
    where: {
      metadata: { path: ["razorpayPaymentId"], equals: rzpPaymentId },
    },
    include: { course: true, user: true, enrollments: true },
  });

  if (!payment) {
    ServiceContainer.logger.info(`[RazorpayWebhook] ${eventType}: no payment found for razorpay payment ${rzpPaymentId}`);
    return;
  }

  // Skip if already refunded
  if (payment.status === PaymentStatus.REFUNDED || payment.status === PaymentStatus.PARTIAL_REFUND) {
    ServiceContainer.logger.info(`[RazorpayWebhook] ${eventType}: payment ${payment.id} already refunded — skipping`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Re-check inside transaction
    const current = await tx.payment.findUnique({ where: { id: payment.id } });
    if (!current || current.status === PaymentStatus.REFUNDED || current.status === PaymentStatus.PARTIAL_REFUND) {
      return;
    }

    const isFullRefund = !refundAmount || refundAmount >= payment.finalAmount.toNumber();

    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIAL_REFUND,
        metadata: {
          ...(current.metadata as Record<string, any> || {}),
          refundId,
          refundAmount,
          refundEvent: eventType,
          refundedAt: new Date().toISOString(),
        },
      },
    });

    // Cancel enrollments if full refund
    if (isFullRefund) {
      for (const enrollment of payment.enrollments) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: EnrollmentStatus.REFUNDED,
            expiresAt: new Date(),
          },
        });
      }
    }

    // Audit log
    await ServiceContainer.audit.log({
      userId: payment.userId,
      action: "REFUND_ISSUED",
      resource: "Payment",
      resourceId: payment.id,
      details: { refundId, refundAmount, source: "webhook", event: eventType },
      status: "SUCCESS",
    });

    ServiceContainer.logger.info(`[RazorpayWebhook] Refund processed: ${refundId} for payment ${payment.id} (${isFullRefund ? "full" : "partial"})`);
  });

  // Send notifications outside transaction
  try {
    await ServiceContainer.notification.create({
      userId: payment.userId,
      title: "Refund Processed \uD83D\uDCB0",
      message: `A refund of \u20B9${refundAmount ?? payment.finalAmount.toNumber()} has been processed for "${payment.course.title}".`,
      type: "PAYMENT" as any,
      priority: "HIGH" as any,
    });

    await ServiceContainer.email.send(
      payment.user.email,
      `Refund Confirmation: ${payment.course.title}`,
      `<p>A refund of \u20B9${refundAmount ?? payment.finalAmount.toNumber()} has been processed for <b>${payment.course.title}</b>. ${refundAmount && refundAmount < payment.finalAmount.toNumber() ? "This is a partial refund." : "Your enrollment has been cancelled."}</p>`
    );
  } catch (err) {
    ServiceContainer.logger.error(`[RazorpayWebhook] Failed to send refund notifications: ${err}`);
  }
}
