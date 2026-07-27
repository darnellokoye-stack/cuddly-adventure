/**
 * Pair metadata with summary metrics.
 */
export interface Pair {
  pairAddress: string;
  dex: string;
  baseToken: string;
  quoteToken: string;
  liquidity: number;
  volume24h: number;
  priceUsd: number;
  txns24h: number;
  score: number;
  lastUpdated: string;
}
