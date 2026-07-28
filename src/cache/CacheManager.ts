import { CacheProvider } from './CacheProvider.js';
import { logger } from '../utils/logger.js';

/**
 * Cache entry metadata with TTL support.
 */
export interface CacheEntryMetadata {
  timestamp: number; // milliseconds since epoch
  ttlMs: number; // time to live in milliseconds
  version?: string;
}

/**
 * Cache statistics for monitoring.
 */
export interface CacheStats {
  hits: number;
  misses: number;
  staleServes: number;
  invalidations: number;
  hitRate: number;
}

/**
 * Manages cache assets with TTL, stale-while-revalidate, and statistics.
 */
export class CacheManager {
  private stats: CacheStats = { hits: 0, misses: 0, staleServes: 0, invalidations: 0, hitRate: 0 };
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes default
  private staleWhileRevalidateMs = 10 * 60 * 1000; // 10 minute grace period

  constructor(
    private readonly provider: CacheProvider,
    options?: { defaultTtlMs?: number; staleWhileRevalidateMs?: number }
  ) {
    if (options?.defaultTtlMs) this.defaultTtlMs = options.defaultTtlMs;
    if (options?.staleWhileRevalidateMs) this.staleWhileRevalidateMs = options.staleWhileRevalidateMs;
  }

  async saveTokens(tokens: unknown[], ttlMs?: number): Promise<void> {
    logger.info({ count: (tokens as any[]).length }, 'Writing tokens cache');
    await this.writeWithTTL('tokens', tokens, ttlMs);
  }

  async savePairs(pairs: unknown[], ttlMs?: number): Promise<void> {
    logger.info({ count: (pairs as any[]).length }, 'Writing pairs cache');
    await this.writeWithTTL('pairs', pairs, ttlMs);
  }

  async saveStats(stats: unknown, ttlMs?: number): Promise<void> {
    logger.info('Writing stats cache');
    await this.writeWithTTL('stats', stats, ttlMs);
  }

  async saveLastUpdate(timestamp: string, ttlMs?: number): Promise<void> {
    logger.info({ timestamp }, 'Writing last update cache');
    await this.writeWithTTL('lastUpdate', { timestamp }, ttlMs);
  }

  async loadTokens(): Promise<unknown[] | null> {
    return this.readWithTTL('tokens');
  }

  async loadPairs(): Promise<unknown[] | null> {
    return this.readWithTTL('pairs');
  }

  async loadStats(): Promise<unknown | null> {
    return this.readWithTTL('stats');
  }

  async loadLastUpdate(): Promise<{ timestamp: string } | null> {
    return this.readWithTTL('lastUpdate');
  }

  async hasCache(): Promise<boolean> {
    const [tokens, pairs] = await Promise.all([
      this.provider.exists('tokens'),
      this.provider.exists('pairs')
    ]);
    return tokens && pairs;
  }

  /**
   * Check if cache entry is expired.
   */
  private isExpired(metadata: CacheEntryMetadata): boolean {
    const now = Date.now();
    const age = now - metadata.timestamp;
    return age > metadata.ttlMs;
  }

  /**
   * Check if cache entry is within stale-while-revalidate window.
   */
  private isStale(metadata: CacheEntryMetadata): boolean {
    const now = Date.now();
    const age = now - metadata.timestamp;
    const staleDeadline = metadata.ttlMs + this.staleWhileRevalidateMs;
    return age > metadata.ttlMs && age <= staleDeadline;
  }

  /**
   * Write cache entry with TTL metadata.
   */
  private async writeWithTTL(key: string, data: unknown, ttlMs?: number): Promise<void> {
    const metadata: CacheEntryMetadata = {
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs
    };

    const entry = { data, metadata };
    await this.provider.write(key, entry);
  }

  /**
   * Read from cache with TTL/stale-while-revalidate support.
   * Returns data if fresh, stale data if within grace period, or null if expired.
   */
  private async readWithTTL(key: string): Promise<unknown> {
    const entry = await this.provider.read(key) as { data: unknown; metadata: CacheEntryMetadata } | null;

    if (!entry || !entry.metadata) {
      this.stats.misses += 1;
      this.updateHitRate();
      return null;
    }

    if (this.isExpired(entry.metadata)) {
      if (this.isStale(entry.metadata)) {
        // Serve stale data from cache while revalidating
        this.stats.staleServes += 1;
        logger.debug({ key }, 'Serving stale cache data (revalidation window)');
        this.updateHitRate();
        return entry.data;
      }

      // Entry completely expired, invalidate it
      this.stats.misses += 1;
      this.stats.invalidations += 1;
      this.updateHitRate();
      return null;
    }

    // Cache is fresh
    this.stats.hits += 1;
    this.updateHitRate();
    return entry.data;
  }

  /**
   * Invalidate a specific cache entry.
   */
  async invalidate(key: string): Promise<void> {
    await this.provider.write(key, null);
    this.stats.invalidations += 1;
    logger.debug({ key }, 'Cache entry invalidated');
  }

  /**
   * Invalidate all caches.
   */
  async invalidateAll(): Promise<void> {
    await Promise.all([
      this.invalidate('tokens'),
      this.invalidate('pairs'),
      this.invalidate('stats'),
      this.invalidate('lastUpdate')
    ]);
    logger.info('All cache entries invalidated');
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, staleServes: 0, invalidations: 0, hitRate: 0 };
  }

  /**
   * Update cache hit rate.
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}
