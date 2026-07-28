import { describe, it, expect, beforeEach } from 'vitest';
import { PairQueryBuilder, QueryParams } from '../src/utils/PairQueryBuilder.js';
import { Pair } from '../src/types/Pair.js';

describe('PairQueryBuilder', () => {
  let pairs: Pair[];

  beforeEach(() => {
    pairs = [
      {
        pairAddress: '0x1',
        dex: 'uniswap',
        baseToken: '0xaaaa',
        quoteToken: '0xbbbb',
        chain: 'base',
        liquidity: 1000000,
        volume24h: 500000,
        priceUsd: 100,
        txns24h: 1000,
        score: 0.95,
        lastUpdated: new Date().toISOString()
      },
      {
        pairAddress: '0x2',
        dex: 'pancakeswap',
        baseToken: '0xcccc',
        quoteToken: '0xdddd',
        chain: 'ethereum',
        liquidity: 500000,
        volume24h: 250000,
        priceUsd: 50,
        txns24h: 500,
        score: 0.75,
        lastUpdated: new Date().toISOString()
      },
      {
        pairAddress: '0x3',
        dex: 'uniswap',
        baseToken: '0xeeee',
        quoteToken: '0xffff',
        chain: 'base',
        liquidity: 100000,
        volume24h: 50000,
        priceUsd: 10,
        txns24h: 100,
        score: 0.5,
        lastUpdated: new Date().toISOString()
      }
    ];
  });

  it('should filter by chain', () => {
    const params: QueryParams = { chain: 'base' };
    const filtered = PairQueryBuilder.filter(pairs, params);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.chain === 'base')).toBe(true);
  });

  it('should filter by dex', () => {
    const params: QueryParams = { dex: 'uniswap' };
    const filtered = PairQueryBuilder.filter(pairs, params);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.dex === 'uniswap')).toBe(true);
  });

  it('should filter by liquidity range', () => {
    const params: QueryParams = { minLiquidity: 200000, maxLiquidity: 700000 };
    const filtered = PairQueryBuilder.filter(pairs, params);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].pairAddress).toBe('0x2');
  });

  it('should filter by score range', () => {
    const params: QueryParams = { minScore: 0.8 };
    const filtered = PairQueryBuilder.filter(pairs, params);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].score).toBe(0.95);
  });

  it('should search by token address', () => {
    const params: QueryParams = { search: '0xaaaa' };
    const filtered = PairQueryBuilder.filter(pairs, params);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].pairAddress).toBe('0x1');
  });

  it('should sort by liquidity ascending', () => {
    const sorted = PairQueryBuilder.sort(pairs, 'liquidity', 'asc');
    expect(sorted[0].liquidity).toBe(100000);
    expect(sorted[sorted.length - 1].liquidity).toBe(1000000);
  });

  it('should sort by score descending', () => {
    const sorted = PairQueryBuilder.sort(pairs, 'score', 'desc');
    expect(sorted[0].score).toBe(0.95);
    expect(sorted[sorted.length - 1].score).toBe(0.5);
  });

  it('should paginate results', () => {
    const result = PairQueryBuilder.paginate(pairs, 1, 2);
    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.pages).toBe(2);
    expect(result.pagination.hasMore).toBe(true);
  });

  it('should execute full query with filters, sort, and pagination', () => {
    const params: QueryParams = {
      chain: 'base',
      sortBy: 'score',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    };
    const result = PairQueryBuilder.execute(pairs, params);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].pairAddress).toBe('0x1'); // Higher score
    expect(result.pagination.total).toBe(2);
  });
});
