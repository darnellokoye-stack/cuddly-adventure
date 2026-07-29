import type { Redis } from 'ioredis';
import { CacheProvider } from './CacheProvider.js';
import { CachePayload } from '../types/Cache.js';
import { logger } from '../utils/logger.js';
import { cacheMetrics } from '../metrics/PrometheusMetrics.js';
import { getRedisClient } from '../utils/redisClient.js';

export interface RedisCacheOptions {
  namespace: string;
  version: string;
  ttlSeconds: number;
}

export class RedisCache implements CacheProvider {
  private readonly client: Redis;
  private readonly namespace: string;
  private readonly version: string;
  private readonly ttlSeconds: number;

  constructor(options: RedisCacheOptions) {
    this.client = getRedisClient();
    this.namespace = options.namespace;
    this.version = options.version;
    this.ttlSeconds = options.ttlSeconds;
  }

  private resolveKey(key: string): string {
    return `${this.namespace}:v${this.version}:${key}`;
  }

  async readPayload<T>(key: string): Promise<CachePayload<T> | null> {
    const resolvedKey = this.resolveKey(key);
    const start = Date.now();

    try {
      const raw = await this.client.get(resolvedKey);
      cacheMetrics.cacheReads.inc();
      if (!raw) {
        cacheMetrics.cacheMisses.inc();
        return null;
      }
      cacheMetrics.cacheHits.inc();
      return JSON.parse(raw) as CachePayload<T>;
    } catch (error) {
      logger.warn({ key: resolvedKey, error }, 'Redis cache read failed');
      return null;
    } finally {
      cacheMetrics.cacheLatencyMs.observe(Date.now() - start);
    }
  }

  async read<T>(key: string): Promise<T | null> {
    const payload = await this.readPayload<T>(key);
    return payload?.data ?? null;
  }

  async write<T>(key: string, value: T): Promise<void> {
    const resolvedKey = this.resolveKey(key);
    const payload: CachePayload<T> = {
      version: this.version,
      timestamp: new Date().toISOString(),
      data: value
    };
    const start = Date.now();

    try {
      await this.client.set(resolvedKey, JSON.stringify(payload), 'EX', this.ttlSeconds);
      cacheMetrics.cacheWrites.inc();
      cacheMetrics.cacheTtlSeconds.set(this.ttlSeconds);
    } catch (error) {
      logger.error({ key: resolvedKey, error }, 'Redis cache write failed');
      throw error;
    } finally {
      cacheMetrics.cacheLatencyMs.observe(Date.now() - start);
    }
  }

  async exists(key: string): Promise<boolean> {
    const resolvedKey = this.resolveKey(key);
    try {
      const count = await this.client.exists(resolvedKey);
      return count > 0;
    } catch (error) {
      logger.warn({ key: resolvedKey, error }, 'Redis cache exists check failed');
      return false;
    }
  }
}
