import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../src/cache/CacheManager.js';
import { FileCache } from '../src/cache/FileCache.js';
import { nowIso } from '../src/utils/dates.js';

describe('Cache TTL and Freshness', () => {
  let cacheManager: CacheManager;

  beforeEach(async () => {
    cacheManager = new CacheManager(new FileCache());
  });

  it('should track cache age in milliseconds', async () => {
    const testData = [{ id: '1', name: 'Test Pair' }];
    await cacheManager.savePairs(testData);

    // Wait a small amount
    await new Promise((resolve) => setTimeout(resolve, 10));

    const age = await cacheManager.getCacheAgeMs('pairs');
    expect(age).toBeDefined();
    expect(age).toBeGreaterThanOrEqual(10);
  });

  it('should determine cache freshness based on TTL', async () => {
    const testData = [{ id: '1', name: 'Fresh Pair' }];
    await cacheManager.savePairs(testData);

    // Cache should be fresh within 1 second TTL
    const isFresh = await cacheManager.isFresh('pairs', 1000);
    expect(isFresh).toBe(true);
  });

  it('should report stale cache if age exceeds TTL', async () => {
    const testData = [{ id: '1', name: 'Old Pair' }];
    await cacheManager.savePairs(testData);

    // Set TTL to 1ms (cache will immediately be stale)
    await new Promise((resolve) => setTimeout(resolve, 5));
    const isFresh = await cacheManager.isFresh('pairs', 1);
    expect(isFresh).toBe(false);
  });

  it('should return cache timestamp from payload', async () => {
    const testData = [{ id: '1', name: 'Timestamped Pair' }];
    await cacheManager.savePairs(testData);

    const timestamp = await cacheManager.getCacheTimestamp('pairs');
    expect(timestamp).toBeDefined();
    expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should handle missing cache gracefully', async () => {
    const age = await cacheManager.getCacheAgeMs('nonexistent');
    expect(age).toBeNull();

    const timestamp = await cacheManager.getCacheTimestamp('nonexistent');
    expect(timestamp).toBeNull();
  });

  it('should return cache payload with metadata', async () => {
    const testData = { count: 42 };
    await cacheManager.saveStats(testData);

    const payload = await cacheManager.loadPayload('stats');
    expect(payload).toBeDefined();
    expect(payload?.data).toEqual(testData);
    expect(payload?.timestamp).toBeDefined();
    expect(payload?.version).toBe('1.0');
  });
});
