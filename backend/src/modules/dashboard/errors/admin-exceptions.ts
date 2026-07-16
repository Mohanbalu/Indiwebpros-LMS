import { AppError } from "@/errors/custom-errors";

export class AdminAccessDeniedException extends AppError {
  constructor(message = "Only system administrators are authorized to access this control center") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DashboardAggregationException extends AppError {
  constructor(message = "Failed to aggregate admin dashboard landing stats", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ExportException extends AppError {
  constructor(message = "Failed to generate administrator data export stream", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PlatformHealthException extends AppError {
  constructor(message = "Failed to evaluate platform subsystem connectivity status", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
