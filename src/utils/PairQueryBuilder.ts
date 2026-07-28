import { Pair } from '../types/Pair.js';

/**
 * Query params for filtering and pagination.
 */
export interface QueryParams {
  chain?: string;
  dex?: string;
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume?: number;
  maxVolume?: number;
  minScore?: number;
  maxScore?: number;
  search?: string; // Search by token symbol/address
  sortBy?: 'liquidity' | 'volume' | 'score' | 'txns' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Paginated result wrapper.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

/**
 * Query builder for filtering and paginating pairs.
 */
export class PairQueryBuilder {
  static filter(pairs: Pair[], params: QueryParams): Pair[] {
    let filtered = pairs;

    // Chain filter
    if (params.chain) {
      filtered = filtered.filter((p) => p.chain?.toLowerCase() === params.chain?.toLowerCase());
    }

    // DEX filter
    if (params.dex) {
      filtered = filtered.filter((p) => p.dex?.toLowerCase() === params.dex?.toLowerCase());
    }

    // Liquidity range filter
    if (params.minLiquidity !== undefined) {
      filtered = filtered.filter((p) => p.liquidity >= params.minLiquidity!);
    }
    if (params.maxLiquidity !== undefined) {
      filtered = filtered.filter((p) => p.liquidity <= params.maxLiquidity!);
    }

    // Volume range filter
    if (params.minVolume !== undefined) {
      filtered = filtered.filter((p) => p.volume24h >= params.minVolume!);
    }
    if (params.maxVolume !== undefined) {
      filtered = filtered.filter((p) => p.volume24h <= params.maxVolume!);
    }

    // Score range filter
    if (params.minScore !== undefined) {
      filtered = filtered.filter((p) => p.score >= params.minScore!);
    }
    if (params.maxScore !== undefined) {
      filtered = filtered.filter((p) => p.score <= params.maxScore!);
    }

    // Search filter (by token symbol or address)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.baseToken?.toLowerCase().includes(searchLower) ||
          p.quoteToken?.toLowerCase().includes(searchLower) ||
          p.pairAddress?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  static sort(pairs: Pair[], sortBy?: string, sortOrder?: string): Pair[] {
    const sorted = [...pairs];
    const order = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'liquidity':
        sorted.sort((a, b) => (a.liquidity - b.liquidity) * order);
        break;
      case 'volume':
        sorted.sort((a, b) => (a.volume24h - b.volume24h) * order);
        break;
      case 'score':
        sorted.sort((a, b) => (a.score - b.score) * order);
        break;
      case 'txns':
        sorted.sort((a, b) => (a.txns24h - b.txns24h) * order);
        break;
      case 'price':
        sorted.sort((a, b) => (a.priceUsd - b.priceUsd) * order);
        break;
      default:
        sorted.sort((a, b) => (a.score - b.score) * -1); // Default: score desc
    }

    return sorted;
  }

  static paginate<T>(items: T[], page: number = 1, limit: number = 20): PaginatedResult<T> {
    const total = items.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = items.slice(start, end);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      }
    };
  }

  static execute(
    pairs: Pair[],
    params: QueryParams
  ): PaginatedResult<Pair> {
    const chain = params.chain?.toLowerCase();
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(params.limit ?? 20, 100)); // Max 100 per page

    let result = this.filter(pairs, params);
    result = this.sort(result, params.sortBy, params.sortOrder);

    return this.paginate(result, page, limit);
  }
}
