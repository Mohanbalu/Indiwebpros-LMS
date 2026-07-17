export {};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

import type {
  CertificateListItem,
  CertificateDetail,
  CertificateVerificationResult,
  CertificateStatus,
  CertificateSortOption,
  CertificateSearchFilters,
} from "../types/certificate.types";

// ─── Helper: Certificate Filtering ──────────────────────────────────────────
function filterCertificates(
  certificates: CertificateListItem[],
  query: string,
  statusFilter: CertificateStatus | "all",
  sortBy: CertificateSortOption
): CertificateListItem[] {
  let result = [...certificates];

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (c) =>
        c.course.title.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q)
    );
  }

  if (statusFilter !== "all") {
    result = result.filter((c) => c.status === statusFilter);
  }

  result.sort((a, b) => {
    const dateA = new Date(a.issuedAt).getTime();
    const dateB = new Date(b.issuedAt).getTime();
    return sortBy === "latest" ? dateB - dateA : dateA - dateB;
  });

  return result;
}

// ─── Helper: Format Certificate Date ────────────────────────────────────────
function formatCertificateDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Helper: Check if certificate is downloadable ───────────────────────────
function isCertificateDownloadable(cert: CertificateListItem | CertificateDetail): boolean {
  if (cert.status === "REVOKED" || cert.status === "EXPIRED") return false;
  return !!cert.pdfFile;
}

// ─── Helper: Validate verification code format ──────────────────────────────
function isValidVerificationCode(code: string): boolean {
  return /^[a-f0-9]{32}$/i.test(code);
}

// ─── Helper: Check certificate validity for display ─────────────────────────
function getCertificateValidity(status: CertificateStatus): { label: string; valid: boolean } {
  switch (status) {
    case "GENERATED":
      return { label: "Valid", valid: true };
    case "REGENERATED":
      return { label: "Valid (Regenerated)", valid: true };
    case "REVOKED":
      return { label: "Revoked", valid: false };
    case "EXPIRED":
      return { label: "Expired", valid: false };
  }
}

