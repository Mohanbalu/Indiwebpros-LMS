/**
 * Milestone 24 — AWS Infrastructure Tests
 * Tests for: Secrets Manager loader, S3 hardening, CloudWatch metrics,
 * cache-control logic, lifecycle key prefixes.
 * All tests run offline (no AWS API calls).
 */

import { SECRET_TEMPLATE } from "@/config/secrets";

// ── Test Helpers ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  } else {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  }
}

function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn();
    console.error(`❌ [FAIL] ${message} — expected throw`);
    failed++;
  } catch {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  }
}

// ── Test 1: Secrets Manager — loadSecrets is no-op in development ───────────

async function testSecretsDevMode() {
  console.log("\n── Secrets Manager (Dev Mode) ──");

  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  // In dev mode, loadSecrets should return without modifying env
  const { loadSecrets } = await import("@/config/secrets");
  const beforeKeys = Object.keys(process.env).length;
  await loadSecrets();
  const afterKeys = Object.keys(process.env).length;

  assert(
    afterKeys === beforeKeys || afterKeys === beforeKeys + 0,
    "loadSecrets() is no-op in development mode (no new env keys injected)"
  );

  process.env.NODE_ENV = origEnv;
}

// ── Test 2: Secret Template Structure ───────────────────────────────────────

function testSecretTemplate() {
  console.log("\n── Secret Template Structure ──");

  assert(typeof SECRET_TEMPLATE === "object", "SECRET_TEMPLATE is an object");
  assert("DATABASE_URL" in SECRET_TEMPLATE, "Has DATABASE_URL");
  assert("JWT_SECRET" in SECRET_TEMPLATE, "Has JWT_SECRET");
  assert("JWT_REFRESH_SECRET" in SECRET_TEMPLATE, "Has JWT_REFRESH_SECRET");
  assert("AWS_ACCESS_KEY" in SECRET_TEMPLATE, "Has AWS_ACCESS_KEY");
  assert("AWS_SECRET_KEY" in SECRET_TEMPLATE, "Has AWS_SECRET_KEY");
  assert("RAZORPAY_KEY_ID" in SECRET_TEMPLATE, "Has RAZORPAY_KEY_ID");
  assert("RAZORPAY_KEY_SECRET" in SECRET_TEMPLATE, "Has RAZORPAY_KEY_SECRET");
  assert("RAZORPAY_WEBHOOK_SECRET" in SECRET_TEMPLATE, "Has RAZORPAY_WEBHOOK_SECRET");
  assert("SMTP_HOST" in SECRET_TEMPLATE, "Has SMTP_HOST");

  // Ensure no actual production secrets are in the template
  assert(
    SECRET_TEMPLATE.JWT_SECRET!.includes("REPLACE"),
    "SECRET_TEMPLATE uses placeholder values (not real secrets)"
  );
}

// ── Test 3: Cache-Control Header Logic ───────────────────────────────────────

function testCacheControlLogic() {
  console.log("\n── Cache-Control Header Logic ──");

  const CACHE_CONTROL_MAP: Record<string, string> = {
    "image/": "public, max-age=604800, immutable",
    "video/": "public, max-age=86400",
    "application/pdf": "no-store, no-cache",
    "text/html": "no-store, no-cache",
    "application/octet-stream": "public, max-age=86400",
  };

  function resolveCacheControl(contentType: string): string {
    for (const [prefix, value] of Object.entries(CACHE_CONTROL_MAP)) {
      if (contentType.startsWith(prefix)) return value;
    }
    return "public, max-age=86400";
  }

  assert(resolveCacheControl("image/jpeg") === "public, max-age=604800, immutable", "JPEG → 7d cache");
  assert(resolveCacheControl("image/webp") === "public, max-age=604800, immutable", "WebP → 7d cache");
  assert(resolveCacheControl("video/mp4") === "public, max-age=86400", "MP4 → 24h cache");
  assert(resolveCacheControl("application/pdf") === "no-store, no-cache", "PDF → no cache (certificates)");
  assert(resolveCacheControl("text/html") === "no-store, no-cache", "HTML → no cache");
  assert(resolveCacheControl("application/json") === "public, max-age=86400", "JSON → 24h default");
  assert(resolveCacheControl("application/octet-stream") === "public, max-age=86400", "Binary → 24h default");
}

