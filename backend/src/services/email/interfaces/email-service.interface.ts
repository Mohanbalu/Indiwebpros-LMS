export interface IEmailService {
  send(to: string, subject: string, body: string, options?: Record<string, unknown>): Promise<void>;
  sendTemplate(to: string, templateName: string, data: Record<string, unknown>, options?: Record<string, unknown>): Promise<void>;
  sendVerification(to: string, token: string): Promise<void>;
  sendPasswordReset(to: string, token: string): Promise<void>;
  sendWelcome(to: string, data: Record<string, unknown>): Promise<void>;
  sendPurchaseConfirmation(to: string, data: Record<string, unknown>): Promise<void>;
  sendCertificateIssued(to: string, data: Record<string, unknown>): Promise<void>;
  sendNotification(to: string, data: Record<string, unknown>): Promise<void>;
}
