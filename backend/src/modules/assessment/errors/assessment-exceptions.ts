import { AppError } from "@/errors/custom-errors";

export class QuizAttemptLimitExceededException extends AppError {
  constructor(message = "Maximum quiz attempts limit reached") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QuizExpiredException extends AppError {
  constructor(message = "The quiz time limit has expired or this attempt is closed") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AssignmentDeadlineExceededException extends AppError {
  constructor(message = "Assignment due date has passed and late submissions are disabled") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EnrollmentRequiredException extends AppError {
  constructor(message = "Active enrollment is required to attempt assessments") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QuestionNotFoundException extends AppError {
  constructor(message = "Quiz question not found") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
