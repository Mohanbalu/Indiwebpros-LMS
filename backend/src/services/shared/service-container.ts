import { IStorageService } from "../storage";
import { IEmailService } from "../email";
import { IPaymentService } from "../payment";
import { ICacheService } from "../cache";
import { IQueueService } from "../queue";
import { ILoggerService } from "../logger";
import { IAuditService } from "../audit";
import { INotificationService } from "../notification";
import { ICertificateService } from "../certificate";
import { ContainerLockedException } from "./infrastructure-exceptions";

export class ServiceContainer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instances = new Map<string, any>();
  private static locked = false;

  static lock(): void {
    this.locked = true;
  }

  static unlock(): void {
    // Unlock allowed for local testing/development mode configurations only
    if (process.env.NODE_ENV === "production") {
      throw new ContainerLockedException("Cannot unlock service container registry in production mode");
    }
    this.locked = false;
  }

  static isLocked(): boolean {
    return this.locked;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static register(key: string, instance: any): void {
    if (this.locked) {
      throw new ContainerLockedException(`Container is locked. Cannot register service [${key}]`);
    }
    this.instances.set(key, instance);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static replace(key: string, instance: any): void {
    if (process.env.NODE_ENV !== "test" && this.locked) {
      throw new ContainerLockedException(`Container is locked. Cannot replace service [${key}] outside testing mode`);
    }
    this.instances.set(key, instance);
  }

  static get<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Service [${key}] has not been registered in ServiceContainer`);
    }
    return instance as T;
  }

  static clear(): void {
    if (this.locked && process.env.NODE_ENV !== "test") {
      throw new ContainerLockedException("Cannot clear a locked service container");
    }
    this.instances.clear();
  }

  static get storage(): IStorageService { return this.get<IStorageService>("storage"); }
  static get email(): IEmailService { return this.get<IEmailService>("email"); }
  static get payment(): IPaymentService { return this.get<IPaymentService>("payment"); }
  static get cache(): ICacheService { return this.get<ICacheService>("cache"); }
  static get queue(): IQueueService { return this.get<IQueueService>("queue"); }
  static get logger(): ILoggerService { return this.get<ILoggerService>("logger"); }
  static get audit(): IAuditService { return this.get<IAuditService>("audit"); }
  static get notification(): INotificationService { return this.get<INotificationService>("notification"); }
  static get certificate(): ICertificateService { return this.get<ICertificateService>("certificate"); }
}
