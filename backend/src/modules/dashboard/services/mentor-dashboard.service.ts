import { prisma } from "@/database/client";
import {
  EnrollmentStatus,
  QuizAttemptStatus,
  AssignmentSubmissionStatus,
  CertificateStatus,
} from "@/generated/client";
import { NotFoundError, ForbiddenError } from "@/errors/custom-errors";
import {
  MentorAccessDeniedException,
  StudentNotAssignedException,
  MentorSessionException,
  FeedbackException,
} from "../errors/mentor-exceptions";
import { ServiceContainer } from "@/services/shared/service-container";

export class MentorDashboardService {
  private verifyMentorRole(role: string) {
    if (role !== "Mentor" && role !== "Admin") {
      throw new MentorAccessDeniedException();
    }
  }

  async validateStudentAssignment(studentId: string, mentorId: string, role: string) {
    if (role === "Admin") return;
    const assignment = await prisma.mentorStudent.findFirst({
      where: { mentorId, studentId },
    });
    if (!assignment) {
      throw new StudentNotAssignedException();
    }
  }

  private getMentorStudentFilter(mentorId: string, role: string) {
    return role === "Admin" ? {} : { mentorId };
  }

  // Risk Detection Engine
  computeRiskLevel(studentData: {
    daysInactive: number;
    quizFailures: number;
    assignmentDelays: number;
    progressPercentage: number;
  }): "GREEN" | "YELLOW" | "RED" {
    if (
      studentData.daysInactive > 14 ||
      studentData.quizFailures >= 3 ||
      studentData.assignmentDelays >= 2
    ) {
      return "RED";
    }

    if (
      studentData.daysInactive > 7 ||
      studentData.quizFailures > 0 ||
      studentData.assignmentDelays > 0 ||
      studentData.progressPercentage < 20.0
    ) {
      return "YELLOW";
    }

    return "GREEN";
  }

  async getFullDashboard(userId: string, role: string) {
    this.verifyMentorRole(role);

    const mentor = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!mentor) throw new NotFoundError("Mentor user not found");

    const mentorFilter = this.getMentorStudentFilter(userId, role);

