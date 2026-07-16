import { prisma } from "@/database/client";
import {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionStatus,
  EnrollmentStatus,
} from "@/generated/client";
import { NotFoundError, ForbiddenError, ValidationError } from "@/errors/custom-errors";
import {
  AssignmentDeadlineExceededException,
  EnrollmentRequiredException,
} from "../errors/assessment-exceptions";
import { SubmitAssignmentInput, ReviewAssignmentInput } from "../validators/assessment.validator";
import { ServiceContainer } from "@/services/shared/service-container";

export class AssignmentService {
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

  async submitAssignment(userId: string, role: string, input: SubmitAssignmentInput): Promise<AssignmentSubmission> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
    });

    if (!assignment) throw new NotFoundError("Assignment not found");

    await this.validateEnrollment(userId, assignment.courseId, role);

    // Check due date
    if (assignment.dueDate !== null && new Date(assignment.dueDate) < new Date()) {
      if (!assignment.allowLateSubmission) {
        throw new AssignmentDeadlineExceededException();
      }
    }

    // Verify file ownership if provided
    if (input.fileId) {
      const file = await prisma.file.findUnique({ where: { id: input.fileId } });
      if (!file) throw new NotFoundError("Submission file not found");
      if (file.uploadedBy !== userId) {
        throw new ForbiddenError("You do not own this uploaded file");
      }
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: input.assignmentId,
        studentId: userId,
        fileId: input.fileId ?? null,
        submissionText: input.submissionText ?? null,
        status: AssignmentSubmissionStatus.SUBMITTED,
      },
    });

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "ASSIGNMENT_SUBMITTED",
        resource: "AssignmentSubmission",
        resourceId: submission.id,
        details: { assignmentId: input.assignmentId },
        status: "SUCCESS",
      });
    } catch {}

    // Send notifications
    try {
      await ServiceContainer.notification.create({
        userId,
        title: "Assignment Submitted",
        message: `You submitted your assignment for "${assignment.title}".`,
        type: "ASSESSMENT" as any,
        priority: "NORMAL" as any,
      });
    } catch {}

    return submission;
  }

  async reviewSubmission(
    instructorId: string,
    role: string,
    submissionId: string,
    input: ReviewAssignmentInput
  ): Promise<AssignmentSubmission> {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });

    if (!submission) throw new NotFoundError("Submission not found");

    // Verify authorization: instructor must own the course or be admin
    if (role === "Instructor") {
      const course = await prisma.course.findUnique({ where: { id: submission.assignment.courseId } });
      if (!course || course.instructorId !== instructorId) {
        throw new ForbiddenError("You are not authorized to grade this assignment");
      }
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: input.marks,
        feedback: input.feedback,
        status: input.status as AssignmentSubmissionStatus,
        reviewedBy: instructorId,
        reviewedAt: new Date(),
      },
    });

    try {
      await ServiceContainer.audit.log({
        userId: instructorId,
        action: "ASSIGNMENT_REVIEWED",
        resource: "AssignmentSubmission",
        resourceId: submissionId,
        details: { marks: input.marks, status: input.status },
        status: "SUCCESS",
      });
    } catch {}

    // Notify student
    try {
      await ServiceContainer.notification.create({
        userId: submission.studentId,
        title: "Assignment Reviewed 📝",
        message: `Your submission for "${submission.assignment.title}" has been reviewed. Marks: ${input.marks}/${submission.assignment.maxMarks}`,
        type: "ASSESSMENT" as any,
        priority: "HIGH" as any,
      });

      const student = await prisma.user.findUnique({ where: { id: submission.studentId } });
      if (student) {
        await ServiceContainer.email.send(
          student.email,
          `Assignment Feedback: ${submission.assignment.title}`,
          `<p>Your assignment submission has been reviewed by the Instructor.</p>
           <p>Marks Awarded: <b>${input.marks}/${submission.assignment.maxMarks}</b></p>
           <p>Feedback: ${input.feedback}</p>`
        );
      }
    } catch {}

    return updated;
  }
}

export const assignmentService = new AssignmentService();
