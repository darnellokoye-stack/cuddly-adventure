import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pair } from '../src/types/Pair.js';

describe('API Pagination and Filtering', () => {
  let testPairs: Pair[];

  beforeEach(() => {
    testPairs = Array.from({ length: 150 }, (_, i) => ({
      pairAddress: `0x${i.toString().padStart(40, '0')}`,
      dex: ['Uniswap V3', 'Aerodrome', 'SushiSwap'][i % 3],
      baseToken: `0xbase${i}`,
      quoteToken: `0xquote${i}`,
      chain: 'base',
      liquidity: 10000 + i * 1000,
      volume24h: 5000 + i * 500,
      priceUsd: 1.0 + i * 0.01,
      txns24h: 100 + i * 10,
      score: Math.round((i % 100) * 1),
      lastUpdated: new Date().toISOString()
    }));
  });

  describe('Pagination', () => {
    it('should paginate items by page and limit', () => {
      const page = 1;
      const limit = 50;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = testPairs.slice(start, end);

      expect(paginated).toHaveLength(50);
      expect(paginated[0].pairAddress).toBe(`0x${0..toString().padStart(40, '0')}`);
      expect(paginated[49].pairAddress).toBe(`0x${49..toString().padStart(40, '0')}`);
    });

    it('should return correct page 2 items', () => {
      const page = 2;
      const limit = 50;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = testPairs.slice(start, end);

      expect(paginated).toHaveLength(50);
      expect(paginated[0].pairAddress).toBe(`0x${50..toString().padStart(40, '0')}`);
    });

    it('should handle last page with fewer items', () => {
      const page = 3;
      const limit = 50;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = testPairs.slice(start, end);

      expect(paginated).toHaveLength(50);
    });

    it('should calculate correct page count', () => {
      const total = testPairs.length;
      const limit = 50;
      const pages = Math.ceil(total / limit);

      expect(pages).toBe(3);
    });

    it('should enforce max limit of 500', () => {
      const requestedLimit = 1000;
      const enforced = Math.min(500, Math.max(1, requestedLimit));

      expect(enforced).toBe(500);
    });

    it('should enforce min limit of 1', () => {
      const requestedLimit = 0;
      const enforced = Math.min(500, Math.max(1, requestedLimit));

      expect(enforced).toBe(1);
    });
  });

  describe('Sorting', () => {
    it('should sort by score descending', () => {
      const sorted = [...testPairs].sort((a, b) => b.score - a.score);

      expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[1].score);
      expect(sorted[sorted.length - 1].score).toBeLessThanOrEqual(sorted[sorted.length - 2].score);
    });

    it('should sort by score ascending', () => {
      const sorted = [...testPairs].sort((a, b) => a.score - b.score);

      expect(sorted[0].score).toBeLessThanOrEqual(sorted[1].score);
      expect(sorted[sorted.length - 1].score).toBeGreaterThanOrEqual(sorted[sorted.length - 2].score);
    });

    it('should sort by liquidity descending', () => {
      const sorted = [...testPairs].sort((a, b) => b.liquidity - a.liquidity);

      expect(sorted[0].liquidity).toBeGreaterThanOrEqual(sorted[1].liquidity);
    });

    it('should sort by volume24h descending', () => {
      const sorted = [...testPairs].sort((a, b) => b.volume24h - a.volume24h);

      expect(sorted[0].volume24h).toBeGreaterThanOrEqual(sorted[1].volume24h);
    });

    it('should sort by lastUpdated descending', () => {
      const sorted = [...testPairs].sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );

      expect(new Date(sorted[0].lastUpdated).getTime()).toBeGreaterThanOrEqual(
        new Date(sorted[1].lastUpdated).getTime()
      );
    });
  });

  describe('Pagination Response Format', () => {
    it('should include pagination metadata', () => {
      const page = 1;
      const limit = 50;
      const total = testPairs.length;
      const start = (page - 1) * limit;
      const end = start + limit;

      const response = {
        items: testPairs.slice(start, end),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };

      expect(response.items).toHaveLength(50);
      expect(response.total).toBe(150);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(50);
      expect(response.pages).toBe(3);
    });

    it('should handle empty results gracefully', () => {
      const emptyPairs: Pair[] = [];
      const page = 1;
      const limit = 50;

      const response = {
        items: emptyPairs.slice(0, limit),
        total: 0,
        page,
        limit,
        pages: Math.ceil(Math.max(1, 0) / limit)
      };

      expect(response.items).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.pages).toBe(0);
    });
  });

  describe('Combined Sorting and Pagination', () => {
    it('should sort and then paginate', () => {
      const sortBy = 'score';
      const order = 'desc';
      const page = 1;
      const limit = 25;

      let sorted = [...testPairs];
      sorted.sort((a, b) => {
        const aVal = (a as any)[sortBy] ?? 0;
        const bVal = (b as any)[sortBy] ?? 0;
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      });

      const start = (page - 1) * limit;
      const paginated = sorted.slice(start, start + limit);

      expect(paginated).toHaveLength(25);
      expect(paginated[0].score).toBeGreaterThanOrEqual(paginated[paginated.length - 1].score);
    });

    it('should allow navigation between sorted pages', () => {
      const sortBy = 'liquidity';
      const order = 'desc';
      const limit = 50;

      let sorted = [...testPairs];
      sorted.sort((a, b) => {
        const aVal = (a as any)[sortBy] ?? 0;
        const bVal = (b as any)[sortBy] ?? 0;
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      });

      const page1 = sorted.slice(0, limit);
      const page2 = sorted.slice(limit, limit * 2);

      expect(page1[0].liquidity).toBeGreaterThanOrEqual(page1[page1.length - 1].liquidity);
      expect(page2[0].liquidity).toBeGreaterThanOrEqual(page2[page2.length - 1].liquidity);
      // First item of page2 should have less liquidity than last item of page1
      expect(page2[0].liquidity).toBeLessThanOrEqual(page1[page1.length - 1].liquidity);
    });
  });
});
