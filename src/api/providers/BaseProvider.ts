/**
 * Generic provider response shape.
 * Each provider normalizes its data to this shape.
 */
export interface NormalizedPair {
  pairAddress: string;
  baseToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  quoteToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  dexId: string;
  chainId: string;
  liquidity: number;
  liquidityUsd: number;
  priceUsd: number;
  priceNative: number;
  volumeUsd: number;
  txns24h: number;
  fdv: number;
  marketCap: number;
  pairCreatedAt: string;
  
  // Phase 2 extended fields
  poolAddress?: string;
  factory?: string;
  router?: string;
  protocol?: string;
  feeTier?: number;
  reserve0?: string;
  reserve1?: string;
  liquiditySource?: string;
  createdAtBlock?: number;
}

export interface NormalizedResponse {
  pairs: NormalizedPair[];
  providerId: string;
  fetchedAt: string;
}

/**
 * Abstract base provider with common interface.
 */
export abstract class BaseProvider {
  protected readonly providerId: string;
  protected readonly name: string;

  constructor(providerId: string, name: string) {
    this.providerId = providerId;
    this.name = name;
  }

  /**
   * Fetch and normalize pairs from this provider.
   */
  abstract fetchPairs(): Promise<NormalizedResponse>;

  /**
   * Provider health check.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchPairs();
      return response.pairs.length > 0;
    } catch {
      return false;
    }
  }

  getId(): string {
    return this.providerId;
  }

  getName(): string {
    return this.name;
  }
}
