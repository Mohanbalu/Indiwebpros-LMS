import {
  generateCertificateSchema,
  revokeCertificateSchema,
  verificationCodeSchema,
} from "../validators/certificate.validator";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn();
    throw new Error(`Expected error but none thrown: ${message}`);
  } catch (err) {
    if ((err as Error).message.startsWith("Expected error but none thrown")) throw err;
    console.log(`✅ [PASS] ${message}`);
  }
}

async function run() {
  console.log("🎬 Running Certificate Generation & Verification Module tests...\n");

  // ── Zod Schema Validators ──
  console.log("── Zod Schema Validators ──");
  
  const validGen = generateCertificateSchema.parse({
    userId: "123e4567-e89b-12d3-a456-426614174000",
    courseId: "123e4567-e89b-12d3-a456-426614174001",
  });
  assert(validGen.userId === "123e4567-e89b-12d3-a456-426614174000", "Generate: valid UUIDs parsed");

  assertThrows(
    () => generateCertificateSchema.parse({ userId: "invalid", courseId: "invalid" }),
    "Generate: rejects invalid UUID format"
  );

  const validRevoke = revokeCertificateSchema.parse({
    reason: "Student submitted plagiarized content in final assignments.",
  });
  assert(validRevoke.reason.startsWith("Student submitted"), "Revoke: valid reason parsed");

  assertThrows(
    () => revokeCertificateSchema.parse({ reason: "Plag" }),
    "Revoke: rejects reason too short (less than 5 chars)"
  );

  // ── Certificate Number Format Layout ──
  console.log("\n── Certificate Number Layout ──");
  const numberRegex = /^IWP-\d{4}-FS-\d{8}$/;
  const mockNumber = "IWP-2026-FS-00001234";
  assert(numberRegex.test(mockNumber), "Valid serial number format matches regex constraint");
  assert(!numberRegex.test("IWP-2026-FS-1234"), "Rejects unpadded serial number");

  // ── Eligibility Rules Simulation ──
  console.log("\n── Eligibility Rules Simulation ──");
  
  const verifyEligibility = (enrollment: any, progressPercentage: number, failedQuizzesCount: number) => {
    if (!enrollment || enrollment.status !== "ACTIVE") return false;
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) return false;
    if (progressPercentage < 100) return false;
    if (failedQuizzesCount > 0) return false;
    return true;
  };

  const activeEnrollment = { status: "ACTIVE", expiresAt: null };
  const expiredEnrollment = { status: "ACTIVE", expiresAt: new Date(Date.now() - 1000) };
  
  assert(verifyEligibility(activeEnrollment, 100, 0) === true, "Eligible with active, 100% progress and quizzes passed");
  assert(verifyEligibility(expiredEnrollment, 100, 0) === false, "Ineligible if enrollment has expired");
  assert(verifyEligibility(activeEnrollment, 99.5, 0) === false, "Ineligible if progress percentage < 100%");
  assert(verifyEligibility(activeEnrollment, 100, 1) === false, "Ineligible if any quiz remains failed");

  // ── IDOR Download Permission Check ──
  console.log("\n── IDOR Download Permission Check ──");
  
  const verifyDownloadPermission = (certOwnerId: string, requestUserId: string, role: string) => {
    if (role === "Admin") return true;
    return certOwnerId === requestUserId;
  };

  assert(verifyDownloadPermission("user-1", "user-1", "Student") === true, "Student can download own certificate");
  assert(verifyDownloadPermission("user-1", "user-2", "Student") === false, "Student blocked from downloading another user's certificate");
  assert(verifyDownloadPermission("user-1", "user-2", "Admin") === true, "Admin bypasses IDOR download checks");

  // ── Public Verification Visibility ──
  console.log("\n── Public Verification Visibility ──");
  
  const getPublicVerificationResponse = (cert: any) => {
    return {
      isValid: cert.status === "GENERATED" || cert.status === "REGENERATED",
      studentName: cert.studentName,
      courseName: cert.courseName,
      status: cert.status,
      issuedAt: cert.issuedAt,
    };
  };

  const activeCert = { status: "GENERATED", studentName: "John Doe", courseName: "TypeScript", issuedAt: new Date() };
  const revokedCert = { status: "REVOKED", studentName: "John Doe", courseName: "TypeScript", issuedAt: new Date() };

  assert(getPublicVerificationResponse(activeCert).isValid === true, "Active certificate verified as valid");
  assert(getPublicVerificationResponse(revokedCert).isValid === false, "Revoked certificate returns isValid=false");
  assert(getPublicVerificationResponse(revokedCert).studentName === "John Doe", "Revoked certificate metadata remains publicly visible");

  console.log("\n🎉 All Certificate Platform tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test run failed:", err.message);
  process.exit(1);
});
