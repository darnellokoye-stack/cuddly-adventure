import { Pair } from '../types/Pair.js';
import { ScoreCalculator, ScoreMetrics } from './ScoreCalculator.js';

/**
 * Ranks pairs and tokens using score weights.
 */
export class RankingEngine {
  constructor(private readonly calculator = new ScoreCalculator()) {}

  rankPairs(pairs: Pair[]): Pair[] {
    return pairs
      .map((pair) => ({
        ...pair,
        score: this.calculatePairScore(pair)
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculatePairScore(pair: Pair): number {
    const metrics: ScoreMetrics = {
      liquidity: pair.liquidity,
      volume: pair.volume24h,
      ageDays: pair.lastUpdated ? this.normalizeAge(pair.lastUpdated) : 0,
      exchangeCount: 1,
      txns24h: pair.txns24h
    };

    return this.calculator.calculate(metrics);
  }

  private normalizeAge(lastUpdated: string): number {
    const createdTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const ageDays = Math.max(0, (now - createdTime) / 86_400_000);
    return ageDays;
  }
}
