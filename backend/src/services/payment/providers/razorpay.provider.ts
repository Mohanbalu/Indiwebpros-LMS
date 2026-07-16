import { IPaymentService } from "../interfaces/payment-service.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
import { IMetricsService } from "../../shared/metrics.interface";
import { PaymentConfig } from "../../shared/config.schema";
import { PaymentException } from "../../shared/errors";
import crypto from "crypto";

// Safe logger that falls back to console when ServiceContainer is not initialized (e.g. in tests)
function safeLog(level: "info" | "warn" | "error", message: string): void {
  try {
    // Dynamic import to avoid circular dependency
    const { ServiceContainer } = require("../../shared/service-container");
    ServiceContainer.logger[level](message);
  } catch {
    console[level](`[RazorpayProvider] ${message}`);
  }
}


// ==========================================
// Razorpay REST API Response Types
// ==========================================

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
  notes?: Record<string, string>;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  description?: string;
  created_at: number;
}

export interface RazorpayRefund {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
  created_at: number;
  notes?: Record<string, string>;
}

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

// ==========================================
// RazorpayProvider — Core Payment Service
// Implements IPaymentService from service layer
// ==========================================

export class RazorpayProvider implements IPaymentService, ILifecycleService, IHealthCheckService, IMetricsService {
  private config: PaymentConfig;
  private transactionsCount = 0;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  // ── Helpers ───────────────────────────────────────────────────

  private get authHeader(): string {
    const credentials = Buffer.from(`${this.config.razorpayKeyId}:${this.config.razorpaySecret}`).toString("base64");
    return `Basic ${credentials}`;
  }

  private async razorpayRequest<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${RAZORPAY_BASE_URL}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const res = await fetch(url, options);
    const data = await res.json() as any;

    if (!res.ok) {
      const errMsg = data?.error?.description || data?.error?.reason || "Razorpay API error";
      throw new PaymentException(`Razorpay API Error [${res.status}]: ${errMsg}`);
    }

    return data as T;
  }

  // ── IPaymentService Methods ────────────────────────────────────

  /**
   * Create a Razorpay Order.
   * Amount must be in lowest denomination (paise for INR).
   */
  async createOrder(
    amount: number,
    currency: string,
    receiptId: string,
    metadata?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.transactionsCount++;

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    const payload: Record<string, unknown> = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: receiptId,
      notes: {
        receipt_id: receiptId,
        ...metadata,
      },
    };

    const order = await this.razorpayRequest<RazorpayOrder>("POST", "/orders", payload);

    safeLog("info", `[Razorpay] Order created: ${order.id} | Amount: ${amountInPaise} paise | Receipt: ${receiptId}`);

    return order as unknown as Record<string, unknown>;
  }

  /**
   * Verify Razorpay payment signature using HMAC SHA256.
   * Never trust frontend success — always verify on backend.
   */
  async verifyPayment(payload: Record<string, unknown>): Promise<boolean> {
    this.transactionsCount++;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      safeLog("warn", "[Razorpay] Signature verification failed: missing required fields");
      return false;
    }

    // HMAC SHA256: key_secret signs (order_id + "|" + payment_id)
    const expectedSignature = crypto
      .createHmac("sha256", this.config.razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      safeLog("warn", `[Razorpay] Signature mismatch for order: ${razorpay_order_id} | payment: ${razorpay_payment_id}`);
    } else {
      safeLog("info", `[Razorpay] Signature verified for order: ${razorpay_order_id} | payment: ${razorpay_payment_id}`);
    }

    return isValid;
  }

  /**
   * Verify Razorpay webhook event signature.
   * The raw request body string is hashed with the webhook secret.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = crypto
      .createHmac("sha256", this.config.razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    const isValid = expected === signature;

    if (!isValid) {
      safeLog("warn", "[Razorpay] Webhook signature verification FAILED");
    } else {
      safeLog("info", "[Razorpay] Webhook signature verified successfully");
    }

    return isValid;
  }

  /**
   * Process a refund for a Razorpay payment.
   * paymentId here is the Razorpay payment_id (pay_...)
   * Amount is in INR (will be converted to paise internally)
   */
  async refund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Record<string, unknown>> {
    this.transactionsCount++;

    const payload: Record<string, unknown> = {
      notes: { reason: reason || "Admin refund" },
    };

    if (amount !== undefined) {
      payload.amount = Math.round(amount * 100); // convert to paise
    }

    const refund = await this.razorpayRequest<RazorpayRefund>(
      "POST",
      `/payments/${paymentId}/refund`,
      payload
    );

    safeLog("info", `[Razorpay] Refund created: ${refund.id} for payment: ${paymentId} | Amount: ${refund.amount} paise`);

    return refund as unknown as Record<string, unknown>;
  }

  /**
   * Fetch Razorpay payment details by payment ID.
   */
  async getPayment(paymentId: string): Promise<Record<string, unknown>> {
    this.transactionsCount++;

    const payment = await this.razorpayRequest<RazorpayPayment>("GET", `/payments/${paymentId}`);

    safeLog("info", `[Razorpay] Payment fetched: ${paymentId} | Status: ${payment.status}`);

    return payment as unknown as Record<string, unknown>;
  }

  /**
   * Cancel a Razorpay order.
   * Note: Razorpay does not support explicit order cancellation via API.
   * Orders auto-expire after ~30 minutes if unpaid.
   * We log the intent and return a graceful response.
   */
  async cancel(transactionId: string): Promise<void> {
    this.transactionsCount++;
    // Razorpay orders auto-expire; this is a no-op intentionally
    safeLog("info", `[Razorpay] Cancel intent registered for order: ${transactionId} (orders auto-expire)`);
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  async initialize(): Promise<void> {
    safeLog("info", `[RazorpayProvider] Initialized | KeyId: ${this.config.razorpayKeyId} | Provider: razorpay`);
  }

  // ── Health ────────────────────────────────────────────────────

  async health(): Promise<HealthStatus> {
    return {
      service: "payment-razorpay",
      status: "healthy",
      latency: 0,
      message: `Razorpay provider active (keyId: ${this.config.razorpayKeyId})`,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Metrics ───────────────────────────────────────────────────

  async metrics(): Promise<Record<string, unknown>> {
    return {
      transactions_count: this.transactionsCount,
      provider: "razorpay",
    };
  }

  async resetMetrics(): Promise<void> {
    this.transactionsCount = 0;
  }

  async recordMetric(name: string, value: number): Promise<void> {
    if (name === "transactions_count") this.transactionsCount = value;
  }
}
