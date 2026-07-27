/**
 * Token metadata and discovery metrics.
 */
export interface Token {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  decimals: number;
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  fdv: number;
  marketCap: number;
  exchanges: string[];
  pairs: string[];
  score: number;
  lastUpdated: string;
}
