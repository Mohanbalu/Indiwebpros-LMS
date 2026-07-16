import { AppError } from "@/errors/custom-errors";

export class AuthorizationException extends AppError {
  constructor(message: string, statusCode = 403, errors: unknown[] = []) {
    super(message, statusCode, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PermissionDeniedException extends AuthorizationException {
  constructor(message = "Permission denied") {
    super(message, 403);
  }
}

export class OwnershipException extends AuthorizationException {
  constructor(message = "Access denied: Ownership check failed") {
    super(message, 403);
  }
}

export class PolicyViolationException extends AuthorizationException {
  constructor(message = "Policy violation detected") {
    super(message, 403);
  }
}

export class RoleNotFoundException extends AuthorizationException {
  constructor(message = "Requested role not configured") {
    super(message, 500);
  }
}
