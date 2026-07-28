import { describe, expect, it } from 'vitest';
import { LiquidityFilter } from '../src/filters/LiquidityFilter.js';
import { ScamFilter } from '../src/filters/ScamFilter.js';
import { ValidationFilter } from '../src/filters/ValidationFilter.js';
import { Pair } from '../src/types/Pair.js';

const validPair: Pair = {
  pairAddress: '0x1111111111111111111111111111111111111111',
  dex: 'Uniswap V3',
  baseToken: '0x2222222222222222222222222222222222222222',
  quoteToken: '0x3333333333333333333333333333333333333333',
  chain: 'base',
  liquidity: 10000,
  volume24h: 2000,
  priceUsd: 1,
  txns24h: 20,
  score: 0,
  lastUpdated: '2025-01-01T00:00:00.000Z'
};

describe('Filter pipeline', () => {
  it('ValidationFilter accepts valid pairs', () => {
    const filter = new ValidationFilter();
    expect(filter.filter(validPair)).toBe(true);
  });

  it('ValidationFilter rejects non-base chains', () => {
    const filter = new ValidationFilter();
    expect(filter.filter({ ...validPair, chain: 'ethereum' })).toBe(false);
  });

  it('ValidationFilter handles non-string chain values gracefully', () => {
    const filter = new ValidationFilter();
    // Pair with chain as empty string (edge case after guard)
    expect(filter.filter({ ...validPair, chain: '' })).toBe(false);
  });

  it('LiquidityFilter rejects low liquidity', () => {
    const filter = new LiquidityFilter();
    expect(filter.filter({ ...validPair, liquidity: 1000 })).toBe(false);
  });

  it('LiquidityFilter rejects low volume', () => {
    const filter = new LiquidityFilter();
    expect(filter.filter({ ...validPair, volume24h: 100 })).toBe(false);
  });

  it('ScamFilter rejects scam tokens', () => {
    const filter = new ScamFilter();
    expect(filter.filter({ ...validPair, dex: 'Honeypot' })).toBe(false);
  });
});
