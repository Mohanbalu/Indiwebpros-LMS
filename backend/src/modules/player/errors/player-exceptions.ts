import { AppError } from "@/errors/custom-errors";

export class EnrollmentRequiredException extends AppError {
  constructor(message = "Active enrollment is required to access this course") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LessonNotFoundException extends AppError {
  constructor(message = "Lesson not found or deleted") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProgressUpdateException extends AppError {
  constructor(message = "Failed to update learning progress", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BookmarkAlreadyExistsException extends AppError {
  constructor(message = "Lesson is already bookmarked") {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
