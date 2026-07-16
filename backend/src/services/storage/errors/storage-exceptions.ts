import { InfrastructureException } from "../../shared/infrastructure-exceptions";

export class StorageUploadException extends InfrastructureException {
  constructor(message = "File upload failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageDeleteException extends InfrastructureException {
  constructor(message = "File deletion failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageValidationException extends InfrastructureException {
  constructor(message = "File validation failed", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SignedURLException extends InfrastructureException {
  constructor(message = "Presigned URL generation failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MultipartUploadException extends InfrastructureException {
  constructor(message = "Multipart upload operation failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
