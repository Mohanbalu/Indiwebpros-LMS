import { AppError } from "@/errors/custom-errors";

export class MentorAccessDeniedException extends AppError {
  constructor(message = "Only mentors and administrators are authorized to access this dashboard") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StudentNotAssignedException extends AppError {
  constructor(message = "You are not assigned as a mentor to this student") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MentorSessionException extends AppError {
  constructor(message = "Invalid request parameters for mentoring session action", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FeedbackException extends AppError {
  constructor(message = "Invalid feedback parameters or rating options", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
