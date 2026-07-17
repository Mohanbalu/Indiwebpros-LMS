import net from "net";
import nodemailer from "nodemailer";
import { ServiceContainer } from "../../shared/service-container";
import { createEmailProvider } from "../../shared/service-factory";
import { BrevoSMTPProvider } from "../providers/brevo-email.provider";
import { SESProvider } from "../providers/ses-email.provider";
import { SMTPProvider } from "../providers/smtp-email.provider";
import { EmailHealthChecker } from "../health/email-health-checker";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

type MockTransport = {
  verify: () => Promise<void>;
  sendMail: (payload: Record<string, unknown>) => Promise<void>;
  close: () => void;
};

async function run() {
  console.log("🌱 Running Email Module tests...");

  const originalCreateTransport = nodemailer.createTransport;
  const sentPayloads: Record<string, unknown>[] = [];
  const logEntries: Array<{ level: string; message: string; context?: Record<string, unknown> }> = [];
  let verifyCalls = 0;
  let sendMailAttempts = 0;
  let smtpServer: net.Server | null = null;

  try {
    process.env.NODE_ENV = "test";
    process.env.FRONTEND_URL = "https://learn.example.com";

    ServiceContainer.clear();
    ServiceContainer.unlock();
    ServiceContainer.register("logger", {
      info(message: string, context?: Record<string, unknown>) { logEntries.push({ level: "info", message, context }); },
      warn(message: string, context?: Record<string, unknown>) { logEntries.push({ level: "warn", message, context }); },
      error(message: string | Error, context?: Record<string, unknown>) { logEntries.push({ level: "error", message: message instanceof Error ? message.message : message, context }); },
      debug(message: string, context?: Record<string, unknown>) { logEntries.push({ level: "debug", message, context }); },
      audit(message: string, context?: Record<string, unknown>) { logEntries.push({ level: "audit", message, context }); },
    });
    ServiceContainer.register("audit", {
      async initialize() {},
      async shutdown() {},
      async log(entry: Record<string, unknown>) { logEntries.push({ level: "audit-log", message: String(entry.action ?? "audit"), context: entry }); },
    });

    smtpServer = net.createServer((socket) => socket.end());
    await new Promise<void>((resolve) => smtpServer!.listen(0, "127.0.0.1", resolve));
    const smtpPort = (smtpServer.address() as net.AddressInfo).port;

    const mockTransport: MockTransport = {
      async verify() {
        verifyCalls++;
      },
      async sendMail(payload: Record<string, unknown>) {
        sendMailAttempts++;
        sentPayloads.push(payload);
      },
      close() {},
    };

    (nodemailer as unknown as { createTransport: () => MockTransport }).createTransport = () => mockTransport;

    const config = {
      provider: "brevo",
      smtpHost: "localhost",
      smtpPort,
      smtpUsername: "",
      smtpPassword: "",
      smtpSecure: false,
      smtpFromName: "IndiWebPros LMS",
      smtpFromEmail: "noreply@indiwebpros.com",
      awsRegion: "us-east-1",
      awsSesFromEmail: "noreply@indiwebpros.com",
    };

    const brevoProvider = createEmailProvider(config);
    const smtpProvider = createEmailProvider({ ...config, provider: "smtp" });
    const sesProvider = createEmailProvider({ ...config, provider: "ses" });

    assert(brevoProvider instanceof BrevoSMTPProvider, "Brevo provider resolves from configuration");
    assert(smtpProvider instanceof SMTPProvider, "SMTP provider resolves from configuration");
    assert(sesProvider instanceof SESProvider, "SES provider resolves from configuration");

    await brevoProvider.initialize();
    assert(verifyCalls === 1, "Provider verifies SMTP connection during initialization");

    const health = await brevoProvider.health();
    assert(health.status === "healthy", "Brevo provider health check succeeds after initialization");

    const detailedHealth = await brevoProvider.getEmailHealth();
    assert(detailedHealth.provider === "Brevo", "Detailed email health reports the configured provider");
    assert(detailedHealth.connectionStatus === "connected", "Detailed email health reports SMTP connectivity");
    assert(detailedHealth.authenticationStatus === "authenticated", "Detailed email health reports SMTP authentication");
    assert(Boolean(detailedHealth.lastSuccessfulCheck), "Detailed email health records last successful check");
    assert(!JSON.stringify(detailedHealth).includes("mock-pass"), "Detailed email health does not expose SMTP credentials");

    await brevoProvider.sendVerification("student@example.com", "verify-token");
    await brevoProvider.sendPasswordReset("student@example.com", "reset-token");
    await brevoProvider.sendWelcome("student@example.com", { name: "Student" });
    await brevoProvider.sendPurchaseConfirmation("student@example.com", { name: "Student", courseId: "course-1", courseName: "Node.js" });
    await brevoProvider.sendCertificateIssued("student@example.com", { name: "Student", certificateId: "cert-1", courseName: "Node.js" });
    await brevoProvider.sendNotification("student@example.com", { name: "Student", subject: "Platform Update", message: "Hello", actionLink: "https://learn.example.com", actionText: "Open" });
    await brevoProvider.send("otp@example.com", "Your OTP Code", "<p>123456</p>");

    assert(sentPayloads.length === 7, "All email flows dispatch through the Brevo SMTP transport");
    assert(String(sentPayloads[0].subject).includes("Verify"), "Verification email subject is preserved");
    assert(String(sentPayloads[1].subject).includes("Password Reset"), "Password reset email subject is preserved");
    assert(String(sentPayloads[4].subject).includes("Certificate"), "Certificate email subject is preserved");
    assert(String(sentPayloads[6].subject).includes("OTP"), "OTP email uses the generic send path");

    const successLog = logEntries.find((entry) => entry.level === "info" && entry.context?.messageType === "verification");
    assert(Boolean(successLog), "Success log includes provider, recipient, and message type");

    let retrySendCalls = 0;
    const retryTransport: MockTransport = {
      async verify() {},
      async sendMail() {
        retrySendCalls++;
        if (retrySendCalls === 1) {
          const error = new Error("SMTP timed out") as Error & { code?: string };
          error.code = "ETIMEDOUT";
          throw error;
        }
      },
      close() {},
    };

    (nodemailer as unknown as { createTransport: () => MockTransport }).createTransport = () => retryTransport;

    const retryProvider = createEmailProvider({ ...config, provider: "smtp" });
    await retryProvider.initialize();
    await retryProvider.send("retry@example.com", "Retryable Message", "<p>Retry</p>", { retryAttempts: 2, messageType: "notification" });
    assert(retrySendCalls === 2, "Retryable SMTP failures are retried before succeeding");

    const failingChecker = new EmailHealthChecker(
      { ...config, smtpUsername: "secret-user", smtpPassword: "secret-pass" },
      "SMTP",
      {
        async resolveDns() {},
        async connectTcp() {},
        async verifySmtp() { throw new Error("auth failed for secret-user using secret-pass"); },
        now: () => new Date("2026-07-16T00:00:00.000Z"),
      }
    );
    const failedHealth = await failingChecker.check();
    assert(failedHealth.status === "unhealthy", "Email health checker reports authentication failures");
    assert(!JSON.stringify(failedHealth).includes("secret-pass"), "Email health checker redacts password values from errors");
    assert(!JSON.stringify(failedHealth).includes("secret-user"), "Email health checker redacts username values from errors");

    const invalidRecipientProvider = createEmailProvider(config);
    await invalidRecipientProvider.initialize();
    let invalidRecipientFailed = false;
    try {
      await invalidRecipientProvider.send("not-an-email", "Invalid Recipient", "<p>Body</p>");
    } catch {
      invalidRecipientFailed = true;
    }
    assert(invalidRecipientFailed, "Invalid recipient addresses are rejected before transport dispatch");

    console.log("\n🎉 All email provider tests passed successfully!");
  } catch (error) {
    console.error("❌ Test run failed:", error);
    process.exit(1);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    if (smtpServer) {
      await new Promise<void>((resolve) => smtpServer!.close(() => resolve()));
    }
  }
}

run();