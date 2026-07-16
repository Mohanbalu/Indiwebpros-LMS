import { AppError } from "@/errors/custom-errors";

export class InstructorDashboardAccessDeniedException extends AppError {
  constructor(message = "Only instructors and administrators are authorized to access this dashboard") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CourseOwnershipException extends AppError {
  constructor(message = "You do not own this course or have permission to access its details") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AnalyticsAggregationException extends AppError {
  constructor(message = "Failed to aggregate instructor dashboard analytics", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
