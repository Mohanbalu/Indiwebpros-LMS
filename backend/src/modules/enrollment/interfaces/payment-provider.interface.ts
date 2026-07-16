import { PaymentStatus, PaymentProvider } from "@/generated/client";

export interface PaymentCreateResult {
  providerPaymentId: string;
  status: PaymentStatus;
  approvalUrl?: string;
  metadata?: any;
}

export interface PaymentVerifyResult {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  paymentMethod?: string;
  metadata?: any;
}

export interface IPaymentProvider {
  createPayment(payment: { id: string; finalAmount: number; currency: string; course: { title: string } }): Promise<PaymentCreateResult>;
  verifyPayment(paymentId: string, payload: any): Promise<PaymentVerifyResult>;
  refundPayment(transactionId: string, amount: number): Promise<any>;
  cancelPayment(paymentId: string): Promise<any>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}