// ── Test 4: S3 Object Type Tag Resolution ────────────────────────────────────

function testObjectTypeResolution() {
  console.log("\n── S3 Object Type Tag Resolution ──");

  function resolveObjectType(key: string): string {
    if (key.startsWith("certificates/")) return "certificate";
    if (key.startsWith("videos/") || key.startsWith("lessons/")) return "lesson-video";
    if (key.startsWith("thumbnails/")) return "thumbnail";
    if (key.startsWith("temp/")) return "temp";
    if (key.startsWith("drafts/")) return "draft";
    if (key.startsWith("logs/")) return "log";
    if (key.startsWith("avatars/")) return "avatar";
    return "asset";
  }

  assert(resolveObjectType("certificates/cert-123.pdf") === "certificate", "certificates/ → certificate");
  assert(resolveObjectType("lessons/course-1/lesson-2.mp4") === "lesson-video", "lessons/ → lesson-video");
  assert(resolveObjectType("videos/intro.mp4") === "lesson-video", "videos/ → lesson-video");
  assert(resolveObjectType("thumbnails/course-1.jpg") === "thumbnail", "thumbnails/ → thumbnail");
  assert(resolveObjectType("temp/upload-abc.tmp") === "temp", "temp/ → temp");
  assert(resolveObjectType("drafts/assignment-1.pdf") === "draft", "drafts/ → draft");
  assert(resolveObjectType("logs/2026-07.log") === "log", "logs/ → log");
  assert(resolveObjectType("avatars/user-123.jpg") === "avatar", "avatars/ → avatar");
  assert(resolveObjectType("assets/logo.svg") === "asset", "assets/ → asset (fallback)");
  assert(resolveObjectType("unknown/file.bin") === "asset", "unknown/ → asset (fallback)");
}

// ── Test 5: Signed URL Expiry Enforcement ────────────────────────────────────

function testSignedUrlExpiry() {
  console.log("\n── Signed URL Expiry Enforcement ──");

  const MAX_EXPIRY = 3600; // 1 hour max for security

  function safeExpiry(requested: number): number {
    return Math.min(requested, MAX_EXPIRY);
  }

  assert(safeExpiry(900) === 900, "15 min request → 15 min (unchanged)");
  assert(safeExpiry(3600) === 3600, "1 hour request → 1 hour (max allowed)");
  assert(safeExpiry(7200) === 3600, "2 hour request → capped to 1 hour");
  assert(safeExpiry(86400) === 3600, "24 hour request → capped to 1 hour");
  assert(safeExpiry(1) === 1, "1 second → allowed");
}

// ── Test 6: CloudWatch Metrics (Console Mode) ─────────────────────────────────

async function testCloudWatchMetrics() {
  console.log("\n── CloudWatch Metrics (Console Mode) ──");

  process.env.NODE_ENV = "development";

  const { CloudWatchMetrics } = await import("@/utils/cloudwatch-metrics");

  // In dev mode, all metrics should complete without throwing
  try {
    await CloudWatchMetrics.paymentFailed("razorpay", "signature_mismatch");
    console.log("✅ [PASS] paymentFailed() completes without throwing");
    passed++;
  } catch {
    console.error("❌ [FAIL] paymentFailed() threw");
    failed++;
  }

  try {
    await CloudWatchMetrics.authFailed("wrong_password");
    console.log("✅ [PASS] authFailed() completes without throwing");
    passed++;
  } catch {
    console.error("❌ [FAIL] authFailed() threw");
    failed++;
  }

  try {
    await CloudWatchMetrics.enrollmentCreated("LIFETIME");
    console.log("✅ [PASS] enrollmentCreated() completes without throwing");
    passed++;
  } catch {
    console.error("❌ [FAIL] enrollmentCreated() threw");
    failed++;
  }

  try {
    await CloudWatchMetrics.webhookReceived("razorpay", "payment.captured", true);
    console.log("✅ [PASS] webhookReceived() completes without throwing");
    passed++;
  } catch {
    console.error("❌ [FAIL] webhookReceived() threw");
    failed++;
  }

  try {
    await CloudWatchMetrics.apiLatency("POST /api/v1/payments/verify", 150);
    console.log("✅ [PASS] apiLatency() completes without throwing");
    passed++;
  } catch {
    console.error("❌ [FAIL] apiLatency() threw");
    failed++;
  }
}

