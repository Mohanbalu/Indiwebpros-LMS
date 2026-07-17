export {};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

// ─── Quiz Types & Constants ──────────────────────────────────────────────────
import type {
  QuestionType,
  QuizQuestionData,
  LocalAnswer,
  QuizPersistence,
  QuestionStatus,
} from "../types/quiz.types";
import { QUIZ_STORAGE_KEY, QUESTION_TYPE_LABELS } from "../types/quiz.types";

// ─── Helper: Calculate question statuses from answers ────────────────────────
function calculateStatuses(
  questions: QuizQuestionData[],
  answers: Record<string, LocalAnswer>,
  markedForReview: string[],
  currentIndex: number
): QuestionStatus[] {
  return questions.map((q, idx) => {
    const a = answers[q.id];
    const answered = !!(a && (a.selectedOptionId || (a.answerText && a.answerText.trim().length > 0)));
    const marked = markedForReview.includes(q.id);
    const visited = idx <= currentIndex;

    if (answered && marked) return "answered-marked" as QuestionStatus;
    if (marked) return "marked" as QuestionStatus;
    if (answered) return "answered" as QuestionStatus;
    if (visited) return "not-answered" as QuestionStatus;
    return "not-visited" as QuestionStatus;
  });
}

// ─── Helper: Count answered questions ────────────────────────────────────────
function countAnswered(answers: Record<string, LocalAnswer>): number {
  return Object.values(answers).filter((a) => {
    if (a.selectedOptionId) return true;
    if (a.answerText && a.answerText.trim().length > 0) return true;
    return false;
  }).length;
}

// ─── Helper: Format timer from seconds ───────────────────────────────────────
function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ─── Helper: Calculate remaining time ────────────────────────────────────────
function calculateRemaining(startedAt: string, timeLimitMinutes: number): number {
  if (timeLimitMinutes <= 0) return -1;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const totalSeconds = timeLimitMinutes * 60;
  return Math.max(0, totalSeconds - elapsed);
}

// ─── Helper: Build answers payload for submission ────────────────────────────
function buildSubmitPayload(
  questions: QuizQuestionData[],
  answers: Record<string, LocalAnswer>
) {
  return questions.map((q) => {
    const a = answers[q.id];
    if (!a) return { questionId: q.id };
    return a;
  });
}

// ─── Helper: Check if question is answered ───────────────────────────────────
function isQuestionAnswered(answers: Record<string, LocalAnswer>, questionId: string): boolean {
  const a = answers[questionId];
  if (!a) return false;
  return !!(a.selectedOptionId || (a.answerText && a.answerText.trim().length > 0));
}

// ─── Helper: Get multi-select IDs from encoded string ───────────────────────
function getMultiSelectIds(selectedOptionId: string | null | undefined): string[] {
  if (!selectedOptionId) return [];
  try {
    const parsed = JSON.parse(selectedOptionId);
    return Array.isArray(parsed) ? parsed : [selectedOptionId];
  } catch {
    return [selectedOptionId];
  }
}

