
/**
 * Metrics for calculating Market Opportunity Score.
 * Focused on arbitrage and trading opportunity identification.
 */
export interface OpportunityMetrics {
  liquidity: number;
  volume24h: number;
  priceUsd: number;
  txns24h: number;
  tokenAge: number; // days
  holderCount?: number;
  dexCoverage: number; // number of DEXs
  poolCount: number;
  buyTax?: number;
  sellTax?: number;
  riskScore?: number;
  sources: number; // provider coverage
}

/**
 * Scores pairs based on arbitrage potential rather than popularity.
 *
 * Scoring factors:
 * - Liquidity depth (40%; higher liquidity = better execution)
 * - Volume consistency (25%; shows trading activity)
 * - DEX coverage (15%; more sources = better opportunities)
 * - Token health (10%; age, holders, taxes)
 * - Risk level (10%; lower risk = safer opportunities)
 */
export class MarketOpportunityScore {
  calculate(metrics: OpportunityMetrics): number {
    const liquidityScore = this.scoreLiquidity(metrics.liquidity);
    const volumeScore = this.scoreVolume(metrics.volume24h);
    const coverageScore = this.scoreCoverage(metrics.dexCoverage, metrics.sources);
    const healthScore = this.scoreHealth(metrics);
    const riskScore = this.scoreRisk(metrics.riskScore ?? 50, metrics.buyTax ?? 0, metrics.sellTax ?? 0);

    const weighted =
      liquidityScore * 0.40 +
      volumeScore * 0.25 +
      coverageScore * 0.15 +
      healthScore * 0.10 +
      riskScore * 0.10;

    return Math.round(Math.max(0, Math.min(100, weighted * 100)));
  }

  /**
   * Score liquidity (0-1).
   * Targets: 50k = 0.5, 500k+ = 1.0
   */
  private scoreLiquidity(liquidity: number): number {
    if (liquidity < 1000) return 0;
    if (liquidity > 500000) return 1;
    return Math.log(liquidity / 1000 + 1) / Math.log(500000 / 1000 + 1);
  }

  /**
   * Score volume (0-1).
   * Targets: 1k = 0.2, 100k+ = 1.0
   */
  private scoreVolume(volume: number): number {
    if (volume < 100) return 0;
    if (volume > 100000) return 1;
    return Math.log(volume / 100 + 1) / Math.log(100000 / 100 + 1);
  }

  /**
   * Score DEX coverage and multi-provider verification (0-1).
   * Multiple sources for same pair = higher confidence.
   */
  private scoreCoverage(dexCount: number, sources: number): number {
    const dexScore = Math.min(1, dexCount / 3);
    const sourceScore = Math.min(1, sources / 2);
    return (dexScore + sourceScore) / 2;
  }

  /**
   * Score token health metrics (0-1).
   */
  private scoreHealth(metrics: OpportunityMetrics): number {
    let score = 0.5; // baseline

    // Age: older = better
    if (metrics.tokenAge > 30) score += 0.2;
    else if (metrics.tokenAge > 7) score += 0.1;

    // Holder count: more = better (avoids concentrated positions)
    if (metrics.holderCount && metrics.holderCount > 100) score += 0.15;
    else if (metrics.holderCount && metrics.holderCount > 20) score += 0.08;

    // Pool diversity: more pools = more liquidity venues
    if (metrics.poolCount > 2) score += 0.15;
    else if (metrics.poolCount > 1) score += 0.08;

    return Math.min(1, score);
  }

  /**
   * Score risk level (0-1, where 1 = safest).
   */
  private scoreRisk(riskScore: number, buyTax: number, sellTax: number): number {
    // Risk score: 0-100, convert to 0-1 with inversion (low risk = high score)
    const riskScoreFactor = 1 - Math.min(1, riskScore / 100);

    // Tax penalties: high taxes reduce execution quality
    const maxTax = Math.max(buyTax, sellTax);
    const taxFactor = maxTax > 15 ? 0.5 : maxTax > 5 ? 0.75 : 1.0;

    return riskScoreFactor * taxFactor;
  }

  /**
   * Identify high-opportunity pairs.
   */
  static isHighOpportunity(score: number): boolean {
    return score >= 70;
  }

  /**
   * Identify medium-opportunity pairs.
   */
  static isMediumOpportunity(score: number): boolean {
    return score >= 50 && score < 70;
  }

  /**
   * Identify low-opportunity pairs.
   */
  static isLowOpportunity(score: number): boolean {
    return score < 50;
  }
}
