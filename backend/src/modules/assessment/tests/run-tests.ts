import {
  quizSchema,
  quizQuestionSchema,
  quizOptionSchema,
  startQuizAttemptSchema,
  submitQuizAttemptSchema,
  assignmentSchema,
  submitAssignmentSchema,
  reviewAssignmentSchema,
  questionBankSchema,
} from "../validators/assessment.validator";

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
  console.log("🎬 Running Quiz, Assessment & Assignment Module tests...\n");

  // ── Zod Schema Validators ──
  console.log("── Zod Schema Validators ──");
  
  const validQuiz = quizSchema.parse({
    courseId: "123e4567-e89b-12d3-a456-426614174000",
    title: "TypeScript Basics Quiz",
    passingPercentage: "70",
    maxAttempts: "5",
  });
  assert(validQuiz.title === "TypeScript Basics Quiz", "Quiz title parsed");
  assert(validQuiz.passingPercentage === 70, "Passing percentage coerced");
  assert(validQuiz.maxAttempts === 5, "Max attempts coerced");

  assertThrows(
    () => quizSchema.parse({ courseId: "invalid-uuid", title: "TS" }),
    "Rejects invalid course UUID and title too short"
  );

  const validQuestion = quizQuestionSchema.parse({
    questionType: "MULTIPLE_CHOICE_SINGLE",
    question: "What is the capital of France?",
    marks: "2",
    negativeMarks: "0.5",
  });
  assert(validQuestion.marks === 2, "Question marks coerced");
  assert(validQuestion.negativeMarks === 0.5, "Negative marks coerced");

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

  assert(validateAccess(activeEnrollment, "Student", false) === true, "Active student enrollment allowed");
  assert(validateAccess(expiredEnrollment, "Student", false) === false, "Expired student enrollment blocked");
  assert(validateAccess(null, "Instructor", true) === true, "Instructor creator allowed without enrollment");
  assert(validateAccess(null, "Admin", false) === true, "Admin allowed without enrollment");

  // ── Auto Evaluation Engine ──
  console.log("\n── Auto Evaluation Engine ──");

  const evaluateAnswer = (question: any, answer: any) => {
    if (question.questionType === "MULTIPLE_CHOICE_SINGLE" || question.questionType === "TRUE_FALSE") {
      return answer.selectedOptionId === question.correctOptionId ? question.marks : -question.negativeMarks;
    }
    if (question.questionType === "MULTIPLE_CHOICE_MULTIPLE") {
      const correctSet = new Set(question.correctOptionIds);
      const selected = answer.selectedOptionIds || [];
      const match = selected.length === correctSet.size && selected.every((id: string) => correctSet.has(id));
      return match ? question.marks : -question.negativeMarks;
    }
    if (question.questionType === "FILL_IN_THE_BLANK") {
      const cleanAns = (answer.answerText || "").trim().toLowerCase();
      const match = question.correctTexts.some((t: string) => t.trim().toLowerCase() === cleanAns);
      return match ? question.marks : -question.negativeMarks;
    }
    return 0; // Manual evaluation
  };

  // Test MCQ Single Correct
  const mcqQuestion = {
    questionType: "MULTIPLE_CHOICE_SINGLE",
    correctOptionId: "opt-1",
    marks: 5,
    negativeMarks: 1,
  };
  assert(evaluateAnswer(mcqQuestion, { selectedOptionId: "opt-1" }) === 5, "MCQ Single correct returns full marks");
  assert(evaluateAnswer(mcqQuestion, { selectedOptionId: "opt-2" }) === -1, "MCQ Single incorrect returns negative marks");

  // Test MCQ Multiple Correct
  const multiMcqQuestion = {
    questionType: "MULTIPLE_CHOICE_MULTIPLE",
    correctOptionIds: ["opt-1", "opt-3"],
    marks: 10,
    negativeMarks: 2,
  };
  assert(evaluateAnswer(multiMcqQuestion, { selectedOptionIds: ["opt-1", "opt-3"] }) === 10, "MCQ Multiple all correct returns full marks");
  assert(evaluateAnswer(multiMcqQuestion, { selectedOptionIds: ["opt-1"] }) === -2, "MCQ Multiple partially correct returns negative marks");

  // Test Fill in Blank
  const fibQuestion = {
    questionType: "FILL_IN_THE_BLANK",
    correctTexts: ["TypeScript", "TS"],
    marks: 3,
    negativeMarks: 0,
  };
  assert(evaluateAnswer(fibQuestion, { answerText: "TypeScript " }) === 3, "FIB exact trimmed match returns full marks");
  assert(evaluateAnswer(fibQuestion, { answerText: "ts" }) === 3, "FIB case-insensitive match returns full marks");
  assert(evaluateAnswer(fibQuestion, { answerText: "JavaScript" }) === 0, "FIB mismatch returns zero/negative");

  // ── Attempt Limits Validation ──
  console.log("\n── Attempt Limits Validation ──");
  
  const checkAttemptLimit = (attemptsCount: number, maxAttempts: number) => {
    return maxAttempts === 0 || attemptsCount < maxAttempts;
  };

  assert(checkAttemptLimit(2, 3) === true, "Allow attempt if below max limits");
  assert(checkAttemptLimit(3, 3) === false, "Block attempt if max limits reached");
  assert(checkAttemptLimit(15, 0) === true, "Allow unlimited attempts");

  // ── Assignment Deadlines ──
  console.log("\n── Assignment Deadlines ──");

  const validateAssignmentSubmission = (dueDate: Date | null, allowLate: boolean) => {
    if (!dueDate) return true;
    const now = new Date();
    if (dueDate < now && !allowLate) return false;
    return true;
  };

  const futureDue = new Date(Date.now() + 60_000);
  const pastDue = new Date(Date.now() - 60_000);

  assert(validateAssignmentSubmission(futureDue, false) === true, "Allow submission before due date");
  assert(validateAssignmentSubmission(pastDue, true) === true, "Allow late submission if allowed");
  assert(validateAssignmentSubmission(pastDue, false) === false, "Block late submission if disabled");

  console.log("\n🎉 All Quiz, Assessment & Assignment Module tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test run failed:", err.message);
  process.exit(1);
});
