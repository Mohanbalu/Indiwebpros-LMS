import { AppError } from "@/errors/custom-errors";

export class EnrollmentAlreadyExistsException extends AppError {
  constructor(message = "Enrollment already exists for this course") {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PaymentFailedException extends AppError {
  constructor(message = "Payment attempt failed or invalid status", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CouponExpiredException extends AppError {
  constructor(message = "Coupon has expired or is inactive") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CouponAlreadyUsedException extends AppError {
  constructor(message = "Coupon has already been used by this user") {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EnrollmentExpiredException extends AppError {
  constructor(message = "Enrollment has expired") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ==========================================
// Razorpay Payment Exceptions (Milestone 23)
// ==========================================

export class PaymentVerificationException extends AppError {
  constructor(message = "Payment signature verification failed") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WebhookVerificationException extends AppError {
  constructor(message = "Webhook signature verification failed") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicatePaymentException extends AppError {
  constructor(message = "This payment has already been processed") {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RefundException extends AppError {
  constructor(message = "Refund processing failed") {
    super(message, 400);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PaymentGatewayException extends AppError {
  constructor(message = "Payment gateway returned an error") {
    super(message, 502);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

