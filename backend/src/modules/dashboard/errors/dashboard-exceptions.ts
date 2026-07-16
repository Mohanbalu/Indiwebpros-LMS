import { AppError } from "@/errors/custom-errors";

export class DashboardAccessDeniedException extends AppError {
  constructor(message = "Only students are authorized to access this student dashboard") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DashboardAggregationException extends AppError {
  constructor(message = "Failed to aggregate student dashboard records", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StudentNotFoundException extends AppError {
  constructor(message = "Student user profile not found") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
