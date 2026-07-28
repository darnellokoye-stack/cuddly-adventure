import { describe, it, expect, beforeEach } from 'vitest';
import { DetectionEngine } from '../src/discovery/DetectionEngine.js';
import { DiscoveryEventBus } from '../src/events/DiscoveryEventBus.js';
import { Pair } from '../src/types/Pair.js';

describe('DetectionEngine', () => {
  let engine: DetectionEngine;
  let eventBus: DiscoveryEventBus;

  beforeEach(() => {
    eventBus = new DiscoveryEventBus();
    engine = new DetectionEngine(eventBus);
  });

  it('should detect new pools', async () => {
    const newPool: Pair = {
      pairAddress: '0x123',
      dex: 'uniswap',
      baseToken: '0xaaa',
      quoteToken: '0xbbb',
      chain: 'base',
      liquidity: 100000,
      volume24h: 50000,
      priceUsd: 1.0,
      txns24h: 100,
      score: 0.8,
      lastUpdated: new Date().toISOString()
    };

    let eventEmitted = false;
    eventBus.on('NEW_POOL', () => {
      eventEmitted = true;
    });

    await engine.analyze([newPool]);
    expect(eventEmitted).toBe(true);
  });

  it('should detect liquidity spikes', async () => {
    const pair1: Pair = {
      pairAddress: '0x123',
      dex: 'uniswap',
      baseToken: '0xaaa',
      quoteToken: '0xbbb',
      chain: 'base',
      liquidity: 100000,
      volume24h: 50000,
      priceUsd: 1.0,
      txns24h: 100,
      score: 0.8,
      lastUpdated: new Date().toISOString()
    };

    await engine.analyze([pair1]);

    const pair2: Pair = { ...pair1, liquidity: 120000 }; // +20%

    let spikeDetected = false;
    eventBus.on('LIQUIDITY_SPIKE', () => {
      spikeDetected = true;
    });

    await engine.analyze([pair2]);
    expect(spikeDetected).toBe(true);
  });

  it('should detect liquidity drops', async () => {
    const pair1: Pair = {
      pairAddress: '0x123',
      dex: 'uniswap',
      baseToken: '0xaaa',
      quoteToken: '0xbbb',
      chain: 'base',
      liquidity: 100000,
      volume24h: 50000,
      priceUsd: 1.0,
      txns24h: 100,
      score: 0.8,
      lastUpdated: new Date().toISOString()
    };

    await engine.analyze([pair1]);

    const pair2: Pair = { ...pair1, liquidity: 80000 }; // -20%

    let dropDetected = false;
    eventBus.on('LIQUIDITY_DROP', () => {
      dropDetected = true;
    });

    await engine.analyze([pair2]);
    expect(dropDetected).toBe(true);
  });

  it('should filter pairs by opportunity score', () => {
    const pairs: Pair[] = [
      {
        pairAddress: '0x1',
        dex: 'uniswap',
        baseToken: '0xa',
        quoteToken: '0xb',
        chain: 'base',
        liquidity: 100000,
        volume24h: 50000,
        priceUsd: 1.0,
        txns24h: 100,
        score: 0.9,
        lastUpdated: new Date().toISOString()
      },
      {
        pairAddress: '0x2',
        dex: 'pancakeswap',
        baseToken: '0xc',
        quoteToken: '0xd',
        chain: 'base',
        liquidity: 50000,
        volume24h: 20000,
        priceUsd: 0.5,
        txns24h: 50,
        score: 0.4,
        lastUpdated: new Date().toISOString()
      }
    ];

    const filtered = engine.filterByOpportunityScore(pairs, 0.7);
    expect(filtered.length).toBe(1);
    expect(filtered[0].score).toBe(0.9);
  });

  it('should track snapshot size', async () => {
    const pair: Pair = {
      pairAddress: '0x123',
      dex: 'uniswap',
      baseToken: '0xaaa',
      quoteToken: '0xbbb',
      chain: 'base',
      liquidity: 100000,
      volume24h: 50000,
      priceUsd: 1.0,
      txns24h: 100,
      score: 0.8,
      lastUpdated: new Date().toISOString()
    };

    await engine.analyze([pair]);
    expect(engine.getSnapshotSize()).toBe(1);
  });
});
