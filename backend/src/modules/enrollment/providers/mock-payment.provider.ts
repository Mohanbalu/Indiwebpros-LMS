import { PaymentStatus } from "@/generated/client";
import { IPaymentProvider, PaymentCreateResult, PaymentVerifyResult } from "../interfaces/payment-provider.interface";
import { randomUUID } from "crypto";

export class MockPaymentProvider implements IPaymentProvider {
  async createPayment(payment: { id: string; finalAmount: number; currency: string; course: { title: string } }): Promise<PaymentCreateResult> {
    return {
      providerPaymentId: `mock_pay_${randomUUID()}`,
      status: PaymentStatus.PENDING,
      approvalUrl: `https://mock-gateway.indiwebpros.com/pay/${payment.id}`,
      metadata: {
        info: "Mock Payment Created",
        amount: payment.finalAmount,
        currency: payment.currency,
      },
    };
  }

  async verifyPayment(paymentId: string, payload: any): Promise<PaymentVerifyResult> {
    const isSuccess = payload.status === "SUCCESS";
    return {
      success: isSuccess,
      transactionId: `txn_mock_${randomUUID()}`,
      status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      paymentMethod: payload.paymentMethod || "MOCK_CARD",
      metadata: {
        verifiedAt: new Date().toISOString(),
        payload,
      },
    };
  }

  async refundPayment(transactionId: string, amount: number): Promise<any> {
    return {
      success: true,
      refundId: `ref_mock_${randomUUID()}`,
      refundedAmount: amount,
      status: "REFUNDED",
      transactionId,
    };
  }

  async cancelPayment(paymentId: string): Promise<any> {
    return {
      success: true,
      status: "CANCELLED",
      paymentId,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // If it ends with "err" or "fail", we can simulate FAILED, otherwise SUCCESS
    if (paymentId.includes("fail") || paymentId.includes("failed")) {
      return PaymentStatus.FAILED;
    }
    return PaymentStatus.SUCCESS;
  }
}
