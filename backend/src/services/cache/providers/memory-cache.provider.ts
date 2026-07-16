import { ICacheService } from "../interfaces/cache-service.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
import { IMetricsService } from "../../shared/metrics.interface";
import { CacheConfig } from "../../shared/config.schema";
import { ServiceContainer } from "../../shared/service-container";

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
}

export class MemoryCacheProvider implements ICacheService, ILifecycleService, IHealthCheckService, IMetricsService {
  private config: CacheConfig;
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    ServiceContainer.logger.info("MemoryCacheProvider initialized");
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async health(): Promise<HealthStatus> {
    return {
      service: "cache-memory",
      status: "healthy",
      latency: 0,
      message: `MemoryCacheProvider active (keys_count=${this.cache.size})`,
      timestamp: new Date().toISOString(),
    };
  }

  async metrics(): Promise<Record<string, unknown>> {
    return {
      keys_count: this.cache.size,
      cache_hits: this.hits,
      cache_misses: this.misses,
    };
  }

  async resetMetrics(): Promise<void> {
    this.hits = 0;
    this.misses = 0;
  }

  async recordMetric(name: string, value: number): Promise<void> {
    if (name === "cache_hits") this.hits = value;
    if (name === "cache_misses") this.misses = value;
  }
}
