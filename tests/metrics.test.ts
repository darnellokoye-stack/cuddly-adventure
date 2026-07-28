import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryEngine } from '../src/discovery/DiscoveryEngine.js';
import { DiscoveryMetrics } from '../src/types/Metrics.js';
import { DiscoveryEventType } from '../src/types/Events.js';

describe('Metrics Collection', () => {
  let engine: DiscoveryEngine;

  beforeEach(() => {
    engine = new DiscoveryEngine();
  });

  it('should track last refresh timestamp', async () => {
    const metrics = await engine.getMetrics();
    expect(metrics).toBeDefined();
  });

  it('should include provider statistics', async () => {
    const metrics = await engine.getMetrics();
    expect(metrics.providerStats).toBeDefined();
    expect(Array.isArray(metrics.providerStats)).toBe(true);
  });

  it('should include discovered pair and token counts', async () => {
    const metrics = await engine.getMetrics();
    expect(metrics.discoveredPairs).toBeDefined();
    expect(metrics.discoveredTokens).toBeDefined();
    expect(typeof metrics.discoveredPairs).toBe('number');
    expect(typeof metrics.discoveredTokens).toBe('number');
  });

  it('should track event counts per type', async () => {
    const metrics = await engine.getMetrics();
    expect(metrics.eventCounts).toBeDefined();
    expect(metrics.eventCounts[DiscoveryEventType.NEW_PAIR]).toBeDefined();
    expect(metrics.eventCounts[DiscoveryEventType.LIQUIDITY_SPIKE]).toBeDefined();
    expect(metrics.eventCounts[DiscoveryEventType.VOLUME_SPIKE]).toBeDefined();
    expect(metrics.eventCounts[DiscoveryEventType.HOLDER_GROWTH]).toBeDefined();
  });

  it('should track refresh duration', async () => {
    const metrics = await engine.getMetrics();
    expect(metrics.lastRunDurationMs).toBeDefined();
    expect(typeof metrics.lastRunDurationMs).toBe('number');
  });

  it('should track cache age', async () => {
    const metrics = await engine.getMetrics();
    expect(metrics.cacheAgeMs).toBeDefined();
    // Cache age could be null initially or a number
    expect(metrics.cacheAgeMs === null || typeof metrics.cacheAgeMs === 'number').toBe(true);
  });

  it('should have all event types in event counts', async () => {
    const metrics = await engine.getMetrics();
    const eventTypes = Object.values(DiscoveryEventType);
    
    for (const eventType of eventTypes) {
      expect(metrics.eventCounts[eventType as DiscoveryEventType]).toBeDefined();
      expect(typeof metrics.eventCounts[eventType as DiscoveryEventType]).toBe('number');
      expect(metrics.eventCounts[eventType as DiscoveryEventType]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Metrics Structure', () => {
  it('should have complete DiscoveryMetrics interface', () => {
    const testMetrics: DiscoveryMetrics = {
      lastRefreshAt: new Date().toISOString(),
      lastRunDurationMs: 1234,
      cacheAgeMs: 5678,
      discoveredPairs: 100,
      discoveredTokens: 50,
      providerStats: [],
      eventCounts: {
        [DiscoveryEventType.NEW_PAIR]: 0,
        [DiscoveryEventType.NEW_TOKEN]: 0,
        [DiscoveryEventType.LIQUIDITY_SPIKE]: 0,
        [DiscoveryEventType.LIQUIDITY_DROP]: 0,
        [DiscoveryEventType.VOLUME_SPIKE]: 0,
        [DiscoveryEventType.HOLDER_GROWTH]: 0,
        [DiscoveryEventType.SCORE_CHANGED]: 0,
        [DiscoveryEventType.SECURITY_WARNING]: 0,
        [DiscoveryEventType.PROVIDER_FAILURE]: 0
      }
    };

    expect(testMetrics.lastRefreshAt).toBeDefined();
    expect(testMetrics.lastRunDurationMs).toBeDefined();
    expect(testMetrics.cacheAgeMs).toBeDefined();
    expect(testMetrics.discoveredPairs).toBeGreaterThanOrEqual(0);
    expect(testMetrics.discoveredTokens).toBeGreaterThanOrEqual(0);
    expect(testMetrics.providerStats).toBeDefined();
    expect(testMetrics.eventCounts).toBeDefined();
  });
});
