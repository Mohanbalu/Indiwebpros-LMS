export interface IPaymentService {
  createOrder(amount: number, currency: string, receiptId: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>>;
  verifyPayment(payload: Record<string, unknown>): Promise<boolean>;
  refund(transactionId: string, amount?: number, reason?: string): Promise<Record<string, unknown>>;
  getPayment(transactionId: string): Promise<Record<string, unknown>>;
  cancel(transactionId: string): Promise<void>;
}