    // Fetch assigned students
    const assignedStudents = await prisma.mentorStudent.findMany({
      where: { ...mentorFilter },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            enrollments: {
              where: { deletedAt: null },
              include: { course: { select: { title: true } } },
              orderBy: { enrolledAt: "desc" },
              take: 1,
            },
            learningProgresses: {
              orderBy: { lastAccessedAt: "desc" },
              take: 1,
            },
            quizAttempts: {
              where: { status: "SUBMITTED" },
            },
            submissions: {
              include: { assignment: true },
            },
          },
        },
      },
    });

    const studentDetails = await Promise.all(
      assignedStudents.map(async (ms) => {
        const student = ms.student;
        const lastProgress = student.learningProgresses[0] || null;
        
        let daysInactive = 30; // default to inactive if never accessed
        if (lastProgress) {
          const diffTime = Math.abs(Date.now() - lastProgress.lastAccessedAt.getTime());
          daysInactive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const quizFailures = student.quizAttempts.filter((qa) => !qa.passed).length;

        // Overdue or late assignments
        let assignmentDelays = 0;
        student.submissions.forEach((sub) => {
          if (sub.assignment.dueDate && sub.submittedAt > sub.assignment.dueDate) {
            assignmentDelays += 1;
          }
        });

        const progressPercentage = lastProgress?.progressPercentage ?? 0.0;

        const riskLevel = this.computeRiskLevel({
          daysInactive,
          quizFailures,
          assignmentDelays,
          progressPercentage,
        });

        const activeCourse = student.enrollments[0]?.course.title ?? "No Active Course";

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          currentCourse: activeCourse,
          progress: progressPercentage,
          lastActive: lastProgress?.lastAccessedAt ?? null,
          riskLevel,
          daysInactive,
          quizFailures,
          assignmentDelays,
        };
      })
    );

    // Sort by risk severity: RED first, then YELLOW, then GREEN
    studentDetails.sort((a, b) => {
      const severity = { RED: 3, YELLOW: 2, GREEN: 1 };
      return severity[b.riskLevel] - severity[a.riskLevel];
    });

    // 1. Welcome Card
    const welcome = {
      mentorName: `${mentor.firstName} ${mentor.lastName}`,
      department: "Student Success & Guidance",
      totalAssignedStudents: studentDetails.length,
      activeStudents: studentDetails.filter((s) => s.riskLevel !== "RED").length,
    };

    // 2. Upcoming mentoring sessions
    const sessions = await prisma.mentorSession.findMany({
      where: { ...mentorFilter, status: "SCHEDULED" },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });

    // Audit log
    await ServiceContainer.audit.log({
      userId,
      action: "MENTOR_DASHBOARD_VIEWED",
      resource: "MentorDashboard",
      resourceId: userId,
      details: {},
      status: "SUCCESS",
    }).catch(() => {});

    return {
      welcome,
      assignedStudents: studentDetails,
      upcomingSessions: sessions.map((s) => ({
        id: s.id,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        title: s.title,
        scheduledAt: s.scheduledAt,
        meetingLink: s.meetingLink,
      })),
      atRiskCount: studentDetails.filter((s) => s.riskLevel === "RED").length,
    };
  }

  async getStudents(userId: string, role: string) {
    const full = await this.getFullDashboard(userId, role);
    return full.assignedStudents;
  }

  async getStudentDetails(studentId: string, userId: string, role: string) {
    this.verifyMentorRole(role);
    await this.validateStudentAssignment(studentId, userId, role);

    const [student, notes, feedbacks, sessions, progress] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
      }),
      prisma.mentorNote.findMany({
        where: { studentId, mentorId: userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mentorFeedback.findMany({
        where: { studentId },
        include: { mentor: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mentorSession.findMany({
        where: { studentId, mentorId: userId },
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.learningProgress.findMany({
        where: { userId: studentId },
        include: { course: { select: { title: true } } },
      }),
    ]);

    if (!student) throw new NotFoundError("Student not found");

    // Recalculate quick stats
    const avgProgress = progress.length > 0 ? progress.reduce((sum, p) => sum + p.progressPercentage, 0) / progress.length : 0;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        college: student.college,
        bio: student.bio,
      },
      stats: {
        averageProgress: avgProgress,
        notesCount: notes.length,
        feedbacksCount: feedbacks.length,
        sessionsCount: sessions.length,
      },
      notes,
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        category: f.category,
        feedback: f.feedback,
        rating: f.rating,
        actionItems: f.actionItems,
        createdAt: f.createdAt,
        mentorName: `${f.mentor.firstName} ${f.mentor.lastName}`,
      })),
      sessions,
      progress: progress.map((p) => ({
        courseTitle: p.course.title,
        progressPercentage: p.progressPercentage,
        completedAt: p.completedAt,
      })),
    };
  }

  async getAnalytics(userId: string, role: string) {
    this.verifyMentorRole(role);
    const full = await this.getFullDashboard(userId, role);

    // Calculate aggregated metrics
    const totalStudents = full.assignedStudents.length;
    const completedStudents = full.assignedStudents.filter((s) => s.progress === 100).length;
    const avgProgress = totalStudents > 0 ? full.assignedStudents.reduce((sum, s) => sum + s.progress, 0) / totalStudents : 0;

    return {
      welcome: full.welcome,
      learningStatistics: {
        assignedStudents: totalStudents,
        completedStudents,
        averageProgress: avgProgress,
        atRiskCount: full.atRiskCount,
      },
      riskLevelSummary: {
        red: full.assignedStudents.filter((s) => s.riskLevel === "RED").length,
        yellow: full.assignedStudents.filter((s) => s.riskLevel === "YELLOW").length,
        green: full.assignedStudents.filter((s) => s.riskLevel === "GREEN").length,
      },
    };
  }

  // Mentoring sessions CRUD
  async getSessions(userId: string, role: string) {
    this.verifyMentorRole(role);
    const mentorFilter = this.getMentorStudentFilter(userId, role);

    return prisma.mentorSession.findMany({
      where: { ...mentorFilter },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  async createSession(data: any, userId: string, role: string) {
    this.verifyMentorRole(role);
    await this.validateStudentAssignment(data.studentId, userId, role);

    const session = await prisma.mentorSession.create({
      data: {
        mentorId: userId,
        studentId: data.studentId,
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        meetingLink: data.meetingLink,
        status: "SCHEDULED",
      },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "SESSION_SCHEDULED",
      resource: "MentorSession",
      resourceId: session.id,
      details: { title: data.title },
      status: "SUCCESS",
    }).catch(() => {});

    return session;
  }

  async updateSession(sessionId: string, data: any, userId: string, role: string) {
    this.verifyMentorRole(role);

    const session = await prisma.mentorSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError("Session not found");
    if (role !== "Admin" && session.mentorId !== userId) {
      throw new ForbiddenError("You do not own this mentoring session");
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.mentorSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    if (data.status === "COMPLETED") {
      await ServiceContainer.audit.log({
        userId,
        action: "SESSION_COMPLETED",
        resource: "MentorSession",
        resourceId: sessionId,
        details: {},
        status: "SUCCESS",
      }).catch(() => {});
    }

    return updated;
  }

  async deleteSession(sessionId: string, userId: string, role: string) {
    this.verifyMentorRole(role);

    const session = await prisma.mentorSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError("Session not found");
    if (role !== "Admin" && session.mentorId !== userId) {
      throw new ForbiddenError("You do not own this mentoring session");
    }

    await prisma.mentorSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }

  // Feedback CRUD
  async createFeedback(data: any, userId: string, role: string) {
    this.verifyMentorRole(role);
    await this.validateStudentAssignment(data.studentId, userId, role);

    const feedback = await prisma.mentorFeedback.create({
      data: {
        mentorId: userId,
        studentId: data.studentId,
        category: data.category,
        feedback: data.feedback,
        rating: data.rating || 5,
        actionItems: data.actionItems ? JSON.parse(JSON.stringify(data.actionItems)) : null,
      },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "FEEDBACK_ADDED",
      resource: "MentorFeedback",
      resourceId: feedback.id,
      details: { category: data.category },
      status: "SUCCESS",
    }).catch(() => {});

    return feedback;
  }

  async updateFeedback(feedbackId: string, data: any, userId: string, role: string) {
    this.verifyMentorRole(role);

    const feedback = await prisma.mentorFeedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new NotFoundError("Feedback not found");
    if (role !== "Admin" && feedback.mentorId !== userId) {
      throw new ForbiddenError("You do not own this feedback record");
    }

    const updated = await prisma.mentorFeedback.update({
      where: { id: feedbackId },
      data: {
        feedback: data.feedback,
        rating: data.rating,
        category: data.category,
        actionItems: data.actionItems ? JSON.parse(JSON.stringify(data.actionItems)) : undefined,
      },
    });

    return updated;
  }

  // Notes CRUD
  async createNote(data: any, userId: string, role: string) {
    this.verifyMentorRole(role);
    await this.validateStudentAssignment(data.studentId, userId, role);

    const note = await prisma.mentorNote.create({
      data: {
        mentorId: userId,
        studentId: data.studentId,
        title: data.title,
        content: data.content,
        visibility: data.visibility || "PRIVATE",
      },
    });

    await ServiceContainer.audit.log({
      userId,
      action: "NOTE_CREATED",
      resource: "MentorNote",
      resourceId: note.id,
      details: { title: data.title },
      status: "SUCCESS",
    }).catch(() => {});

    return note;
  }

  async updateNote(noteId: string, data: any, userId: string, role: string) {
    this.verifyMentorRole(role);

    const note = await prisma.mentorNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundError("Note not found");
    if (role !== "Admin" && note.mentorId !== userId) {
      throw new ForbiddenError("You do not own this mentor note");
    }

    const updated = await prisma.mentorNote.update({
      where: { id: noteId },
      data: {
        title: data.title,
        content: data.content,
        visibility: data.visibility,
      },
    });

    return updated;
  }
}

export const mentorDashboardService = new MentorDashboardService();
