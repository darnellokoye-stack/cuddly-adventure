import { CacheProvider } from './CacheProvider.js';
import { logger } from '../utils/logger.js';

/**
 * Manages cache assets for discovery data.
 */
export class CacheManager {
  constructor(private readonly provider: CacheProvider) {}

  async saveTokens(tokens: unknown[]): Promise<void> {
    logger.info({ count: tokens.length }, 'Writing tokens cache');
    await this.provider.write('tokens', tokens);
  }

  async savePairs(pairs: unknown[]): Promise<void> {
    logger.info({ count: pairs.length }, 'Writing pairs cache');
    await this.provider.write('pairs', pairs);
  }

  async saveStats(stats: unknown): Promise<void> {
    logger.info('Writing stats cache');
    await this.provider.write('stats', stats);
  }

  async saveLastUpdate(timestamp: string): Promise<void> {
    logger.info({ timestamp }, 'Writing last update cache');
    await this.provider.write('lastUpdate', { timestamp });
  }

  async loadTokens(): Promise<unknown[] | null> {
    return this.provider.read('tokens');
  }

  async loadPairs(): Promise<unknown[] | null> {
    return this.provider.read('pairs');
  }

  async loadStats(): Promise<unknown | null> {
    return this.provider.read('stats');
  }

  async loadLastUpdate(): Promise<{ timestamp: string } | null> {
    return this.provider.read('lastUpdate');
  }

  async hasCache(): Promise<boolean> {
    const [tokens, pairs] = await Promise.all([
      this.provider.exists('tokens'),
      this.provider.exists('pairs')
    ]);
    return tokens && pairs;
  }
}
