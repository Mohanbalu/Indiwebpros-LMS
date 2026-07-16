import { Request, Response, NextFunction } from "express";
import { quizService } from "../services/quiz.service";
import { prisma } from "@/database/client";
import { ValidationError, ForbiddenError, NotFoundError } from "@/errors/custom-errors";
import {
  quizSchema,
  quizQuestionSchema,
  quizOptionSchema,
  startQuizAttemptSchema,
  submitQuizAttemptSchema,
} from "../validators/assessment.validator";

export class QuizController {
  // ── Quiz CRUD ────────────────────────────────────────────────────────────
  static async createQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = quizSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid quiz configuration data", parsed.error.errors);

      const userId = req.user!.userId;
      const role = req.user!.role;

      // Verify that the instructor owns the course they are adding a quiz to
      const course = await prisma.course.findFirst({ where: { id: parsed.data.courseId, deletedAt: null } });
      if (!course) throw new NotFoundError("Course not found");
      if (role !== "Admin" && course.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to create a quiz in this course");
      }

      const quiz = await prisma.quiz.create({
        data: {
          ...parsed.data,
          createdBy: userId,
        },
      });

      res.status(201).json({ success: true, data: quiz });
    } catch (e) { next(e); }
  }

  static async updateQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = quizSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid update request payload", parsed.error.errors);

      const quiz = await prisma.quiz.findUnique({ where: { id }, include: { course: true } });
      if (!quiz) throw new NotFoundError("Quiz not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && quiz.createdBy !== userId && quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to update this quiz");
      }

      const updated = await prisma.quiz.update({
        where: { id },
        data: parsed.data,
      });

      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  }

  static async deleteQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const quiz = await prisma.quiz.findUnique({ where: { id }, include: { course: true } });
      if (!quiz) throw new NotFoundError("Quiz not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && quiz.createdBy !== userId && quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to delete this quiz");
      }

      await prisma.quiz.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.status(204).send();
    } catch (e) { next(e); }
  }

  static async getQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const quiz = await prisma.quiz.findFirst({
        where: { id, deletedAt: null },
        include: {
          course: true,
          questions: {
            include: { options: true },
          },
        },
      });

      if (!quiz) throw new NotFoundError("Quiz not found");

      const userId = req.user!.userId;
      const role = req.user!.role;

      // Allow students and mentors to view published quizzes; limit instructors to owned/associated ones
      if (role !== "Admin" && role !== "Student" && role !== "Mentor") {
        if (quiz.createdBy !== userId && quiz.course?.instructorId !== userId) {
          throw new ForbiddenError("You are not authorized to view this quiz configuration");
        }
      }

      res.json({ success: true, data: quiz });
    } catch (e) { next(e); }
  }

  // ── Question CRUD ────────────────────────────────────────────────────────
  static async addQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const parsed = quizQuestionSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid question schema data", parsed.error.errors);

      const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { course: true } });
      if (!quiz) throw new NotFoundError("Quiz not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && quiz.createdBy !== userId && quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to add questions to this quiz");
      }

      const question = await prisma.quizQuestion.create({
        data: {
          ...parsed.data,
          quizId,
        },
      });

      res.status(201).json({ success: true, data: question });
    } catch (e) { next(e); }
  }

  static async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = quizQuestionSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid question update request", parsed.error.errors);

      const question = await prisma.quizQuestion.findUnique({
        where: { id },
        include: { quiz: { include: { course: true } } },
      });
      if (!question) throw new NotFoundError("Question not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && question.quiz.createdBy !== userId && question.quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to update questions for this quiz");
      }

      const updated = await prisma.quizQuestion.update({
        where: { id },
        data: parsed.data,
      });

      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  }

  static async deleteQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const question = await prisma.quizQuestion.findUnique({
        where: { id },
        include: { quiz: { include: { course: true } } },
      });
      if (!question) throw new NotFoundError("Question not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && question.quiz.createdBy !== userId && question.quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to delete questions from this quiz");
      }

      await prisma.quizQuestion.delete({ where: { id } });
      res.status(204).send();
    } catch (e) { next(e); }
  }

  // ── Option CRUD ──────────────────────────────────────────────────────────
  static async addOption(req: Request, res: Response, next: NextFunction) {
    try {
      const questionId = req.params.questionId as string;
      const parsed = quizOptionSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid option schema data", parsed.error.errors);

      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { quiz: { include: { course: true } } },
      });
      if (!question) throw new NotFoundError("Question not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && question.quiz.createdBy !== userId && question.quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to add options to this quiz");
      }

      const option = await prisma.quizOption.create({
        data: {
          ...parsed.data,
          questionId,
        },
      });

      res.status(201).json({ success: true, data: option });
    } catch (e) { next(e); }
  }

  static async updateOption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = quizOptionSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid option update parameters", parsed.error.errors);

      const option = await prisma.quizOption.findUnique({
        where: { id },
        include: { question: { include: { quiz: { include: { course: true } } } } },
      });
      if (!option) throw new NotFoundError("Option not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && option.question.quiz.createdBy !== userId && option.question.quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to update options for this quiz");
      }

      const updated = await prisma.quizOption.update({
        where: { id },
        data: parsed.data,
      });

      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  }

  static async deleteOption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const option = await prisma.quizOption.findUnique({
        where: { id },
        include: { question: { include: { quiz: { include: { course: true } } } } },
      });
      if (!option) throw new NotFoundError("Option not found");

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && option.question.quiz.createdBy !== userId && option.question.quiz.course?.instructorId !== userId) {
        throw new ForbiddenError("You are not authorized to delete options from this quiz");
      }

      await prisma.quizOption.delete({ where: { id } });
      res.status(204).send();
    } catch (e) { next(e); }
  }

  // ── Quiz Attempt Actions ──────────────────────────────────────────────────
  static async startAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = startQuizAttemptSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid start quiz request", parsed.error.errors);

      const userId = req.user!.userId;
      const role = req.user!.role;

      const attempt = await quizService.startQuizAttempt(userId, role, parsed.data.quizId);
      res.status(201).json({ success: true, data: attempt });
    } catch (e) { next(e); }
  }

  static async resumeAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const attemptId = req.params.attemptId as string;
      const userId = req.user!.userId;

      const attemptDetails = await quizService.resumeQuizAttempt(userId, attemptId);
      res.json({ success: true, data: attemptDetails });
    } catch (e) { next(e); }
  }

  static async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const attemptId = req.params.attemptId as string;
      const parsed = submitQuizAttemptSchema.extend({ attemptId: submitQuizAttemptSchema.shape.attemptId.optional() }).safeParse({
        ...req.body,
        attemptId,
      });

      if (!parsed.success) throw new ValidationError("Invalid submit quiz answers data", parsed.error.errors);

      const userId = req.user!.userId;
      const result = await quizService.submitQuizAttempt(userId, {
        attemptId,
        answers: parsed.data.answers,
      });

      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  static async gradeAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const answerId = req.params.answerId as string;
      const { marksAwarded, isCorrect } = req.body;

      if (marksAwarded === undefined || isCorrect === undefined) {
        throw new ValidationError("Missing grading fields: marksAwarded and isCorrect are required");
      }

      const answer = await prisma.quizAnswer.findUnique({
        where: { id: answerId },
        include: { question: { include: { quiz: { include: { course: true } } } } },
      });
      if (!answer) throw new NotFoundError("Quiz answer not found");

      const instructorId = req.user!.userId;
      const role = req.user!.role;
      if (role !== "Admin" && answer.question.quiz.createdBy !== instructorId && answer.question.quiz.course?.instructorId !== instructorId) {
        throw new ForbiddenError("You are not authorized to grade answers for this quiz");
      }

      const result = await quizService.gradeQuizAnswer(
        instructorId,
        answerId,
        Number(marksAwarded),
        Boolean(isCorrect)
      );

      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  static async getAttemptResults(req: Request, res: Response, next: NextFunction) {
    try {
      const attemptId = req.params.attemptId as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz: { include: { questions: { include: { options: true } } } },
          answers: { include: { question: { include: { options: true } } } },
        },
      });

      if (!attempt) throw new NotFoundError("Quiz attempt not found");

      if (role !== "Admin" && attempt.userId !== userId) {
        // Verify course instructor bypass
        const course = await prisma.course.findUnique({ where: { id: attempt.quiz.courseId } });
        if (!course || course.instructorId !== userId) {
          throw new ForbiddenError("You are not authorized to view this quiz attempt result");
        }
      }

      res.json({ success: true, data: attempt });
    } catch (e) { next(e); }
  }
}
