import { describe, expect, it } from 'vitest';
import { DiscoveryService } from '../src/services/DiscoveryService.js';
import { DiscoveryPayload } from '../src/discovery/DiscoveryEngine.js';

class FailingEngine {
  async refresh(): Promise<DiscoveryPayload> {
    throw new Error('Discovery failure');
  }

  async fetchCached(): Promise<DiscoveryPayload | null> {
    return {
      pairs: [],
      tokens: [],
      stats: { discoveredPairs: 0, discoveredTokens: 0, minLiquidity: 5000, minVolume: 1000, lastRefreshed: new Date().toISOString() }
    };
  }
}

describe('DiscoveryService fallback behaviour', () => {
  it('returns cached data when refresh fails', async () => {
    const service = new DiscoveryService(new FailingEngine() as any);
    const result = await service.refresh();

    expect(result.pairs).toEqual([]);
    expect(result.tokens).toEqual([]);
    expect(result.stats).toHaveProperty('discoveredPairs', 0);
  });
});
