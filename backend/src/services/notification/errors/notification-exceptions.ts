import { InfrastructureException } from "../../shared/infrastructure-exceptions";

export class NotificationNotFoundException extends InfrastructureException {
  constructor(message = "Notification not found", errors: unknown[] = []) {
    super(message, 404, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotificationPermissionException extends InfrastructureException {
  constructor(message = "Permission denied for this notification", errors: unknown[] = []) {
    super(message, 403, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotificationValidationException extends InfrastructureException {
  constructor(message = "Invalid notification request", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
