import { InfrastructureException } from "../../shared/infrastructure-exceptions";

export class EmailSendException extends InfrastructureException {
  constructor(message = "Email sending failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TemplateException extends InfrastructureException {
  constructor(message = "Email template rendering failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProviderException extends InfrastructureException {
  constructor(message = "Email provider initialization failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QueueException extends InfrastructureException {
  constructor(message = "Email queuing failed", errors: unknown[] = []) {
    super(message, 500, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
