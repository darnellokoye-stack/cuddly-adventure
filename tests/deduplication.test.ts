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
});
