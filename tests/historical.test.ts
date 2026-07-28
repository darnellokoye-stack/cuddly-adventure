import { describe, it, expect, beforeEach } from 'vitest';
import { HistoricalTracker } from '../src/discovery/HistoricalTracker.js';
import { Pair } from '../src/types/Pair.js';
import { Token } from '../src/types/Token.js';

describe('HistoricalTracker', () => {
  let tracker: HistoricalTracker;

  beforeEach(() => {
    tracker = new HistoricalTracker(undefined, 5); // Keep last 5 snapshots
  });

  it('should record snapshots', async () => {
    const pairs: Pair[] = [
      {
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
      }
    ];

    const tokens: Token[] = [
      {
        address: '0xaaa',
        symbol: 'AAA',
        name: 'Token A',
        decimals: 18
      }
    ];

    const snapshot = await tracker.recordSnapshot(pairs, tokens, { pairCount: 1 });

    expect(snapshot.pairs).toHaveLength(1);
    expect(snapshot.tokens).toHaveLength(1);
    expect(tracker.getSnapshotCount()).toBe(1);
  });

  it('should get latest snapshot', async () => {
    const pairs: Pair[] = [];
    const tokens: Token[] = [];

    const snapshot1 = await tracker.recordSnapshot(pairs, tokens, {});
    const latestBefore = tracker.getLatestSnapshot();
    expect(latestBefore).toEqual(snapshot1);

    await new Promise(r => setTimeout(r, 10));
    const snapshot2 = await tracker.recordSnapshot(pairs, tokens, {});
    const latestAfter = tracker.getLatestSnapshot();

    expect(latestAfter?.timestamp).not.toBe(snapshot1.timestamp);
  });

  it('should compare snapshots and detect changes', async () => {
    const pairs1: Pair[] = [
      {
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
      }
    ];

    const snapshot1 = await tracker.recordSnapshot(pairs1, [], {});

    const pairs2: Pair[] = [
      ...pairs1,
      {
        pairAddress: '0x456',
        dex: 'pancakeswap',
        baseToken: '0xccc',
        quoteToken: '0xddd',
        chain: 'base',
        liquidity: 50000,
        volume24h: 25000,
        priceUsd: 0.5,
        txns24h: 50,
        score: 0.6,
        lastUpdated: new Date().toISOString()
      }
    ];

    const snapshot2 = await tracker.recordSnapshot(pairs2, [], {});

    const comparison = tracker.compare(snapshot2, snapshot1);
    expect(comparison.newPairs).toHaveLength(1);
    expect(comparison.newPairs[0].pairAddress).toBe('0x456');
  });

  it('should enforce maximum snapshot count', async () => {
    for (let i = 0; i < 7; i++) {
      await tracker.recordSnapshot([], [], {});
    }

    // Max is 5, so should only keep last 5
    expect(tracker.getSnapshotCount()).toBeLessThanOrEqual(5);
  });

  it('should analyze pair evolution', async () => {
    const basePair: Pair = {
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

    await tracker.recordSnapshot([basePair], [], {});

    const pairUp = { ...basePair, liquidity: 120000 }; // +20%
    await tracker.recordSnapshot([pairUp], [], {});

    const pairDown = { ...basePair, liquidity: 110000 }; // +10%
    await tracker.recordSnapshot([pairDown], [], {});

    const evolution = tracker.analyzePairEvolution('base:0x123');
    expect(evolution.found).toBe(true);
    expect(evolution.snapshotCount).toBe(3);
    expect(evolution.liquidityTrend.length).toBeGreaterThan(0);
  });
});
