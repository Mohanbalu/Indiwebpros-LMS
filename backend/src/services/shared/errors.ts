import { AppError } from "@/errors/custom-errors";

export class StorageException extends AppError {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class EmailException extends AppError {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class PaymentException extends AppError {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class CacheException extends AppError {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class QueueException extends AppError {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class CertificateException extends AppError {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}
