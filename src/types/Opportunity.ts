export interface OpportunityRoute {
  path: string[];
  estimatedProfitUsd: number;
  confidence: number;
  riskScore: number;
  executionProbability: number;
  liquidityDepth: number;
  complexity: number;
}

export interface MarketOpportunity {
  id: string;
  pairAddress: string;
  tokenAddress: string;
  estimatedProfitUsd: number;
  confidence: number;
  riskScore: number;
  executionProbability: number;
  suggestedRoute: OpportunityRoute;
  opportunityLifetimeEstimateMs: number;
  createdAt: string;
  status: 'DISCOVERED' | 'VALIDATED' | 'IMPROVING' | 'DECLINING' | 'EXPIRED' | 'REMOVED';
}
