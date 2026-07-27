import { describe, expect, it } from 'vitest';
import { RankingEngine } from '../src/ranking/RankingEngine.js';
import { Pair } from '../src/types/Pair.js';

const pairA: Pair = {
  pairAddress: '0x1111111111111111111111111111111111111111',
  dex: 'Uniswap V3',
  baseToken: '0x2222222222222222222222222222222222222222',
  quoteToken: '0x3333333333333333333333333333333333333333',
  liquidity: 50000,
  volume24h: 20000,
  priceUsd: 1,
  txns24h: 200,
  score: 0,
  lastUpdated: '2023-01-01T00:00:00.000Z'
};

const pairB: Pair = {
  pairAddress: '0x4444444444444444444444444444444444444444',
  dex: 'SushiSwap',
  baseToken: '0x5555555555555555555555555555555555555555',
  quoteToken: '0x6666666666666666666666666666666666666666',
  liquidity: 6000,
  volume24h: 1200,
  priceUsd: 0.5,
  txns24h: 15,
  score: 0,
  lastUpdated: '2025-01-01T00:00:00.000Z'
};

describe('RankingEngine', () => {
  it('assigns higher score to stronger pairs', () => {
    const engine = new RankingEngine();
    const [first, second] = engine.rankPairs([pairA, pairB]);
    expect(first.score).toBeGreaterThan(second.score);
  });

  it('returns scores in range 0-100', () => {
    const engine = new RankingEngine();
    const ranked = engine.rankPairs([pairA, pairB]);
    expect(ranked.every((pair) => pair.score >= 0 && pair.score <= 100)).toBe(true);
  });
});
