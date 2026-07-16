import { vi } from "vitest";

// SES email provider mock fully implementing IEmailService
export const mockSESEmailProvider = {
  initialize: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined),
  health: vi
    .fn()
    .mockResolvedValue({ status: "healthy", message: "Email delivery channel active" }),

  send: vi
    .fn()
    .mockImplementation(
      async (to: string, subject: string, body: string, options?: Record<string, unknown>) => {
        return;
      }
    ),
  sendTemplate: vi.fn().mockResolvedValue(undefined),
  sendVerification: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  sendWelcome: vi.fn().mockResolvedValue(undefined),
  sendPurchaseConfirmation: vi.fn().mockResolvedValue(undefined),
  sendCertificateIssued: vi.fn().mockResolvedValue(undefined),
  sendNotification: vi.fn().mockResolvedValue(undefined),
};
export const emailService = mockSESEmailProvider;
