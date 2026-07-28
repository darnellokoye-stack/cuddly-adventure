/**
 * Pair metadata with summary metrics and market intelligence fields.
 */
export interface Pair {
  // Core identification
  pairAddress: string;
  dex: string;
  baseToken: string;
  quoteToken: string;
  chain: string;

  // Liquidity and volume metrics
  liquidity: number;
  volume24h: number;
  priceUsd: number;
  txns24h: number;

  // Scoring and tracking
  score: number;
  lastUpdated: string;

  // Phase 2: Protocol and exchange details
  router?: string;
  factory?: string;
  poolAddress?: string;
  reserve0?: string;
  reserve1?: string;
  feeTier?: number;
  protocol?: string;
  liquiditySource?: string;
  createdAtBlock?: number;

  // Phase 2: Discovery and change tracking
  discoveredAt?: string;
  previousScore?: number;
  scoreChange?: number;

  // Phase 2: Risk and security
  riskLevel?: 'low' | 'medium' | 'high' | 'unknown';
  securityStatus?: 'verified' | 'unverified' | 'warning';
}
