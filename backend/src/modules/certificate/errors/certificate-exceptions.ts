import { AppError } from "@/errors/custom-errors";

export class CertificateNotEligibleException extends AppError {
  constructor(message = "Student is not eligible for this certificate yet") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CertificateAlreadyExistsException extends AppError {
  constructor(message = "A certificate has already been issued for this enrollment") {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CertificateRevokedException extends AppError {
  constructor(message = "This certificate has been revoked due to academic misconduct or fraud") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class VerificationFailedException extends AppError {
  constructor(message = "Certificate verification failed. Code is invalid.") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