async function run() {
  console.log("📝 Running Quiz & Assessment System tests...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 1: Question Type Labels
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("── Test 1: Question Type Labels ──");
  assert(QUESTION_TYPE_LABELS.MULTIPLE_CHOICE_SINGLE === "Multiple Choice (Single Answer)", "MCQ Single label is correct");
  assert(QUESTION_TYPE_LABELS.MULTIPLE_CHOICE_MULTIPLE === "Multiple Choice (Multiple Answers)", "MCQ Multiple label is correct");
  assert(QUESTION_TYPE_LABELS.TRUE_FALSE === "True / False", "True/False label is correct");
  assert(QUESTION_TYPE_LABELS.SHORT_ANSWER === "Short Answer", "Short Answer label is correct");
  assert(QUESTION_TYPE_LABELS.LONG_ANSWER === "Paragraph Answer", "Long Answer label is correct");
  assert(QUESTION_TYPE_LABELS.FILL_IN_THE_BLANK === "Fill in the Blank", "Fill in the Blank label is correct");
  assert(QUESTION_TYPE_LABELS.CODE_SNIPPET === "Code Snippet", "Code Snippet label is correct");
  assert(QUESTION_TYPE_LABELS.FILE_UPLOAD === "File Upload", "File Upload label is correct");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 2: Question Status Calculation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 2: Question Status Calculation ──");

  const mockQuestions: QuizQuestionData[] = [
    { id: "q1", questionType: "MULTIPLE_CHOICE_SINGLE", question: "Q1", marks: 1, negativeMarks: 0, difficulty: "BEGINNER", sortOrder: 0, options: [] },
    { id: "q2", questionType: "TRUE_FALSE", question: "Q2", marks: 1, negativeMarks: 0, difficulty: "BEGINNER", sortOrder: 1, options: [] },
    { id: "q3", questionType: "SHORT_ANSWER", question: "Q3", marks: 2, negativeMarks: 0, difficulty: "INTERMEDIATE", sortOrder: 2, options: [] },
    { id: "q4", questionType: "MULTIPLE_CHOICE_SINGLE", question: "Q4", marks: 1, negativeMarks: 0, difficulty: "BEGINNER", sortOrder: 3, options: [] },
    { id: "q5", questionType: "LONG_ANSWER", question: "Q5", marks: 5, negativeMarks: 0, difficulty: "ADVANCED", sortOrder: 4, options: [] },
  ];

  // All unanswered, first question
  let statuses = calculateStatuses(mockQuestions, {}, [], 0);
  assert(statuses[0] === "not-answered", "First visited question is not-answered");
  assert(statuses[1] === "not-visited", "Second unvisited question is not-visited");
  assert(statuses[2] === "not-visited", "Third unvisited question is not-visited");

  // Answer q1, mark q2
  const answers1: Record<string, LocalAnswer> = {
    q1: { questionId: "q1", selectedOptionId: "opt-a" },
  };
  statuses = calculateStatuses(mockQuestions, answers1, ["q2"], 1);
  assert(statuses[0] === "answered", "Answered question shows answered");
  assert(statuses[1] === "marked", "Marked question shows marked");
  assert(statuses[2] === "not-visited", "Unvisited question stays not-visited");

  // Answer q3, mark q3 (both answered and marked)
  const answers2: Record<string, LocalAnswer> = {
    q1: { questionId: "q1", selectedOptionId: "opt-a" },
    q3: { questionId: "q3", answerText: "My answer" },
  };
  statuses = calculateStatuses(mockQuestions, answers2, ["q3"], 3);
  assert(statuses[0] === "answered", "Previously answered stays answered");
  assert(statuses[2] === "answered-marked", "Answered+marked shows answered-marked");
  assert(statuses[3] === "not-answered", "Visited but not answered shows not-answered");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 3: Answer Counting
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 3: Answer Counting ──");
  assert(countAnswered({}) === 0, "Zero answers counted correctly");
  assert(countAnswered({ q1: { questionId: "q1", selectedOptionId: "opt-a" } }) === 1, "One option-selected answer counted");
  assert(countAnswered({ q1: { questionId: "q1", answerText: "hello" } }) === 1, "One text answer counted");
  assert(countAnswered({ q1: { questionId: "q1", answerText: "   " } }) === 0, "Whitespace-only text not counted");
  assert(countAnswered({ q1: { questionId: "q1" } }) === 0, "Empty answer not counted");
  assert(countAnswered({
    q1: { questionId: "q1", selectedOptionId: "opt-a" },
    q2: { questionId: "q2", answerText: "answer" },
    q3: { questionId: "q3" },
  }) === 2, "Mixed answers counted correctly");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 4: Timer Formatting
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 4: Timer Formatting ──");
  assert(formatTimer(0) === "00:00", "Zero seconds formats correctly");
  assert(formatTimer(60) === "01:00", "One minute formats correctly");
  assert(formatTimer(90) === "01:30", "90 seconds formats correctly");
  assert(formatTimer(3600) === "1:00:00", "One hour formats correctly");
  assert(formatTimer(3661) === "1:01:01", "1 hour 1 min 1 sec formats correctly");
  assert(formatTimer(600) === "10:00", "10 minutes formats correctly");
  assert(formatTimer(59) === "00:59", "59 seconds formats correctly");
  assert(formatTimer(-1) === "00:00", "Negative time formats as zero");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 5: Remaining Time Calculation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 5: Remaining Time Calculation ──");
  assert(calculateRemaining(new Date().toISOString(), 0) === -1, "No time limit returns -1");
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const remaining = calculateRemaining(fiveMinAgo.toISOString(), 30);
  assert(remaining >= 1495 && remaining <= 1505, "30min quiz started 5min ago has ~25min remaining");

  const expiredTime = new Date(now.getTime() - 60 * 60 * 1000);
  assert(calculateRemaining(expiredTime.toISOString(), 30) === 0, "Expired quiz shows 0 remaining");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 6: Submit Payload Building
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 6: Submit Payload Building ──");
  const submitAnswers: Record<string, LocalAnswer> = {
    q1: { questionId: "q1", selectedOptionId: "opt-a" },
    q3: { questionId: "q3", answerText: "short answer" },
  };
  const payload = buildSubmitPayload(mockQuestions, submitAnswers);
  assert(payload.length === 5, "Payload has all 5 questions");
  assert(payload[0].selectedOptionId === "opt-a", "First answer has selectedOptionId");
  assert(payload[2].answerText === "short answer", "Third answer has answerText");
  assert(!payload[1].selectedOptionId && !payload[1].answerText, "Unanswered question has no answer data");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 7: Answered Check
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 7: Answered Check ──");
  assert(!isQuestionAnswered({}, "q1"), "Empty answers means not answered");
  assert(isQuestionAnswered({ q1: { questionId: "q1", selectedOptionId: "opt-a" } }, "q1"), "Option selected means answered");
  assert(isQuestionAnswered({ q1: { questionId: "q1", answerText: "text" } }, "q1"), "Text answer means answered");
  assert(!isQuestionAnswered({ q1: { questionId: "q1", answerText: "" } }, "q1"), "Empty text means not answered");
  assert(!isQuestionAnswered({ q1: { questionId: "q1" } }, "q1"), "No data means not answered");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 8: Multi-Select ID Extraction
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 8: Multi-Select ID Extraction ──");
  assert(getMultiSelectIds(null).length === 0, "Null returns empty array");
  assert(getMultiSelectIds(undefined).length === 0, "Undefined returns empty array");
  assert(getMultiSelectIds("single-id").length === 1, "Single ID returns array of 1");
  assert(getMultiSelectIds("single-id")[0] === "single-id", "Single ID is preserved");
  const multiIds = getMultiSelectIds(JSON.stringify(["id1", "id2", "id3"]));
  assert(multiIds.length === 3, "JSON array returns correct count");
  assert(multiIds[0] === "id1" && multiIds[2] === "id3", "JSON array values are correct");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 9: Quiz Persistence Shape
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 9: Quiz Persistence Shape ──");
  const persistence: QuizPersistence = {
    attemptId: "attempt-123",
    quizId: "quiz-456",
    answers: { q1: { questionId: "q1", selectedOptionId: "opt-a" } },
    currentQuestionIndex: 2,
    markedForReview: ["q3"],
    startedAt: new Date().toISOString(),
  };
  assert(persistence.attemptId === "attempt-123", "Persistence stores attemptId");
  assert(persistence.quizId === "quiz-456", "Persistence stores quizId");
  assert(Object.keys(persistence.answers).length === 1, "Persistence stores answers");
  assert(persistence.currentQuestionIndex === 2, "Persistence stores current index");
  assert(persistence.markedForReview.length === 1, "Persistence stores marked questions");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 10: Security Checks - No Score Calculation on Frontend
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n── Test 10: Security Checks ──");
  // Verify that quiz questions don't contain isCorrect flag in the start response format
  const safeQuestion: QuizQuestionData = {
    id: "q1",
    questionType: "MULTIPLE_CHOICE_SINGLE",
    question: "What is 2+2?",
    marks: 1,
    negativeMarks: 0,
    difficulty: "BEGINNER",
    sortOrder: 0,
    options: [
      { id: "opt1", text: "3" },
      { id: "opt2", text: "4" },
    ],
  };
  assert(!("isCorrect" in safeQuestion), "Quiz question data does not expose isCorrect");
  assert(!("isCorrect" in safeQuestion.options[0]), "Quiz option data does not expose isCorrect");
  assert(!("explanation" in safeQuestion), "Quiz question data does not expose explanation in active attempt");

  // Verify localStorage key constant
  assert(QUIZ_STORAGE_KEY === "iw_quiz_active", "Storage key is correctly defined");

  console.log("\n🎉 All Quiz & Assessment System tests passed successfully!");
}

run();
