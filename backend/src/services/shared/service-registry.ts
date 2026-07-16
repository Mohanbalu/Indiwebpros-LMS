export interface ServiceMetadata {
  name: string;
  version: string;
  providerName: string;
  supportsHealth: boolean;
  supportsLifecycle: boolean;
  supportsMetrics: boolean;
  initialized: boolean;
  error?: string;
}

export class ServiceRegistry {
  private static registry = new Map<string, ServiceMetadata>();

  static register(name: string, metadata: Omit<ServiceMetadata, "initialized">): void {
    this.registry.set(name, {
      ...metadata,
      initialized: false,
    });
  }

  static get(name: string): ServiceMetadata | undefined {
    return this.registry.get(name);
  }

  static setInitialized(name: string, status: boolean, error?: string): void {
    const meta = this.registry.get(name);
    if (meta) {
      meta.initialized = status;
      meta.error = error;
    }
  }

  static list(): ServiceMetadata[] {
    return Array.from(this.registry.values());
  }

  static getAll(): Record<string, ServiceMetadata> {
    const result: Record<string, ServiceMetadata> = {};
    for (const [key, value] of this.registry) {
      result[key] = value;
    }
    return result;
  }

  static clear(): void {
    this.registry.clear();
  }
}
