import { describe, expect, it } from 'vitest';
import { deduplicatePairs } from '../src/utils/deduplicate.js';
import { Pair } from '../src/types/Pair.js';

describe('Deduplication logic', () => {
  it('keeps the highest scoring pair for duplicate addresses', () => {
    const duplicatePairs: Pair[] = [
      {
        pairAddress: '0x1111111111111111111111111111111111111111',
        dex: 'Uniswap V3',
        baseToken: '0x2222222222222222222222222222222222222222',
        quoteToken: '0x3333333333333333333333333333333333333333',
        chain: 'base',
        liquidity: 15000,
        volume24h: 3000,
        priceUsd: 1,
        txns24h: 10,
        score: 50,
        lastUpdated: '2025-01-01T00:00:00.000Z'
      },
      {
        pairAddress: '0x1111111111111111111111111111111111111111',
        dex: 'Uniswap V3',
        baseToken: '0x2222222222222222222222222222222222222222',
        quoteToken: '0x3333333333333333333333333333333333333333',
        chain: 'base',
        liquidity: 15000,
        volume24h: 3000,
        priceUsd: 1,
        txns24h: 10,
        score: 70,
        lastUpdated: '2025-01-01T00:00:00.000Z'
      }
    ];

    const result = deduplicatePairs(duplicatePairs);
    expect(result.length).toBe(1);
    expect(result[0].score).toBe(70);
  });

  it('preserves deterministic ordering when scores are equal (first occurrence wins)', () => {
    const pairA: Pair = {
      pairAddress: '0x1111111111111111111111111111111111111111',
      dex: 'Uniswap V3',
      baseToken: '0x2222222222222222222222222222222222222222',
      quoteToken: '0x3333333333333333333333333333333333333333',
      chain: 'base',
      liquidity: 15000,
      volume24h: 3000,
      priceUsd: 1,
      txns24h: 10,
      score: 50,
      lastUpdated: '2025-01-01T00:00:00.000Z'
    };

    const pairB: Pair = {
      ...pairA,
      score: 50,
      dex: 'Pancakeswap'
    };

    const result = deduplicatePairs([pairA, pairB]);
    expect(result.length).toBe(1);
    expect(result[0].dex).toBe('Uniswap V3'); // first occurrence preserved
  });

  it('handles empty input without error', () => {
    const result = deduplicatePairs([]);
    expect(result).toEqual([]);
  });

  it('preserves all pairs with distinct addresses', () => {
    const pairs: Pair[] = [
      {
        pairAddress: '0x1111111111111111111111111111111111111111',
        dex: 'Uniswap V3',
        baseToken: '0x2222222222222222222222222222222222222222',
        quoteToken: '0x3333333333333333333333333333333333333333',
        chain: 'base',
        liquidity: 15000,
        volume24h: 3000,
        priceUsd: 1,
        txns24h: 10,
        score: 50,
        lastUpdated: '2025-01-01T00:00:00.000Z'
      },
      {
        pairAddress: '0x4444444444444444444444444444444444444444',
        dex: 'Pancakeswap',
        baseToken: '0x5555555555555555555555555555555555555555',
        quoteToken: '0x6666666666666666666666666666666666666666',
        chain: 'base',
        liquidity: 20000,
        volume24h: 5000,
        priceUsd: 2,
        txns24h: 20,
        score: 60,
        lastUpdated: '2025-01-01T00:00:00.000Z'
      }
    ];

    const result = deduplicatePairs(pairs);
    expect(result.length).toBe(2);
  });
});
