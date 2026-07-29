import { CacheProvider } from './CacheProvider.js';
import { FileCache } from './FileCache.js';
import { RedisCache } from './RedisCache.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export function createCacheProvider(): CacheProvider {
  if (config.cacheProvider === 'redis') {
    logger.info({ provider: 'redis', namespace: config.cacheNamespace, ttlSeconds: config.cacheTtlSeconds }, 'Initializing Redis cache provider');
    return new RedisCache({
      namespace: config.cacheNamespace,
      version: config.cacheVersion,
      ttlSeconds: config.cacheTtlSeconds
    });
  }

  logger.info({ provider: 'file' }, 'Initializing file cache provider');
  return new FileCache();
}
