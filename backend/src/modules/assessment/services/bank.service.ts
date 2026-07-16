import { prisma } from "@/database/client";
import { QuestionBank, QuestionBankCategory } from "@/generated/client";
import { NotFoundError, ForbiddenError } from "@/errors/custom-errors";
import { QuestionBankInput } from "../validators/assessment.validator";

export class QuestionBankService {
  async addQuestionToBank(userId: string, role: string, input: QuestionBankInput): Promise<QuestionBank> {
    if (role !== "Admin" && role !== "Instructor") {
      throw new ForbiddenError("Only instructors and administrators can manage the question bank");
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: input.questionId },
    });

    if (!question) throw new NotFoundError("Quiz question not found");

    const existing = await prisma.questionBank.findFirst({
      where: { questionId: input.questionId, category: input.category },
    });

    if (existing) return existing;

    return prisma.questionBank.create({
      data: {
        questionId: input.questionId,
        category: input.category,
      },
    });
  }

  async removeQuestionFromBank(userId: string, role: string, questionBankId: string): Promise<void> {
    if (role !== "Admin" && role !== "Instructor") {
      throw new ForbiddenError("Only instructors and administrators can manage the question bank");
    }

    const entry = await prisma.questionBank.findUnique({
      where: { id: questionBankId },
    });

    if (!entry) throw new NotFoundError("Question bank entry not found");

    await prisma.questionBank.delete({
      where: { id: questionBankId },
    });
  }

  async listQuestionBankQuestions(category?: QuestionBankCategory, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = category ? { category } : {};

    const [data, total] = await prisma.$transaction([
      prisma.questionBank.findMany({
        where,
        skip,
        take: limit,
        include: {
          question: {
            include: { options: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.questionBank.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const questionBankService = new QuestionBankService();
