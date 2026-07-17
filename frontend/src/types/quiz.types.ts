export type QuestionType =
  | "MULTIPLE_CHOICE_SINGLE"
  | "MULTIPLE_CHOICE_MULTIPLE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "FILL_IN_THE_BLANK"
  | "CODE_SNIPPET"
  | "FILE_UPLOAD";

export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestionData {
  id: string;
  questionType: QuestionType;
  question: string;
  marks: number;
  negativeMarks: number;
  difficulty: Difficulty;
  sortOrder: number;
  options: QuizOption[];
}

export interface StartAttemptResponse {
  attemptId: string;
  quizId: string;
  title: string;
  timeLimitMinutes: number;
  startedAt: string;
  attemptNumber: number;
  questions: QuizQuestionData[];
}

export interface ResumeAttemptFinished {
  attempt: QuizAttemptRecord;
  finished: true;
  expired?: boolean;
}

export type ResumeAttemptResponse = StartAttemptResponse | ResumeAttemptFinished;

export interface QuizAttemptRecord {
  id: string;
  userId: string;
  quizId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  status: QuizAttemptStatus;
}

export interface QuizAnswerInput {
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
}

export interface SubmitAttemptPayload {
  attemptId: string;
  answers: QuizAnswerInput[];
}

export interface QuizDetail {
  id: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  timeLimitMinutes: number;
  passingPercentage: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestionData[];
}

export interface QuizAnswerRecord {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  answerText: string | null;
  marksAwarded: number;
  isCorrect: boolean;
  question: QuizQuestionData;
}

export interface AttemptResultResponse extends QuizAttemptRecord {
  quiz: QuizDetail;
  answers: QuizAnswerRecord[];
}

export interface QuizAttemptMeta {
  attemptNumber: number;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  status: QuizAttemptStatus;
}

export interface LocalAnswer {
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
}

export interface QuizPersistence {
  attemptId: string;
  quizId: string;
  answers: Record<string, LocalAnswer>;
  currentQuestionIndex: number;
  markedForReview: string[];
  startedAt: string;
}

export const QUIZ_STORAGE_KEY = "iw_quiz_active";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE_SINGLE: "Multiple Choice (Single Answer)",
  MULTIPLE_CHOICE_MULTIPLE: "Multiple Choice (Multiple Answers)",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  LONG_ANSWER: "Paragraph Answer",
  FILL_IN_THE_BLANK: "Fill in the Blank",
  CODE_SNIPPET: "Code Snippet",
  FILE_UPLOAD: "File Upload",
};
