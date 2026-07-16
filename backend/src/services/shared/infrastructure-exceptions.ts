import { AppError } from "@/errors/custom-errors";

export class InfrastructureException extends AppError {
  constructor(message: string, statusCode = 500, errors: unknown[] = []) {
    super(message, statusCode, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationException extends InfrastructureException {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class ProviderInitializationException extends InfrastructureException {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class ContainerLockedException extends InfrastructureException {
  constructor(message: string) {
    super(message, 500);
  }
}

export class HealthCheckException extends InfrastructureException {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 500, errors);
  }
}

export class ServiceUnavailableException extends InfrastructureException {
  constructor(message: string, errors: unknown[] = []) {
    super(message, 503, errors);
  }
}
