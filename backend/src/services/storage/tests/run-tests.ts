import { StorageValidator, UploadTypeFolders } from "../validators/storage.validator";
import { StorageValidationException } from "../errors/storage-exceptions";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function run() {
  console.log("🌱 Running Storage Module validation and naming tests...");

  // Test 1: Validate allowed MIME type and extension
  try {
    StorageValidator.validateFile("profile-pic.png", "image/png", 50000, "avatar");
    assert(true, "Allowed PNG image avatar is validated successfully");
  } catch (error) {
    assert(false, "Allowed PNG image avatar validation failed: " + (error as Error).message);
  }

  // Test 2: Reject dangerous file extensions
  try {
    StorageValidator.validateFile("script.sh", "application/x-sh", 100, "temp");
    assert(false, "Dangerous shell script should be rejected");
  } catch (error) {
    assert(error instanceof StorageValidationException, "Dangerous extension rejected with StorageValidationException");
  }

  // Test 3: Reject empty files
  try {
    StorageValidator.validateFile("empty.pdf", "application/pdf", 0, "resource");
    assert(false, "Empty file (size 0) should be rejected");
  } catch (error) {
    assert(error instanceof StorageValidationException, "Empty file rejected with StorageValidationException");
  }

  // Test 4: Reject files with path traversal sequences
  try {
    StorageValidator.validateFile("../malicious.zip", "application/zip", 1000, "resource");
    assert(false, "Path traversal attempt should be rejected");
  } catch (error) {
    assert(error instanceof StorageValidationException, "Path traversal rejected with StorageValidationException");
  }

  // Test 5: Verify upload limit size boundaries for general files
  try {
    StorageValidator.validateFile("large.pdf", "application/pdf", 60 * 1024 * 1024, "resource");
    assert(false, "50MB+ general file size should be rejected");
  } catch (error) {
    assert(error instanceof StorageValidationException, "File exceeding max size rejected");
  }

  // Test 6: Verify folder mapping folders configuration
  assert(UploadTypeFolders["avatar"] === "avatars", "Avatar maps to avatars/");
  assert(UploadTypeFolders["video"] === "lesson-videos", "Video maps to lesson-videos/");

  // Test 7: Secure key generation check
  const secureKey = StorageValidator.generateSecureKey("lesson1.mp4", "video");
  assert(secureKey.startsWith("lesson-videos/"), "Secure key contains the mapped folder name");
  assert(secureKey.endsWith(".mp4"), "Secure key retains correct extension");
  assert(secureKey.includes("-"), "Secure key uses unique UUID separator");

  console.log("\n🎉 All storage validation and naming tests passed successfully!");
}

run().catch((error) => {
  console.error("❌ Test run failed:", error);
  process.exit(1);
});
