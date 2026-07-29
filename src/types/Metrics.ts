import { DiscoveryEventType } from './Events.js';
import { ProviderStats } from '../api/ProviderManager.js';

export interface DiscoveryMetrics {
  lastRefreshAt?: string;
  lastRunDurationMs?: number;
  cacheAgeMs?: number | null;
  discoveredPairs: number;
  discoveredTokens: number;
  providerStats: ProviderStats[];
  eventCounts: Record<DiscoveryEventType, number>;
  opportunityCount?: number;
  deltaCount?: number;
}
