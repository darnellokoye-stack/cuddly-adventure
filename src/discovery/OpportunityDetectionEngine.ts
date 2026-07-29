import { Pair } from '../types/Pair.js';
import { MarketOpportunity } from '../types/Opportunity.js';
import { nowIso } from '../utils/dates.js';
import { RouteAnalysisEngine } from './RouteAnalysisEngine.js';

export class OpportunityDetectionEngine {
  constructor(private readonly routeEngine = new RouteAnalysisEngine()) {}

  detectOpportunities(pairs: Pair[]): MarketOpportunity[] {
    return pairs
      .filter((pair) => pair.score >= 60)
      .slice(0, 10)
      .map((pair, index) => ({
        id: `opp-${pair.pairAddress}-${index}`,
        pairAddress: pair.pairAddress,
        tokenAddress: pair.baseToken,
        estimatedProfitUsd: Math.max(0, pair.liquidity * 0.0025),
        confidence: Math.min(99, pair.score),
        riskScore: Math.max(0.1, 1 - pair.score / 100),
        executionProbability: Math.min(99, 45 + pair.score / 2),
        suggestedRoute: this.routeEngine.analyzeRoutes([pair])[0] ?? {
          path: [pair.baseToken, pair.quoteToken],
          estimatedProfitUsd: 0,
          confidence: 0,
          riskScore: 1,
          executionProbability: 0,
          liquidityDepth: pair.liquidity,
          complexity: 1
        },
        opportunityLifetimeEstimateMs: 60 * 60 * 1000,
        createdAt: nowIso(),
        status: 'DISCOVERED'
      }));
  }
}
