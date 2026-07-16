import { Request, Response, NextFunction } from "express";
import { assignmentService } from "../services/assignment.service";
import { prisma } from "@/database/client";
import { ValidationError, ForbiddenError, NotFoundError } from "@/errors/custom-errors";
import {
  assignmentSchema,
  submitAssignmentSchema,
  reviewAssignmentSchema,
} from "../validators/assessment.validator";

export class AssignmentController {
  static async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = assignmentSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid assignment details", parsed.error.errors);

      const assignment = await prisma.assignment.create({
        data: parsed.data,
      });

      res.status(201).json({ success: true, data: assignment });
    } catch (e) { next(e); }
  }

  static async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = assignmentSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid assignment update payload", parsed.error.errors);

      const updated = await prisma.assignment.update({
        where: { id },
        data: parsed.data,
      });

      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  }

  static async deleteAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.assignment.delete({ where: { id } });
      res.status(204).send();
    } catch (e) { next(e); }
  }

  static async getAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          submissions: {
            orderBy: { submittedAt: "desc" },
          },
        },
      });

      if (!assignment) throw new NotFoundError("Assignment not found");
      res.json({ success: true, data: assignment });
    } catch (e) { next(e); }
  }

  static async submitSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = submitAssignmentSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid assignment submission payload", parsed.error.errors);

      const userId = req.user!.userId;
      const role = req.user!.role;

      const submission = await assignmentService.submitAssignment(userId, role, parsed.data);
      res.status(201).json({ success: true, data: submission });
    } catch (e) { next(e); }
  }

  static async reviewSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const submissionId = req.params.submissionId as string;
      const parsed = reviewAssignmentSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid review request details", parsed.error.errors);

      const instructorId = req.user!.userId;
      const role = req.user!.role;

      const submission = await assignmentService.reviewSubmission(instructorId, role, submissionId, parsed.data);
      res.json({ success: true, data: submission });
    } catch (e) { next(e); }
  }

  static async getSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const submissionId = req.params.submissionId as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: { assignment: true, student: { select: { firstName: true, lastName: true, email: true } }, file: true },
      });

      if (!submission) throw new NotFoundError("Assignment submission not found");

      if (role !== "Admin" && submission.studentId !== userId) {
        // Instructor must own the course
        const course = await prisma.course.findUnique({ where: { id: submission.assignment.courseId } });
        if (!course || course.instructorId !== userId) {
          throw new ForbiddenError("You are not authorized to view this assignment submission");
        }
      }

      res.json({ success: true, data: submission });
    } catch (e) { next(e); }
  }

  static async listSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const assignmentId = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) throw new NotFoundError("Assignment not found");

      // Verify instructor/admin rights
      if (role !== "Admin") {
        const course = await prisma.course.findUnique({ where: { id: assignment.courseId } });
        if (!course || course.instructorId !== userId) {
          throw new ForbiddenError("You are not authorized to view submissions for this assignment");
        }
      }

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      });

      res.json({ success: true, data: submissions });
    } catch (e) { next(e); }
  }
}