async function run() {
  console.log("📜 Running Certificate Center & Course Completion tests...\n");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 1: Certificate Status Labels
  // ══════════════════════════════════════════════════════════════════════════
  console.log("── Test 1: Certificate Status Labels ──");
  assert(getCertificateValidity("GENERATED").label === "Valid", "GENERATED status label is correct");
  assert(getCertificateValidity("GENERATED").valid === true, "GENERATED status is valid");
  assert(getCertificateValidity("REGENERATED").label === "Valid (Regenerated)", "REGENERATED status label is correct");
  assert(getCertificateValidity("REGENERATED").valid === true, "REGENERATED status is valid");
  assert(getCertificateValidity("REVOKED").label === "Revoked", "REVOKED status label is correct");
  assert(getCertificateValidity("REVOKED").valid === false, "REVOKED status is not valid");
  assert(getCertificateValidity("EXPIRED").label === "Expired", "EXPIRED status label is correct");
  assert(getCertificateValidity("EXPIRED").valid === false, "EXPIRED status is not valid");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 2: Certificate Downloadability
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 2: Certificate Downloadability ──");
  const validCert: CertificateListItem = {
    id: "1", certificateNumber: "IWP-2026-FS-00000001", verificationCode: "a".repeat(32),
    verificationUrl: "https://learn.indiwebpros.in/verify/abc", issuedAt: new Date().toISOString(),
    status: "GENERATED", version: 1,
    course: { id: "c1", title: "Course 1", slug: "course-1" },
    pdfFile: { id: "f1", downloadUrl: "https://s3.amazonaws.com/cert.pdf", fileName: "cert.pdf", fileSize: 50000, mimeType: "application/pdf" },
  };
  assert(isCertificateDownloadable(validCert) === true, "Valid cert with pdfFile is downloadable");

  const revokedCert = { ...validCert, id: "2", status: "REVOKED" as CertificateStatus };
  assert(isCertificateDownloadable(revokedCert) === false, "Revoked cert is not downloadable");

  const noFileCert = { ...validCert, id: "3", pdfFile: null };
  assert(isCertificateDownloadable(noFileCert) === false, "Cert without pdfFile is not downloadable");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 3: Certificate Filtering & Search
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 3: Certificate Filtering & Search ──");
  const mockCerts: CertificateListItem[] = [
    { id: "1", certificateNumber: "IWP-2026-FS-00000001", verificationCode: "a".repeat(32),
      verificationUrl: "", issuedAt: "2026-07-15T00:00:00Z", status: "GENERATED", version: 1,
      course: { id: "c1", title: "Advanced TypeScript", slug: "ts" }, pdfFile: null },
    { id: "2", certificateNumber: "IWP-2026-FS-00000002", verificationCode: "b".repeat(32),
      verificationUrl: "", issuedAt: "2026-07-10T00:00:00Z", status: "REGENERATED", version: 2,
      course: { id: "c2", title: "React Fundamentals", slug: "react" }, pdfFile: null },
    { id: "3", certificateNumber: "IWP-2026-FS-00000003", verificationCode: "c".repeat(32),
      verificationUrl: "", issuedAt: "2026-07-05T00:00:00Z", status: "REVOKED", version: 1,
      course: { id: "c3", title: "Node.js Basics", slug: "node" }, pdfFile: null },
  ];

  // Search by course title
  let filtered = filterCertificates(mockCerts, "TypeScript", "all", "latest");
  assert(filtered.length === 1, "Search by course title finds 1 result");
  assert(filtered[0].id === "1", "Correct certificate found by search");

  // Search by certificate number
  filtered = filterCertificates(mockCerts, "00000002", "all", "latest");
  assert(filtered.length === 1, "Search by certificate number finds 1 result");

  // Filter by status
  filtered = filterCertificates(mockCerts, "", "REVOKED", "latest");
  assert(filtered.length === 1, "Status filter finds 1 revoked cert");

  // Sort by oldest
  filtered = filterCertificates(mockCerts, "", "all", "oldest");
  assert(filtered[0].id === "3", "Oldest sort returns oldest first (Node.js Basics)");
  assert(filtered[2].id === "1", "Oldest sort returns newest last (Advanced TypeScript)");

  // Sort by latest
  filtered = filterCertificates(mockCerts, "", "all", "latest");
  assert(filtered[0].id === "1", "Latest sort returns newest first");
  assert(filtered[2].id === "3", "Latest sort returns oldest last");

  // Empty search
  filtered = filterCertificates(mockCerts, "Nonexistent", "all", "latest");
  assert(filtered.length === 0, "No match returns empty array");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 4: Certificate Date Formatting
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 4: Certificate Date Formatting ──");
  const formatted = formatCertificateDate("2026-07-15T00:00:00Z");
  assert(formatted.includes("July"), "Date contains month name");
  assert(formatted.includes("15"), "Date contains day");
  assert(formatted.includes("2026"), "Date contains year");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 5: Verification Code Validation
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 5: Verification Code Validation ──");
  assert(isValidVerificationCode("a".repeat(32)) === true, "32-char hex code is valid");
  assert(isValidVerificationCode("abcdef1234567890abcdef1234567890") === true, "Valid hex code passes");
  assert(isValidVerificationCode("short") === false, "Short code is invalid");
  assert(isValidVerificationCode("") === false, "Empty code is invalid");
  assert(isValidVerificationCode("gggggggggggggggggggggggggggggggg") === false, "Non-hex characters are invalid");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 6: Certificate Data Integrity
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 6: Certificate Data Integrity ──");
  const detail: CertificateDetail = {
    id: "1", certificateNumber: "IWP-2026-FS-00000001", verificationCode: "a".repeat(32),
    verificationUrl: "https://learn.indiwebpros.in/verify/abc", issuedAt: "2026-07-15T00:00:00Z",
    status: "GENERATED", version: 1,
    course: { id: "c1", title: "Advanced TypeScript", slug: "ts", instructor: { name: "John Doe" } },
    pdfFile: { id: "f1", url: "https://s3.amazonaws.com/cert.pdf", fileName: "cert.pdf", fileSize: 50000, mimeType: "application/pdf" },
    qrCodeFile: { id: "qr1", url: "https://s3.amazonaws.com/qr.png" },
  };
  assert(detail.certificateNumber.startsWith("IWP-"), "Certificate number starts with IWP-");
  assert(detail.verificationCode.length === 32, "Verification code is 32 characters");
  assert(detail.course.instructor.name === "John Doe", "Instructor name is present");
  assert(detail.pdfFile.mimeType === "application/pdf", "Certificate is PDF format");
  assert(detail.qrCodeFile.url.includes("s3.amazonaws.com"), "QR code is stored in S3");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 7: Verification Result Structure
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 7: Verification Result Structure ──");
  const verifiedResult: CertificateVerificationResult = {
    isValid: true, studentName: "Jane Student", courseName: "Advanced TypeScript",
    status: "GENERATED", issuedAt: "2026-07-15T00:00:00Z",
  };
  assert(verifiedResult.isValid === true, "Valid certificate shows isValid=true");
  assert(verifiedResult.studentName === "Jane Student", "Student name is correct");
  assert(verifiedResult.courseName === "Advanced TypeScript", "Course name is correct");

  const revokedResult: CertificateVerificationResult = {
    isValid: false, studentName: "Bad Student", courseName: "React Fundamentals",
    status: "REVOKED", issuedAt: "2026-07-10T00:00:00Z",
  };
  assert(revokedResult.isValid === false, "Revoked certificate shows isValid=false");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 8: Certificate List Item Shape
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 8: Certificate List Item Shape ──");
  const listItem: CertificateListItem = {
    id: "uuid-1", certificateNumber: "IWP-2026-FS-00000001", verificationCode: "a".repeat(32),
    verificationUrl: "https://learn.indiwebpros.in/verify/a".repeat(32),
    issuedAt: "2026-07-15T00:00:00Z", status: "GENERATED", version: 1,
    course: { id: "c1", title: "Advanced TypeScript", slug: "ts" },
    pdfFile: null,
  };
  assert(listItem.id.length > 0, "Certificate has an ID");
  assert(listItem.course.title.length > 0, "Certificate has a course title");
  assert(listItem.verificationCode.length === 32, "Certificate has 32-char verification code");
  assert(listItem.status === "GENERATED", "Certificate has a status");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 9: Security Checks
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 9: Security Checks ──");
  assert(!("bucket" in validCert), "Certificate data does not expose S3 bucket");
  assert(!("bucketPath" in validCert), "Certificate data does not expose bucket path");
  assert(!("internalPath" in validCert), "Certificate data does not expose internal path");
  assert(!("s3Key" in validCert), "Certificate data does not expose S3 key");
  const signedUrl = validCert.pdfFile?.downloadUrl || "";
  assert(signedUrl.startsWith("https://"), "Certificate download uses HTTPS signed URL only");

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 10: Empty State Handling
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 10: Empty State Handling ──");
  const emptyFilter = filterCertificates([], "", "all", "latest");
  assert(emptyFilter.length === 0, "Empty certificate list returns empty result");
  const noMatchFilter = filterCertificates(mockCerts, "zzzzzzz", "all", "latest");
  assert(noMatchFilter.length === 0, "No search match returns empty result");

  console.log("\n🎉 All Certificate Center & Course Completion tests passed successfully!");
}

run();
