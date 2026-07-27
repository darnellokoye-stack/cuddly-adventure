/**
 * Input metrics used for score calculation.
 */
export interface ScoreMetrics {
  liquidity: number;
  volume: number;
  ageDays: number;
  exchangeCount: number;
  txns24h: number;
}

/**
 * Calculates a score between 0 and 100 for discovery candidates.
 */
export class ScoreCalculator {
  private readonly weights = {
    liquidity: 0.35,
    volume: 0.3,
    age: 0.15,
    exchanges: 0.1,
    transactions: 0.1
  };

  calculate(metrics: ScoreMetrics): number {
    const liquidityScore = this.normalize(metrics.liquidity, 5000, 500000);
    const volumeScore = this.normalize(metrics.volume, 1000, 250000);
    const ageScore = this.normalize(metrics.ageDays, 7, 365);
    const exchangeScore = this.normalize(metrics.exchangeCount, 1, 12);
    const transactionScore = this.normalize(metrics.txns24h, 10, 1000);

    const weighted =
      liquidityScore * this.weights.liquidity +
      volumeScore * this.weights.volume +
      ageScore * this.weights.age +
      exchangeScore * this.weights.exchanges +
      transactionScore * this.weights.transactions;

    return Math.round(Math.max(0, Math.min(100, weighted * 100)));
  }

  private normalize(value: number, min: number, max: number): number {
    if (value <= min) {
      return 0;
    }
    if (value >= max) {
      return 1;
    }
    return (value - min) / (max - min);
  }
}
