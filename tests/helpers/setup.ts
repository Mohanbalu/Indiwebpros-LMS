import { beforeAll, vi } from "vitest";
import { ServiceContainer } from "@backend/services/shared/service-container";
import { mockS3StorageProvider } from "../mocks/s3.mock";
import { mockSESEmailProvider } from "../mocks/ses.mock";
import { mockRazorpayProvider } from "../mocks/razorpay.mock";
import { prismaTest } from "./db.helper";
import { NotFoundError } from "@backend/errors/custom-errors";

// Global Module Mocks before all imports
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: "mock-ses-id" }),
    }),
  },
}));

vi.mock("@/services/payment/providers/razorpay.provider", () => {
  return {
    RazorpayProvider: class {
      verifyWebhookSignature(payload: string, signature: string) {
        if (signature === "valid_signature_hash") return true;
        return false;
      }
    },
  };
});

// Initialize mock services inside the ServiceContainer before all tests run.
// This is critical because under test mode, ServiceFactory.initializeAll() is bypassed,
// and we must provide mock instances for all infrastructure interfaces.
beforeAll(() => {
  // Mock Logger Service
  ServiceContainer.register("logger", {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    withContext: vi.fn().mockImplementation(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
    })),
  });

  // Mock Audit Service
  ServiceContainer.register("audit", {
    log: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  });

  // Mock Cache Service
  ServiceContainer.register("cache", {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  });

  // Mock Storage Service
  ServiceContainer.register("storage", mockS3StorageProvider);

  // Mock Email Service
  ServiceContainer.register("email", mockSESEmailProvider);

  // Mock Queue Service
  ServiceContainer.register("queue", {
    addJob: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  });

  // Mock Notification Service
  ServiceContainer.register("notification", {
    send: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn().mockImplementation(async (id: string, userId: string) => {
      const notification = await prismaTest.notification.findUnique({
        where: { id },
      });
      if (notification && notification.userId !== userId) {
        throw new NotFoundError("Notification not found");
      }
      return notification;
    }),
    findById: vi.fn().mockImplementation(async (id: string, userId: string) => {
      const notification = await prismaTest.notification.findUnique({
        where: { id },
      });
      if (notification && notification.userId !== userId) {
        throw new NotFoundError("Notification not found");
      }
      return notification;
    }),
    initialize: vi.fn().mockResolvedValue(undefined),
  });

  // Mock Certificate Service
  ServiceContainer.register("certificate", {
    generate: vi.fn().mockResolvedValue({ url: "https://indiwebpros.in/cert.pdf" }),
    initialize: vi.fn().mockResolvedValue(undefined),
  });

  // Mock Payment Service
  ServiceContainer.register("payment", mockRazorpayProvider);
});
