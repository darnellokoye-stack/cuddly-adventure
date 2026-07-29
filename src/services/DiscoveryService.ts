import { DiscoveryEngine, DiscoveryPayload } from '../discovery/DiscoveryEngine.js';
import { logger } from '../utils/logger.js';
import { DiscoveryMetrics } from '../types/Metrics.js';
import { DeltaSnapshot } from '../types/Delta.js';
import { MarketOpportunity } from '../types/Opportunity.js';

/**
 * Service responsible for discovery orchestration and cached fallback.
 */
export class DiscoveryService {
  private readonly engine: DiscoveryEngine;

  constructor(engine: DiscoveryEngine = new DiscoveryEngine()) {
    this.engine = engine;
  }

  async refresh(): Promise<DiscoveryPayload> {
    try {
      return await this.engine.refresh();
    } catch (error) {
      logger.warn({ error }, 'Discovery refresh failed, attempting cached fallback');
      const cached = await this.engine.fetchCached();
      if (cached) {
        logger.info('Returning cached discovery payload after refresh failure');
        return cached;
      }
      throw new Error('Discovery failed and no cached data is available');
    }
  }

  async getTokens(): Promise<DiscoveryPayload['tokens']> {
    const cached = await this.engine.fetchCached();
    if (!cached) {
      throw new Error('Cached token data unavailable');
    }
    return cached.tokens;
  }

  async getPairs(): Promise<DiscoveryPayload['pairs']> {
    const cached = await this.engine.fetchCached();
    if (!cached) {
      throw new Error('Cached pair data unavailable');
    }
    return cached.pairs;
  }

  async getStats(): Promise<DiscoveryPayload['stats']> {
    const cached = await this.engine.fetchCached();
    if (!cached) {
      throw new Error('Cached stats unavailable');
    }
    return cached.stats;
  }

  async getMetrics(): Promise<DiscoveryMetrics> {
    return this.engine.getMetrics();
  }

  async getDelta(): Promise<DeltaSnapshot | undefined> {
    return this.engine.getLatestDelta();
  }

  async getOpportunities(): Promise<MarketOpportunity[]> {
    return this.engine.getOpportunities();
  }

  async getToken(address: string) {
    const tokens = await this.getTokens();
    return tokens.find((token) => token.address.toLowerCase() === address.toLowerCase()) ?? null;
  }

  async getPair(address: string) {
    const pairs = await this.getPairs();
    return pairs.find((pair) => pair.pairAddress.toLowerCase() === address.toLowerCase()) ?? null;
  }
}
