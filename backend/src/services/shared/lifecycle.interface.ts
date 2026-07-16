export interface ILifecycleService {
  initialize?(): Promise<void>;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  shutdown?(): Promise<void>;
}
