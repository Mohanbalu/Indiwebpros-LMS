import { vi } from "vitest";

// CloudWatch custom metrics mock client
export const mockCloudWatchClient = {
  send: vi.fn().mockResolvedValue({}),
};

export const mockCloudWatchMetrics = {
  paymentFailed: vi.fn().mockResolvedValue(undefined),
  paymentSucceeded: vi.fn().mockResolvedValue(undefined),
  authFailed: vi.fn().mockResolvedValue(undefined),
  loginSucceeded: vi.fn().mockResolvedValue(undefined),
  enrollmentCreated: vi.fn().mockResolvedValue(undefined),
  emailSent: vi.fn().mockResolvedValue(undefined),
  webhookReceived: vi.fn().mockResolvedValue(undefined),
  apiLatency: vi.fn().mockResolvedValue(undefined),
  serverError: vi.fn().mockResolvedValue(undefined),
  certificateGenerated: vi.fn().mockResolvedValue(undefined),
  s3Upload: vi.fn().mockResolvedValue(undefined),
  custom: vi.fn().mockResolvedValue(undefined),
};
