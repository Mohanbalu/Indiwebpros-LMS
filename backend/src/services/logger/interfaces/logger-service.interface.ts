export interface ILoggerService {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string | Error, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  audit(message: string, context?: Record<string, unknown>): void;
}
