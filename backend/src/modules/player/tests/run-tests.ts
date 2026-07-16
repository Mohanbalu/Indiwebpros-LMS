import {
  videoProgressSchema,
  pdfProgressSchema,
  articleProgressSchema,
  bookmarkSchema,
  createNoteSchema,
  updateNoteSchema,
  playerFilterSchema,
} from "../validators/player.validator";

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
  console.log("🎬 Running Course Player & Learning Experience Module tests...\n");

  // ── Video Progress Validator ──
  console.log("── Video Progress Validator ──");
  const validVideo = videoProgressSchema.parse({
    lessonId: "123e4567-e89b-12d3-a456-426614174000",
    positionSeconds: "50",
    durationSeconds: "100",
  });
  assert(validVideo.lessonId === "123e4567-e89b-12d3-a456-426614174000", "Valid UUID parsed");
  assert(validVideo.positionSeconds === 50, "Position seconds coerced to number");
  assert(validVideo.durationSeconds === 100, "Duration coerced to number");

  assertThrows(
    () => videoProgressSchema.parse({ lessonId: "invalid-uuid", positionSeconds: 10, durationSeconds: 100 }),
    "Rejects invalid lesson ID UUID"
  );
  assertThrows(
    () => videoProgressSchema.parse({ lessonId: "123e4567-e89b-12d3-a456-426614174000", positionSeconds: -1, durationSeconds: 100 }),
    "Rejects negative position seconds"
  );

  // ── PDF Progress Validator ──
  console.log("\n── PDF Progress Validator ──");
  const validPdf = pdfProgressSchema.parse({
    lessonId: "123e4567-e89b-12d3-a456-426614174000",
    pageNumber: "5",
    totalPages: "10",
  });
  assert(validPdf.pageNumber === 5, "Page number coerced");
  assert(validPdf.totalPages === 10, "Total pages coerced");

  assertThrows(
    () => pdfProgressSchema.parse({ lessonId: "123e4567-e89b-12d3-a456-426614174000", pageNumber: 0, totalPages: 10 }),
    "Rejects zero page number"
  );

  // ── Article Progress Validator ──
  console.log("\n── Article Progress Validator ──");
  const validArticle = articleProgressSchema.parse({
    lessonId: "123e4567-e89b-12d3-a456-426614174000",
    completed: true,
  });
  assert(validArticle.completed === true, "Valid completed boolean parsed");

  // ── Notes Validator ──
  console.log("\n── Notes Validator ──");
  const validNote = createNoteSchema.parse({
    lessonId: "123e4567-e89b-12d3-a456-426614174000",
    content: "This is a notes highlight.",
    videoTimestamp: "25",
  });
  assert(validNote.content === "This is a notes highlight.", "Content parsed successfully");
  assert(validNote.videoTimestamp === 25, "Timestamp coerced successfully");

  assertThrows(
    () => createNoteSchema.parse({ lessonId: "123e4567-e89b-12d3-a456-426614174000", content: "" }),
    "Rejects empty note contents"
  );

  // ── Access Control Enrollment Checks ──
  console.log("\n── Access Control Enrollment Checks ──");
  const validateAccess = (enrollment: { status: string; expiresAt: Date | null } | null, role: string, isCreator: boolean) => {
    if (role === "Admin") return true;
    if (role === "Instructor" && isCreator) return true;
    
    if (!enrollment) return false;
    const now = new Date();
    return enrollment.status === "ACTIVE" && (enrollment.expiresAt === null || enrollment.expiresAt > now);
  };

  const activeEnrollment = { status: "ACTIVE", expiresAt: null };
  const expiredEnrollment = { status: "ACTIVE", expiresAt: new Date(Date.now() - 10_000) };
  const cancelledEnrollment = { status: "CANCELLED", expiresAt: null };

  assert(validateAccess(activeEnrollment, "Student", false) === true, "Active student enrollment allowed");
  assert(validateAccess(expiredEnrollment, "Student", false) === false, "Expired student enrollment blocked");
  assert(validateAccess(cancelledEnrollment, "Student", false) === false, "Cancelled student enrollment blocked");
  assert(validateAccess(null, "Student", false) === false, "Unenrolled student blocked");
  assert(validateAccess(null, "Instructor", true) === true, "Instructor creator allowed without enrollment");
  assert(validateAccess(null, "Instructor", false) === false, "Instructor non-creator blocked without enrollment");
  assert(validateAccess(null, "Admin", false) === true, "Admin allowed without enrollment");

  // ── Progress Threshold Calculation ──
  console.log("\n── Progress Threshold Calculation ──");
  const isVideoCompleted = (pos: number, dur: number) => {
    const watchPct = (pos / dur) * 100;
    return watchPct >= 90.0;
  };

  assert(isVideoCompleted(89, 100) === false, "Video incomplete at 89%");
  assert(isVideoCompleted(90, 100) === true, "Video completed at 90%");
  assert(isVideoCompleted(95, 100) === true, "Video completed at 95%");

  // ── Note Ownership IDOR Simulation ──
  console.log("\n── Note Ownership IDOR Simulation ──");
  const checkNoteOwnership = (noteOwnerId: string, reqUserId: string) => {
    return noteOwnerId === reqUserId;
  };

  assert(checkNoteOwnership("student-1", "student-1") === true, "Owner student allowed to modify note");
  assert(checkNoteOwnership("student-1", "student-2") === false, "Attacker student blocked from modifying note");

  console.log("\n🎉 All Course Player & Learning Experience Module tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test run failed:", err.message);
  process.exit(1);
});
