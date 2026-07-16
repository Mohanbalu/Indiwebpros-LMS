import { prisma } from "@/database/client";
import {
  Quiz,
  QuizAttempt,
  QuizAttemptStatus,
  QuestionType,
  EnrollmentStatus,
  CourseStatus,
} from "@/generated/client";
import { NotFoundError, ForbiddenError, ValidationError } from "@/errors/custom-errors";
import {
  QuizAttemptLimitExceededException,
  QuizExpiredException,
  EnrollmentRequiredException,
  QuestionNotFoundException,
} from "../errors/assessment-exceptions";
import { SubmitAttemptInput, QuizInput, QuizQuestionInput, QuizOptionInput } from "../validators/assessment.validator";
import { ServiceContainer } from "@/services/shared/service-container";

export class QuizService {
  async validateEnrollment(userId: string, courseId: string, role: string): Promise<void> {
    if (role === "Admin") return;

    if (role === "Instructor") {
      const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
      if (course && course.instructorId === userId) return;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!enrollment) throw new EnrollmentRequiredException();

    if (enrollment.expiresAt !== null && enrollment.expiresAt < new Date()) {
      throw new EnrollmentRequiredException("Enrollment has expired");
    }
  }

  // Shuffle Helper
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async startQuizAttempt(userId: string, role: string, quizId: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, deletedAt: null },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) throw new NotFoundError("Quiz not found");
    if (role === "Student" && quiz.status !== CourseStatus.PUBLISHED) {
      throw new ForbiddenError("This quiz is currently in draft mode");
    }

    await this.validateEnrollment(userId, quiz.courseId, role);

    // Count attempts
    const attemptsCount = await prisma.quizAttempt.count({
      where: { userId, quizId },
    });

    if (quiz.maxAttempts > 0 && attemptsCount >= quiz.maxAttempts) {
      throw new QuizAttemptLimitExceededException();
    }

    // Check for existing active attempt (IN_PROGRESS)
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizId, status: QuizAttemptStatus.IN_PROGRESS },
    });

    if (activeAttempt) {
      return this.formatAttemptQuestions(quiz, activeAttempt);
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        attemptNumber: attemptsCount + 1,
        status: QuizAttemptStatus.IN_PROGRESS,
      },
    });

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "QUIZ_STARTED",
        resource: "QuizAttempt",
        resourceId: attempt.id,
        details: { attemptNumber: attempt.attemptNumber },
        status: "SUCCESS",
      });
    } catch {}

    return this.formatAttemptQuestions(quiz, attempt);
  }

  private formatAttemptQuestions(quiz: any, attempt: QuizAttempt) {
    let questions = quiz.questions.map((q: any) => {
      let options = q.options;
      if (quiz.shuffleOptions) {
        options = this.shuffle(options);
      }
      return {
        id: q.id,
        questionType: q.questionType,
        question: q.question,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        difficulty: q.difficulty,
        sortOrder: q.sortOrder,
        options: options.map((opt: any) => ({ id: opt.id, text: opt.text })),
      };
    });

    if (quiz.shuffleQuestions) {
      questions = this.shuffle(questions);
    }

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      title: quiz.title,
      timeLimitMinutes: quiz.timeLimitMinutes,
      startedAt: attempt.startedAt,
      attemptNumber: attempt.attemptNumber,
      questions,
    };
  }

  async resumeQuizAttempt(userId: string, attemptId: string) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundError("Quiz attempt not found");
    if (attempt.userId !== userId) throw new ForbiddenError("Unauthorized attempt access");

    if (attempt.status !== QuizAttemptStatus.IN_PROGRESS) {
      return { attempt, finished: true };
    }

    // Enforce time limit check
    if (attempt.quiz.timeLimitMinutes > 0) {
      const timeLimitMs = attempt.quiz.timeLimitMinutes * 60 * 1000;
      const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();

      if (elapsedMs > timeLimitMs) {
        // Auto-submit expired attempt
        return this.autoSubmitExpiredAttempt(attemptId);
      }
    }

    return this.formatAttemptQuestions(attempt.quiz, attempt);
  }

  private async autoSubmitExpiredAttempt(attemptId: string) {
    const attempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: QuizAttemptStatus.EXPIRED,
        submittedAt: new Date(),
        score: 0,
        percentage: 0,
        passed: false,
      },
    });

    try {
      await ServiceContainer.audit.log({
        userId: attempt.userId,
        action: "QUIZ_SUBMITTED",
        resource: "QuizAttempt",
        resourceId: attemptId,
        details: { autoSubmitted: true, status: "EXPIRED" },
        status: "SUCCESS",
      });
    } catch {}

    return { attempt, finished: true, expired: true };
  }

  async submitQuizAttempt(userId: string, input: SubmitAttemptInput) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: input.attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundError("Quiz attempt not found");
    if (attempt.userId !== userId) throw new ForbiddenError("Unauthorized attempt access");
    if (attempt.status !== QuizAttemptStatus.IN_PROGRESS) {
      throw new ValidationError("Attempt has already been submitted or expired");
    }

    // Check time limit expiration
    if (attempt.quiz.timeLimitMinutes > 0) {
      const timeLimitMs = (attempt.quiz.timeLimitMinutes * 60 + 10) * 1000; // Allow 10s grace
      const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
      if (elapsedMs > timeLimitMs) {
        return this.autoSubmitExpiredAttempt(input.attemptId);
      }
    }

    let totalQuizMarks = 0;
    let totalScore = 0;
    const questionsMap = new Map(attempt.quiz.questions.map((q) => [q.id, q]));
    const answersData: any[] = [];
    let requiresManualGrading = false;

    for (const ans of input.answers) {
      const q = questionsMap.get(ans.questionId);
      if (!q) throw new QuestionNotFoundException(`Question [${ans.questionId}] does not belong to this quiz`);

      totalQuizMarks += q.marks;
      let marksAwarded = 0;
      let isCorrect = false;

      // Auto evaluation
      if (
        q.questionType === QuestionType.MULTIPLE_CHOICE_SINGLE ||
        q.questionType === QuestionType.TRUE_FALSE
      ) {
        const correctOpt = q.options.find((o) => o.isCorrect);
        if (ans.selectedOptionId && correctOpt && ans.selectedOptionId === correctOpt.id) {
          marksAwarded = q.marks;
          isCorrect = true;
        } else if (q.negativeMarks > 0) {
          marksAwarded = -q.negativeMarks;
        }
      } else if (q.questionType === QuestionType.MULTIPLE_CHOICE_MULTIPLE) {
        const correctOptIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
        const correctSet = new Set(correctOptIds);
        const selected = ans.selectedOptionId ? [ans.selectedOptionId] : []; // For MCQ_MULTIPLE, frontend passes individual answers or array. Here we handle array or single
        
        // Single option helper or let's find matching
        const correctCount = selected.filter(id => correctSet.has(id)).length;
        if (correctCount === correctSet.size && selected.length === correctSet.size) {
          marksAwarded = q.marks;
          isCorrect = true;
        } else if (q.negativeMarks > 0) {
          marksAwarded = -q.negativeMarks;
        }
      } else if (q.questionType === QuestionType.FILL_IN_THE_BLANK) {
        const cleanAnswerText = ans.answerText?.trim().toLowerCase() || "";
        const match = q.options.some(
          (o) => o.text.trim().toLowerCase() === cleanAnswerText
        );
        if (match) {
          marksAwarded = q.marks;
          isCorrect = true;
        } else if (q.negativeMarks > 0) {
          marksAwarded = -q.negativeMarks;
        }
      } else {
        // Manual grading required (SHORT_ANSWER, LONG_ANSWER, CODE_SNIPPET, FILE_UPLOAD)
        requiresManualGrading = true;
      }

      totalScore += marksAwarded;

      answersData.push({
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId ?? null,
        answerText: ans.answerText ?? null,
        marksAwarded,
        isCorrect,
      });
    }

    if (totalQuizMarks === 0) totalQuizMarks = 1.0; // avoid division by zero
    const percentage = (totalScore / totalQuizMarks) * 100;
    const passed = percentage >= attempt.quiz.passingPercentage;
    const submittedAt = new Date();
    const timeTakenSeconds = Math.max(0, Math.floor((submittedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000));

    return prisma.$transaction(async (tx) => {
      // 1. Save answers
      for (const ans of answersData) {
        await tx.quizAnswer.create({
          data: {
            attemptId: input.attemptId,
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId,
            answerText: ans.answerText,
            marksAwarded: ans.marksAwarded,
            isCorrect: ans.isCorrect,
          },
        });
      }

      // 2. Update QuizAttempt
      const updatedAttempt = await tx.quizAttempt.update({
        where: { id: input.attemptId },
        data: {
          submittedAt,
          timeTakenSeconds,
          score: totalScore,
          percentage: Math.max(0.0, percentage),
          passed,
          status: QuizAttemptStatus.SUBMITTED,
        },
      });

      // 3. Log Audit
      try {
        await ServiceContainer.audit.log({
          userId,
          action: "QUIZ_SUBMITTED",
          resource: "QuizAttempt",
          resourceId: updatedAttempt.id,
          details: { score: totalScore, percentage, passed, requiresManualGrading },
          status: "SUCCESS",
        });
      } catch {}

      // 4. Generate notification and emails
      try {
        await ServiceContainer.notification.create({
          userId,
          title: passed ? "Quiz Passed! 🎉" : "Quiz Submitted",
          message: passed 
            ? `Congratulations! You passed the quiz "${attempt.quiz.title}" with ${percentage.toFixed(1)}%.`
            : `You submitted the quiz "${attempt.quiz.title}".`,
          type: "ASSESSMENT" as any,
          priority: passed ? "HIGH" as any : "NORMAL" as any,
        });

        if (passed) {
          const userObj = await tx.user.findUnique({ where: { id: userId } });
          if (userObj) {
            await ServiceContainer.email.send(
              userObj.email,
              `Congratulations on Passing: ${attempt.quiz.title}`,
              `<p>Well done! You successfully passed <b>${attempt.quiz.title}</b> with a score of ${percentage.toFixed(1)}%.</p>`
            );
          }
        }
      } catch {}

      return updatedAttempt;
    });
  }

  // ── Manual Grading (Instructor) ──────────────────────────────────────────
  async gradeQuizAnswer(instructorId: string, answerId: string, marksAwarded: number, isCorrect: boolean) {
    const answer = await prisma.quizAnswer.findUnique({
      where: { id: answerId },
      include: {
        attempt: {
          include: { quiz: true },
        },
      },
    });

    if (!answer) throw new NotFoundError("Quiz answer not found");

    return prisma.$transaction(async (tx) => {
      // Update answer
      const updatedAnswer = await tx.quizAnswer.update({
        where: { id: answerId },
        data: { marksAwarded, isCorrect },
      });

      // Recalculate attempt score
      const allAnswers = await tx.quizAnswer.findMany({
        where: { attemptId: answer.attemptId },
      });

      const totalScore = allAnswers.reduce((sum, a) => sum + a.marksAwarded, 0);

      // Find total questions marks
      const quiz = await tx.quiz.findUnique({
        where: { id: answer.attempt.quizId },
        include: { questions: true },
      });

      const totalQuizMarks = quiz?.questions.reduce((sum, q) => sum + q.marks, 0) || 1.0;
      const percentage = (totalScore / totalQuizMarks) * 100;
      const passed = percentage >= answer.attempt.quiz.passingPercentage;

      const updatedAttempt = await tx.quizAttempt.update({
        where: { id: answer.attemptId },
        data: {
          score: totalScore,
          percentage: Math.max(0.0, percentage),
          passed,
        },
      });

      try {
        await ServiceContainer.audit.log({
          userId: instructorId,
          action: "QUIZ_GRADED",
          resource: "QuizAttempt",
          resourceId: updatedAttempt.id,
          details: { totalScore, passed },
          status: "SUCCESS",
        });
      } catch {}

      return { updatedAnswer, updatedAttempt };
    });
  }
}

export const quizService = new QuizService();
