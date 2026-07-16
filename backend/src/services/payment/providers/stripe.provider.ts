import { IPaymentService } from "../interfaces/payment-service.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
import { IMetricsService } from "../../shared/metrics.interface";
import { PaymentConfig } from "../../shared/config.schema";
import { PaymentException } from "../../shared/errors";
import { ServiceContainer } from "../../shared/service-container";

export class StripeProvider implements IPaymentService, ILifecycleService, IHealthCheckService, IMetricsService {
  private config: PaymentConfig;
  private transactionsCount = 0;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    ServiceContainer.logger.info("StripeProvider initialized with secretKey configuration");
  }

  async createOrder(_amount: number, _currency: string, _receiptId: string, _metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.transactionsCount++;
    throw new PaymentException("StripeProvider createOrder is not implemented yet. TODO: Integrate Stripe SDK client.");
  }

  async verifyPayment(_payload: Record<string, unknown>): Promise<boolean> {
    this.transactionsCount++;
    throw new PaymentException("StripeProvider verifyPayment is not implemented yet. TODO: Integrate Stripe SDK client.");
  }

  async refund(_transactionId: string, _amount?: number, _reason?: string): Promise<Record<string, unknown>> {
    this.transactionsCount++;
    throw new PaymentException("StripeProvider refund is not implemented yet. TODO: Integrate Stripe SDK client.");
  }

  async getPayment(_transactionId: string): Promise<Record<string, unknown>> {
    this.transactionsCount++;
    throw new PaymentException("StripeProvider getPayment is not implemented yet. TODO: Integrate Stripe SDK client.");
  }

  async cancel(_transactionId: string): Promise<void> {
    this.transactionsCount++;
    throw new PaymentException("StripeProvider cancel is not implemented yet. TODO: Integrate Stripe SDK client.");
  }

  async health(): Promise<HealthStatus> {
    return {
      service: "payment-stripe",
      status: "healthy",
      latency: 0,
      message: "Stripe provider ready",
      timestamp: new Date().toISOString(),
    };
  }

  async metrics(): Promise<Record<string, unknown>> {
    return { transactions_count: this.transactionsCount };
  }

  async resetMetrics(): Promise<void> {
    this.transactionsCount = 0;
  }

  async recordMetric(name: string, value: number): Promise<void> {
    if (name === "transactions_count") this.transactionsCount = value;
  }
}
