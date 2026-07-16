import { z } from "zod";
import { QuestionType, QuestionBankCategory, CourseStatus, CourseDifficulty } from "@/generated/client";

export const quizSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  moduleId: z.string().uuid("Invalid module ID").optional(),
  lessonId: z.string().uuid("Invalid lesson ID").optional(),
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  timeLimitMinutes: z.coerce.number().int().nonnegative().default(0),
  passingPercentage: z.coerce.number().min(0).max(100).default(60.0),
  maxAttempts: z.coerce.number().int().nonnegative().default(3),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
});

export const quizQuestionSchema = z.object({
  questionType: z.nativeEnum(QuestionType),
  question: z.string().trim().min(5, "Question text must be at least 5 characters"),
  explanation: z.string().trim().optional(),
  marks: z.coerce.number().positive().default(1.0),
  negativeMarks: z.coerce.number().nonnegative().default(0.0),
  difficulty: z.nativeEnum(CourseDifficulty).default(CourseDifficulty.BEGINNER),
  sortOrder: z.coerce.number().int().default(0),
});

export const quizOptionSchema = z.object({
  text: z.string().trim().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const startQuizAttemptSchema = z.object({
  quizId: z.string().uuid("Invalid quiz ID"),
});

export const quizAnswerInputSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  selectedOptionId: z.string().uuid("Invalid option ID").optional(),
  answerText: z.string().trim().optional(),
});

export const submitQuizAttemptSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID"),
  answers: z.array(quizAnswerInputSchema).min(1, "At least one answer must be submitted"),
});

export const assignmentSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  moduleId: z.string().uuid("Invalid module ID").optional(),
  lessonId: z.string().uuid("Invalid lesson ID").optional(),
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  instructions: z.string().trim().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  maxMarks: z.coerce.number().positive().default(100.0),
  allowLateSubmission: z.boolean().default(true),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  fileId: z.string().uuid("Invalid file ID").optional().nullable(),
  submissionText: z.string().trim().optional().nullable(),
});

export const reviewAssignmentSchema = z.object({
  marks: z.coerce.number().nonnegative("Marks must be positive"),
  feedback: z.string().trim().min(5, "Feedback must be at least 5 characters"),
  status: z.enum(["GRADED", "REJECTED"]).default("GRADED"),
});

export const questionBankSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  category: z.nativeEnum(QuestionBankCategory).default(QuestionBankCategory.CUSTOM),
});

export type QuizInput = z.infer<typeof quizSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type QuizOptionInput = z.infer<typeof quizOptionSchema>;
export type StartAttemptInput = z.infer<typeof startQuizAttemptSchema>;
export type SubmitAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type ReviewAssignmentInput = z.infer<typeof reviewAssignmentSchema>;
export type QuestionBankInput = z.infer<typeof questionBankSchema>;
