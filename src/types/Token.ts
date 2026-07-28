/**
 * Token metadata with discovery metrics and security assessment.
 */
export interface Token {
  // Core identification
  symbol: string;
  name: string;
  address: string;
  chain: string;
  decimals: number;

  // Price and market metrics
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  fdv: number;
  marketCap: number;

  // Pair and exchange coverage
  exchanges: string[];
  pairs: string[];

  // Scoring and tracking
  score: number;
  lastUpdated: string;

  // Phase 2: Holder and creator data
  holderCount?: number;
  creatorAddress?: string;
  deployerAddress?: string;
  verificationStatus?: 'verified' | 'unverified' | 'suspicious';
  tokenAge?: number; // days since deployment
  deploySuspicious?: boolean;

  // Phase 2: Tax and transfer information
  buyTax?: number; // percentage
  sellTax?: number; // percentage
  transferTax?: number; // percentage

  // Phase 2: LP lock status
  lpLockStatus?: 'locked' | 'unlocked' | 'unknown';
  lpLockExpiry?: string;

  // Phase 2: Supply information
  circulatingSupply?: string;
  totalSupply?: string;

  // Phase 2: Risk assessment
  riskScore?: number; // 0-100, higher = riskier
  securityIssues?: string[];
  honeypotRisk?: 'low' | 'medium' | 'high' | 'unknown';
  blacklistStatus?: boolean;
  tradingRestrictions?: string[];
  ownershipStatus?: 'renounced' | 'transferable' | 'unknown';
}
