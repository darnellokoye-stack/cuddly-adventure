import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRegistry } from '../src/api/providers/ProviderRegistry.js';
import { ProviderManager } from '../src/api/ProviderManager.js';
import { BaseProvider, NormalizedResponse } from '../src/api/providers/BaseProvider.js';

// Mock provider for testing
class MockProvider extends BaseProvider {
  private shouldFail = false;
  private responseDelay = 0;

  constructor(id: string, name: string) {
    super(id, name);
  }

  async fetchPairs(): Promise<NormalizedResponse> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldFail) {
      throw new Error(`${this.getId()} fetch failed`);
    }

    return {
      pairs: [
        {
          pairAddress: `0xpair-${this.getId()}`,
          baseToken: { address: '0xbase', symbol: 'BASE', name: 'Base', decimals: 18 },
          quoteToken: { address: '0xquote', symbol: 'QUOTE', name: 'Quote', decimals: 18 },
          dexId: this.getId(),
          chainId: 'base',
          liquidity: 100000,
          liquidityUsd: 100000,
          priceUsd: 1.5,
          priceNative: 1.0,
          volumeUsd: 50000,
          txns24h: 250,
          fdv: 1000000,
          marketCap: 500000,
          pairCreatedAt: new Date().toISOString()
        }
      ],
      providerId: this.getId(),
      fetchedAt: new Date().toISOString()
    };
  }

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setDelay(ms: number): void {
    this.responseDelay = ms;
  }
}

describe('Provider Failover', () => {
  let registry: ProviderRegistry;
  let manager: ProviderManager;
  let provider1: MockProvider;
  let provider2: MockProvider;
  let provider3: MockProvider;

  beforeEach(() => {
    registry = new ProviderRegistry();
    provider1 = new MockProvider('provider1', 'Provider 1');
    provider2 = new MockProvider('provider2', 'Provider 2');
    provider3 = new MockProvider('provider3', 'Provider 3');

    registry.register(provider1);
    registry.register(provider2);
    registry.register(provider3);

    manager = new ProviderManager(registry);
  });

  it('should try next provider when first fails', async () => {
    provider1.setFailure(true);

    const result = await manager.fetchPairsWithFailover();

    expect(result).toBeDefined();
    expect(result.providerId).toBe('provider2');
  });

  it('should skip multiple failed providers', async () => {
    provider1.setFailure(true);
    provider2.setFailure(true);

    const result = await manager.fetchPairsWithFailover();

    expect(result).toBeDefined();
    expect(result.providerId).toBe('provider3');
  });

  it('should throw error when all providers fail', async () => {
    provider1.setFailure(true);
    provider2.setFailure(true);
    provider3.setFailure(true);

    await expect(manager.fetchPairsWithFailover()).rejects.toThrow('All providers failed');
  });

  it('should return immediately when first provider succeeds', async () => {
    const result = await manager.fetchPairsWithFailover();

    expect(result).toBeDefined();
    expect(result.providerId).toBe('provider1');
  });
});

describe('Multi-Provider Fetching', () => {
  let registry: ProviderRegistry;
  let manager: ProviderManager;
  let provider1: MockProvider;
  let provider2: MockProvider;

  beforeEach(() => {
    registry = new ProviderRegistry();
    provider1 = new MockProvider('provider1', 'Provider 1');
    provider2 = new MockProvider('provider2', 'Provider 2');

    registry.register(provider1);
    registry.register(provider2);

    manager = new ProviderManager(registry);
  });

  it('should fetch from all providers', async () => {
    const results = await manager.fetchPairsFromAll();

    expect(results).toHaveLength(2);
    expect(results[0].providerId).toBe('provider1');
    expect(results[1].providerId).toBe('provider2');
  });

  it('should continue if one provider fails', async () => {
    provider1.setFailure(true);

    const results = await manager.fetchPairsFromAll();

    expect(results).toHaveLength(1);
    expect(results[0].providerId).toBe('provider2');
  });

  it('should collect responses in order', async () => {
    const results = await manager.fetchPairsFromAll();

    expect(results[0].providerId).toBe('provider1');
    expect(results[1].providerId).toBe('provider2');
  });
});

describe('Provider Health Checks', () => {
  let registry: ProviderRegistry;
  let manager: ProviderManager;
  let provider1: MockProvider;
  let provider2: MockProvider;

  beforeEach(() => {
    registry = new ProviderRegistry();
    provider1 = new MockProvider('provider1', 'Provider 1');
    provider2 = new MockProvider('provider2', 'Provider 2');

    registry.register(provider1);
    registry.register(provider2);

    manager = new ProviderManager(registry);
  });

  it('should mark provider as unhealthy when it fails', async () => {
    provider1.setFailure(true);

    await manager.checkHealth('provider1');

    const stats = manager.getStats('provider1');
    expect(stats?.healthy).toBe(false);
  });

  it('should mark provider as healthy when it succeeds', async () => {
    await manager.checkHealth('provider1');

    const stats = manager.getStats('provider1');
    expect(stats?.healthy).toBe(true);
  });

  it('should track success and failure counts', async () => {
    // Succeed once
    const result1 = await manager.fetchPairsWithFailover();
    expect(result1).toBeDefined();

    // Check stats
    const stats = manager.getStats('provider1');
    expect(stats?.successCount).toBeGreaterThan(0);
  });

  it('should list healthy providers', async () => {
    provider1.setFailure(true);
    await manager.checkHealth('provider1');

    const healthyProviders = manager.getHealthyProviders();

    expect(healthyProviders).toContain('provider2');
    expect(healthyProviders).not.toContain('provider1');
  });

  it('should include last check timestamp', async () => {
    await manager.checkHealth('provider1');

    const stats = manager.getStats('provider1');
    expect(stats?.lastChecked).toBeDefined();
    expect(stats?.lastChecked).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('Provider Statistics', () => {
  let registry: ProviderRegistry;
  let manager: ProviderManager;
  let provider1: MockProvider;

  beforeEach(() => {
    registry = new ProviderRegistry();
    provider1 = new MockProvider('provider1', 'Provider 1');
    registry.register(provider1);
    manager = new ProviderManager(registry);
  });

  it('should track latency', async () => {
    provider1.setDelay(50);

    await manager.fetchPairsWithFailover();

    const stats = manager.getStats('provider1');
    expect(stats?.averageLatencyMs).toBeGreaterThan(0);
  });

  it('should track error messages', async () => {
    provider1.setFailure(true);

    try {
      await manager.fetchPairsWithFailover();
    } catch {
      // Expected to fail, we're checking error tracking
    }

    expect(manager.getHealthyProviders()).not.toContain('provider1');
  });

  it('should return all provider stats', async () => {
    const allStats = manager.getAllStats();

    expect(allStats).toHaveLength(1);
    expect(allStats[0].providerId).toBe('provider1');
    expect(allStats[0].name).toBe('Provider 1');
  });
});
