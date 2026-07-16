/**
 * AWS Secrets Manager — Secret Loader
 * Milestone 24: Production Secrets Management
 *
 * In development: falls back to process.env (dotenv)
 * In production:  loads all secrets from AWS Secrets Manager
 *
 * Usage:
 *   import { loadSecrets } from "@/config/secrets";
 *   await loadSecrets(); // call BEFORE env.ts validation
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LMSSecrets {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  AWS_ACCESS_KEY?: string;
  AWS_SECRET_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SECRET_ID = "indiwebpros-lms/production";

// ─── Secret Loader ────────────────────────────────────────────────────────────

/**
 * Loads secrets from AWS Secrets Manager and merges them into process.env.
 * In development (NODE_ENV !== 'production'), this is a no-op — dotenv is used.
 *
 * @param secretId - The Secrets Manager secret name or ARN.
 *                   Falls back to AWS_SECRET_ARN env var, then default name.
 */
export async function loadSecrets(secretId?: string): Promise<void> {
  const env = process.env.NODE_ENV || "development";

  // In development/test, use .env file only
  if (env !== "production") {
    console.log("[Secrets] Development mode — using .env file. Secrets Manager skipped.");
    return;
  }

  const resolvedSecretId =
    secretId ||
    process.env.AWS_SECRET_ARN ||
    `${DEFAULT_SECRET_ID}`;

  console.log(`[Secrets] Loading secrets from AWS Secrets Manager: ${resolvedSecretId}`);

  try {
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
      // In EC2/ECS, credentials come from IAM Instance Role (no key needed)
      // In development with explicit keys:
      ...(process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY,
              secretAccessKey: process.env.AWS_SECRET_KEY,
            },
          }
        : {}),
    });

    const command = new GetSecretValueCommand({ SecretId: resolvedSecretId });
    const response: GetSecretValueCommandOutput = await client.send(command);

    let secretValue: string;

    if (response.SecretString) {
      secretValue = response.SecretString;
    } else if (response.SecretBinary) {
      secretValue = Buffer.from(response.SecretBinary as Uint8Array).toString("utf8");
    } else {
      throw new Error("Secrets Manager returned empty secret value");
    }

    // Parse JSON secret and inject into process.env
    const secrets: LMSSecrets = JSON.parse(secretValue);
    let injectedCount = 0;

    for (const [key, value] of Object.entries(secrets)) {
      if (value !== undefined && value !== null) {
        // Only override if not already set (allows env var override for debugging)
        if (!process.env[key]) {
          process.env[key] = String(value);
          injectedCount++;
        }
      }
    }

    console.log(
      `[Secrets] ✅ Successfully loaded ${injectedCount} secret(s) from Secrets Manager`
    );
  } catch (error) {
    const errMsg = (error as Error).message;

    if (errMsg.includes("ResourceNotFoundException")) {
      console.error(
        `[Secrets] ❌ Secret "${resolvedSecretId}" not found in Secrets Manager. ` +
          `Ensure the secret exists and the application role has secretsmanager:GetSecretValue permission.`
      );
    } else if (errMsg.includes("AccessDeniedException")) {
      console.error(
        `[Secrets] ❌ Access denied to secret "${resolvedSecretId}". ` +
          `Verify the IAM role/policy allows secretsmanager:GetSecretValue on this ARN.`
      );
    } else {
      console.error(`[Secrets] ❌ Failed to load secrets: ${errMsg}`);
    }

    // In production, fail fast if secrets cannot be loaded
    if (env === "production") {
      process.exit(1);
    }
  }
}

// ─── Secrets Manager Setup Helper ────────────────────────────────────────────

/**
 * Creates or updates the LMS secret in AWS Secrets Manager.
 * Run this once during infrastructure setup.
 * Usage: tsx src/config/secrets.ts --create
 */
export async function createSecret(
  secretId: string = DEFAULT_SECRET_ID,
  secretValue: LMSSecrets
): Promise<void> {
  const {
    SecretsManagerClient: SMClient,
    CreateSecretCommand,
    UpdateSecretCommand,
  } = await import("@aws-sdk/client-secrets-manager");

  const client = new SMClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  const secretString = JSON.stringify(secretValue, null, 2);

  try {
    // Try to update existing secret first
    await client.send(
      new UpdateSecretCommand({
        SecretId: secretId,
        SecretString: secretString,
        Description: "IndiWebPros LMS production secrets — managed by application",
      })
    );
    console.log(`[Secrets] ✅ Updated secret: ${secretId}`);
  } catch (error) {
    const errMsg = (error as Error).message;
    if (errMsg.includes("ResourceNotFoundException")) {
      // Create new secret
      await client.send(
        new CreateSecretCommand({
          Name: secretId,
          Description: "IndiWebPros LMS production secrets",
          SecretString: secretString,
          Tags: [
            { Key: "Application", Value: "IndiWebPros-LMS" },
            { Key: "Environment", Value: "production" },
            { Key: "ManagedBy", Value: "application" },
          ],
        })
      );
      console.log(`[Secrets] ✅ Created secret: ${secretId}`);
    } else {
      throw error;
    }
  }
}

// ─── Template: Secret JSON Structure ─────────────────────────────────────────

/**
 * Template showing the expected JSON structure for the Secrets Manager secret.
 * Store this JSON in AWS Secrets Manager under "indiwebpros-lms/production".
 */
export const SECRET_TEMPLATE: LMSSecrets = {
  DATABASE_URL: "postgresql://postgres:PASSWORD@indiwebpros-lms-db.XXXXX.us-east-1.rds.amazonaws.com:5432/postgres?schema=public",
  JWT_SECRET: "REPLACE_WITH_STRONG_JWT_SECRET_MIN_64_CHARS",
  JWT_REFRESH_SECRET: "REPLACE_WITH_STRONG_REFRESH_SECRET_MIN_64_CHARS",
  AWS_ACCESS_KEY: "AKIAXXXXXXXXXXXXXXXX",
  AWS_SECRET_KEY: "REPLACE_WITH_AWS_SECRET_KEY",
  SMTP_HOST: "email-smtp.us-east-1.amazonaws.com",
  SMTP_PORT: "587",
  SMTP_USER: "REPLACE_WITH_SES_SMTP_USERNAME",
  SMTP_PASSWORD: "REPLACE_WITH_SES_SMTP_PASSWORD",
  RAZORPAY_KEY_ID: "rzp_live_XXXXXXXXXX",
  RAZORPAY_KEY_SECRET: "REPLACE_WITH_RAZORPAY_SECRET",
  RAZORPAY_WEBHOOK_SECRET: "REPLACE_WITH_RAZORPAY_WEBHOOK_SECRET",
};