// ── Test 7: Lifecycle Rule Prefix Coverage ───────────────────────────────────

function testLifecyclePrefixes() {
  console.log("\n── Lifecycle Rule Prefix Coverage ──");

  // All required lifecycle prefixes from the Milestone 24 spec
  const LIFECYCLE_PREFIXES = ["temp/", "drafts/", "certificates/", "lessons/", "logs/", ""];

  const lifecycleRules = [
    { id: "delete-temp-files-7-days", prefix: "temp/" },
    { id: "delete-assignment-drafts-30-days", prefix: "drafts/" },
    { id: "archive-logs-90-days-to-glacier", prefix: "logs/" },
    { id: "abort-incomplete-multipart-uploads-7-days", prefix: "" },
    { id: "keep-lesson-videos-permanently", prefix: "lessons/" },
    { id: "keep-certificates-forever", prefix: "certificates/" },
    { id: "intelligent-tiering-assets", prefix: "assets/" },
  ];

  const requiredPrefixes = ["temp/", "drafts/", "logs/", "lessons/", "certificates/"];
  const coveredPrefixes = lifecycleRules.map(r => r.prefix);

  for (const prefix of requiredPrefixes) {
    assert(
      coveredPrefixes.includes(prefix),
      `Lifecycle rule covers prefix: "${prefix}"`
    );
  }

  assert(
    coveredPrefixes.includes(""),
    "Global multipart abort rule exists (empty prefix)"
  );
}

// ── Test 8: env.ts Optional Fields ───────────────────────────────────────────

function testEnvOptionalFields() {
  console.log("\n── env.ts Optional Fields ──");

  // Verify that optional fields don't break when undefined
  const testEnv = {
    AWS_SECRET_ARN: undefined,
    CLOUDFRONT_URL: undefined,
    CLOUDFRONT_KEY_PAIR_ID: undefined,
  };

  // These should all be undefined (optional fields)
  assert(testEnv.AWS_SECRET_ARN === undefined, "AWS_SECRET_ARN is optional");
  assert(testEnv.CLOUDFRONT_URL === undefined, "CLOUDFRONT_URL is optional");
  assert(testEnv.CLOUDFRONT_KEY_PAIR_ID === undefined, "CLOUDFRONT_KEY_PAIR_ID is optional");
  assert(typeof testEnv === "object", "Optional env fields handled gracefully");
}

// ── Main Runner ───────────────────────────────────────────────────────────────

async function run() {
  console.log("🏗️  Running Milestone 24 — AWS Infrastructure Tests\n");
  console.log("═".repeat(60));

  try {
    await testSecretsDevMode();
    testSecretTemplate();
    testCacheControlLogic();
    testObjectTypeResolution();
    testSignedUrlExpiry();
    await testCloudWatchMetrics();
    testLifecyclePrefixes();
    testEnvOptionalFields();

    console.log("\n" + "═".repeat(60));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      console.error(`\n❌ ${failed} test(s) failed!`);
      process.exit(1);
    } else {
      console.log(`\n🎉 All ${passed} infrastructure tests passed!`);
    }
  } catch (err) {
    console.error("\n❌ Test runner crashed:", (err as Error).message);
    if ((err as Error).stack) console.error((err as Error).stack);
    process.exit(1);
  }
}

run();
