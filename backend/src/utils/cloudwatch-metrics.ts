/**
 * CloudWatch Custom Metrics Publisher
 * Milestone 24 — IndiWebPros LMS Infrastructure
 *
 * Publishes application-level business metrics to CloudWatch.
 * Use this to track: payment failures, auth failures, enrollment counts, API latency.
 *
 * In development: logs to console instead of CloudWatch.
 */

import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
  StandardUnit,
} from "@aws-sdk/client-cloudwatch";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAMESPACE = "IndiWebPros/LMS";
const REGION = process.env.AWS_REGION || "us-east-1";

// ─── CloudWatch Client (singleton) ───────────────────────────────────────────

let cwClient: CloudWatchClient | null = null;

function getClient(): CloudWatchClient {
  if (!cwClient) {
    cwClient = new CloudWatchClient({
      region: REGION,
      ...(process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY,
              secretAccessKey: process.env.AWS_SECRET_KEY,
            },
          }
        : {}),
    });
  }
  return cwClient;
}

// ─── Core Metric Publisher ────────────────────────────────────────────────────

/**
 * Publishes a single metric datum to CloudWatch.
 * In development mode, logs to console instead.
 */
async function publishMetric(
  metricName: string,
  value: number,
  unit: StandardUnit = "Count",
  dimensions: Record<string, string> = {}
): Promise<void> {
  const env = process.env.NODE_ENV || "development";

  if (env !== "production") {
    // Development: log to console instead of hitting CloudWatch API
    console.debug(
      `[CloudWatch:dev] ${NAMESPACE}/${metricName} = ${value} ${unit}`,
      dimensions
    );
    return;
  }

  try {
    const datum: MetricDatum = {
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
    };

    await getClient().send(
      new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [datum],
      })
    );
  } catch (error) {
    // Never throw from metrics — non-critical path
    console.error(`[CloudWatch] Failed to publish metric ${metricName}:`, (error as Error).message);
  }
}

// ─── Application Metrics API ──────────────────────────────────────────────────

export const CloudWatchMetrics = {
  /**
   * Track a payment failure.
   * @param provider - "razorpay" | "stripe" | "mock"
   * @param reason - Short reason string
   */
  paymentFailed: (provider: string, reason: string) =>
    publishMetric("PaymentFailures", 1, "Count", { Provider: provider, Reason: reason }),

  /**
   * Track a successful payment.
   */
  paymentSucceeded: (provider: string, amountINR: number) =>
    publishMetric("PaymentSuccesses", 1, "Count", { Provider: provider }),

  /**
   * Track authentication failures (wrong password, expired token, etc.)
   */
  authFailed: (reason: string) =>
    publishMetric("AuthFailures", 1, "Count", { Reason: reason }),

  /**
   * Track successful logins.
   */
  loginSucceeded: (role: string) =>
    publishMetric("LoginSuccesses", 1, "Count", { Role: role }),

  /**
   * Track a new enrollment created.
   */
  enrollmentCreated: (accessType: string) =>
    publishMetric("EnrollmentsCreated", 1, "Count", { AccessType: accessType }),

  /**
   * Track an email sent via SES.
   */
  emailSent: (type: string) =>
    publishMetric("EmailsSent", 1, "Count", { EmailType: type }),

  /**
   * Track a webhook received.
   */
  webhookReceived: (provider: string, event: string, success: boolean) =>
    publishMetric("WebhooksReceived", 1, "Count", {
      Provider: provider,
      Event: event,
      Status: success ? "success" : "failure",
    }),

  /**
   * Track API response latency.
   * @param endpoint - e.g. "POST /api/v1/payments/razorpay/verify"
   * @param latencyMs - milliseconds
   */
  apiLatency: (endpoint: string, latencyMs: number) =>
    publishMetric("APILatency", latencyMs, "Milliseconds", { Endpoint: endpoint }),

  /**
   * Track a 5xx error.
   */
  serverError: (endpoint: string, statusCode: number) =>
    publishMetric("ServerErrors", 1, "Count", {
      Endpoint: endpoint,
      StatusCode: String(statusCode),
    }),

  /**
   * Track certificate generation.
   */
  certificateGenerated: () =>
    publishMetric("CertificatesGenerated", 1, "Count"),

  /**
   * Track S3 upload operations.
   */
  s3Upload: (objectType: string, sizeBytes: number) =>
    publishMetric("S3Uploads", 1, "Count", { ObjectType: objectType }),

  /**
   * Publish an arbitrary custom metric.
   */
  custom: (name: string, value: number, unit: StandardUnit = "Count", dims: Record<string, string> = {}) =>
    publishMetric(name, value, unit, dims),
};

export default CloudWatchMetrics;
