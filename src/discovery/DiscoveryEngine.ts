import { CoinGeckoClient } from '../api/CoinGeckoClient.js';
import { DexStrategyRegistry } from './DexStrategyRegistry.js';
import { TokenAggregator } from './TokenAggregator.js';
import { LiquidityFilter } from '../filters/LiquidityFilter.js';
import { ScamFilter } from '../filters/ScamFilter.js';
import { ValidationFilter } from '../filters/ValidationFilter.js';
import { RankingEngine } from '../ranking/RankingEngine.js';
import { CacheManager } from '../cache/CacheManager.js';
import { createCacheProvider } from '../cache/CacheFactory.js';
import { Token } from '../types/Token.js';
import { Pair } from '../types/Pair.js';
import { logger } from '../utils/logger.js';
import { nowIso } from '../utils/dates.js';
import { deduplicatePairs, deduplicateTokens } from '../utils/deduplicate.js';
import { mapWithConcurrency } from '../utils/concurrency.js';
import { config } from '../config/config.js';
import { ProviderRegistry } from '../api/providers/ProviderRegistry.js';
import { ProviderManager } from '../api/ProviderManager.js';
import { DexScreenerProvider } from '../api/providers/DexScreenerProvider.js';
import { ProviderMerger } from './ProviderMerger.js';
import { DiscoveryEventBus } from '../events/DiscoveryEventBus.js';
import { DiscoveryMetrics } from '../types/Metrics.js';
import { DiscoveryEventType } from '../types/Events.js';
import { DeltaEngine } from './DeltaEngine.js';
import { DeltaSnapshot } from '../types/Delta.js';
import { MarketOpportunity } from '../types/Opportunity.js';
import { OpportunityDetectionEngine } from './OpportunityDetectionEngine.js';

export interface DiscoveryPayload {
  tokens: Token[];
  pairs: Pair[];
  stats: Record<string, number | string>;
}

/**
 * Orchestrates Base token and pair discovery.
 */
export class DiscoveryEngine {
  private providerRegistry: ProviderRegistry;
  private providerManager: ProviderManager;
  private readonly geckoClient = new CoinGeckoClient();
  private readonly cacheManager = new CacheManager(createCacheProvider());
  private readonly filters = [new ValidationFilter(), new LiquidityFilter(), new ScamFilter()];
  private readonly rankingEngine = new RankingEngine();
  private readonly tokenAggregator = new TokenAggregator();
  private readonly eventBus = DiscoveryEventBus.getInstance();
  private readonly deltaEngine = new DeltaEngine({
    liquidityThresholdPct: config.liquidityThresholdPct,
    volumeThresholdPct: config.volumeThresholdPct,
    scoreThreshold: config.scoreThreshold,
    holderThresholdPct: config.holderThresholdPct
  });
  private readonly opportunityEngine = new OpportunityDetectionEngine();
  private lastRefreshAt?: string;
  private lastRunDurationMs = 0;
  private previousPairs: Pair[] = [];
  private previousTokens: Token[] = [];
  private latestDelta?: DeltaSnapshot;
  private latestOpportunities: MarketOpportunity[] = [];
  private eventCounts: Record<DiscoveryEventType, number> = {
    [DiscoveryEventType.NEW_PAIR]: 0,
    [DiscoveryEventType.NEW_TOKEN]: 0,
    [DiscoveryEventType.LIQUIDITY_SPIKE]: 0,
    [DiscoveryEventType.LIQUIDITY_DROP]: 0,
    [DiscoveryEventType.VOLUME_SPIKE]: 0,
    [DiscoveryEventType.HOLDER_GROWTH]: 0,
    [DiscoveryEventType.SCORE_CHANGED]: 0,
    [DiscoveryEventType.SECURITY_WARNING]: 0,
    [DiscoveryEventType.PROVIDER_FAILURE]: 0,
    [DiscoveryEventType.MARKET_ALERT]: 0
  };

  constructor() {
    this.providerRegistry = new ProviderRegistry();
    this.providerRegistry.register(new DexScreenerProvider());
    this.providerManager = new ProviderManager(this.providerRegistry);
  }

  async refresh(): Promise<DiscoveryPayload> {
    const refreshStartTime = Date.now();
    logger.info('Discovery refresh started');

    const { pairs: mergedPairs } = await this.fetchPrimaryPairs();
    const registry = new DexStrategyRegistry();

    const transformedPairs: Pair[] = mergedPairs.map((mp) => ({
      pairAddress: mp.pairAddress,
      dex: registry.recognize(mp.dexId),
      baseToken: mp.baseToken.address,
      quoteToken: mp.quoteToken.address,
      chain: mp.chainId ?? 'base',
      liquidity: mp.liquidityUsd ?? mp.liquidity,
      volume24h: mp.volumeUsd,
      priceUsd: mp.priceUsd,
      txns24h: mp.txns24h,
      score: 0,
      lastUpdated: mp.pairCreatedAt ?? nowIso(),
      router: mp.router,
      factory: mp.factory,
      poolAddress: mp.poolAddress,
      reserve0: mp.reserve0,
      reserve1: mp.reserve1,
      feeTier: mp.feeTier,
      protocol: mp.protocol ?? 'dex',
      liquiditySource: mp.liquiditySource,
      createdAtBlock: mp.createdAtBlock,
      discoveredAt: mp.pairCreatedAt ?? nowIso()
    }));

    const filteredPairs = transformedPairs.filter((pair) => this.filters.every((filter) => filter.filter(pair)));
    const enrichedPairs = await this.enrichPairs(filteredPairs);
    const rankedPairs = this.rankingEngine.rankPairs(enrichedPairs);
    const uniquePairs = deduplicatePairs(rankedPairs);
    const tokens = this.tokenAggregator.aggregate(uniquePairs);
    const uniqueTokens = deduplicateTokens(tokens);
    const stats = this.generateStats(uniquePairs, uniqueTokens);

    this.latestDelta = this.deltaEngine.detect(this.previousPairs, uniquePairs, this.previousTokens, uniqueTokens);
    this.latestOpportunities = this.opportunityEngine.detectOpportunities(uniquePairs);

    for (const change of this.latestDelta.changes) {
      switch (change.type) {
        case 'NEW_POOL': {
          const pair = uniquePairs.find((candidate) => candidate.pairAddress === change.pairAddress);
          if (pair) {
            this.eventBus.emit({ type: DiscoveryEventType.NEW_PAIR, timestamp: nowIso(), data: { pair, sources: [] } });
            this.eventCounts[DiscoveryEventType.NEW_PAIR]++;
          }
          break;
        }
        case 'LIQUIDITY_CHANGED': {
          const pairAddress = change.pairAddress ?? '';
          if ((change.percentChange ?? 0) > 0) {
            this.eventBus.emit({ type: DiscoveryEventType.LIQUIDITY_SPIKE, timestamp: nowIso(), data: { pairAddress, previousLiquidity: change.previousValue ?? 0, currentLiquidity: change.currentValue ?? 0, percentChange: change.percentChange ?? 0 } });
            this.eventCounts[DiscoveryEventType.LIQUIDITY_SPIKE]++;
          } else {
            this.eventBus.emit({ type: DiscoveryEventType.LIQUIDITY_DROP, timestamp: nowIso(), data: { pairAddress, previousLiquidity: change.previousValue ?? 0, currentLiquidity: change.currentValue ?? 0, percentChange: change.percentChange ?? 0 } });
            this.eventCounts[DiscoveryEventType.LIQUIDITY_DROP]++;
          }
          break;
        }
        case 'VOLUME_CHANGED': {
          const pairAddress = change.pairAddress ?? '';
          this.eventBus.emit({ type: DiscoveryEventType.VOLUME_SPIKE, timestamp: nowIso(), data: { pairAddress, volume: change.currentValue ?? 0, percentChange: change.percentChange ?? 0 } });
          this.eventCounts[DiscoveryEventType.VOLUME_SPIKE]++;
          break;
        }
        case 'SCORE_CHANGED': {
          const pairAddress = change.pairAddress ?? '';
          this.eventBus.emit({ type: DiscoveryEventType.SCORE_CHANGED, timestamp: nowIso(), data: { pairAddress, previousScore: change.previousValue ?? 0, currentScore: change.currentValue ?? 0, reason: 'Delta engine' } });
          this.eventCounts[DiscoveryEventType.SCORE_CHANGED]++;
          break;
        }
        case 'HOLDER_CHANGED': {
          const tokenAddress = change.tokenAddress ?? '';
          this.eventBus.emit({ type: DiscoveryEventType.HOLDER_GROWTH, timestamp: nowIso(), data: { tokenAddress, previousHolders: change.previousValue ?? 0, currentHolders: change.currentValue ?? 0, percentChange: change.percentChange ?? 0 } });
          this.eventCounts[DiscoveryEventType.HOLDER_GROWTH]++;
          break;
        }
        default:
          break;
      }
    }

    if (this.latestDelta.changes.length > 0) {
      this.eventBus.emit({ type: DiscoveryEventType.MARKET_ALERT, timestamp: nowIso(), data: { title: 'Market delta detected', severity: 'medium', message: `${this.latestDelta.changes.length} significant updates detected`, source: 'delta-engine' } });
      this.eventCounts[DiscoveryEventType.MARKET_ALERT]++;
    }

    this.previousPairs = uniquePairs;
    this.previousTokens = uniqueTokens;

    await this.cacheManager.savePairs(uniquePairs);
    await this.cacheManager.saveTokens(uniqueTokens);
    await this.cacheManager.saveStats(stats);
    await this.cacheManager.saveLastUpdate(nowIso());

    this.lastRefreshAt = nowIso();
    this.lastRunDurationMs = Date.now() - refreshStartTime;

    logger.info({ discovered: uniquePairs.length, tokens: uniqueTokens.length, durationMs: this.lastRunDurationMs }, 'Discovery refresh completed');
    return { pairs: uniquePairs, tokens: uniqueTokens, stats };
  }

  async fetchCached(): Promise<DiscoveryPayload | null> {
    const [pairs, tokens, stats] = await Promise.all([this.cacheManager.loadPairs(), this.cacheManager.loadTokens(), this.cacheManager.loadStats()]);

    if (!pairs || !tokens || !stats) {
      return null;
    }

    return {
      pairs: pairs as Pair[],
      tokens: tokens as Token[],
      stats: stats as Record<string, number | string>
    };
  }

  getLatestDelta(): DeltaSnapshot | undefined {
    return this.latestDelta;
  }

  getOpportunities(): MarketOpportunity[] {
    return this.latestOpportunities;
  }

  private async fetchPrimaryPairs(): Promise<{ pairs: ReturnType<typeof ProviderMerger.merge> }> {
    try {
      const responses = await this.providerManager.fetchPairsFromAll();
      const merged = ProviderMerger.merge(responses);
      return { pairs: merged };
    } catch (error) {
      logger.warn({ error }, 'ProviderManager failed to fetch pairs');
      throw new Error('Primary discovery sources unavailable');
    }
  }

  private async enrichPairs(pairs: Pair[]): Promise<Pair[]> {
    return mapWithConcurrency(pairs, 8, (pair) => this.enrichPair(pair));
  }

  private async enrichPair(pair: Pair): Promise<Pair> {
    try {
      const tokenMetadata = await this.geckoClient.fetchTokenMetadata(pair.baseToken);
      if (tokenMetadata.priceUsd > 0) {
        pair.priceUsd = tokenMetadata.priceUsd;
      }
      return pair;
    } catch (error) {
      logger.debug({ pairAddress: pair.pairAddress, error }, 'CoinGecko metadata enrichment failed');
      return pair;
    }
  }

  private generateStats(pairs: Pair[], tokens: Token[]): Record<string, number | string> {
    return {
      discoveredPairs: pairs.length,
      discoveredTokens: tokens.length,
      minLiquidity: config.minLiquidity,
      minVolume: config.minVolume,
      lastRefreshed: nowIso()
    };
  }

  async getMetrics(): Promise<DiscoveryMetrics> {
    const cached = await this.fetchCached();
    const cacheAgeMs = await this.cacheManager.getCacheAgeMs('pairs');

    return {
      lastRefreshAt: this.lastRefreshAt,
      lastRunDurationMs: this.lastRunDurationMs,
      cacheAgeMs,
      discoveredPairs: cached?.pairs.length ?? 0,
      discoveredTokens: cached?.tokens.length ?? 0,
      providerStats: this.providerManager.getAllStats(),
      eventCounts: this.eventCounts,
      opportunityCount: this.latestOpportunities.length,
      deltaCount: this.latestDelta?.changes.length ?? 0
    };
  }
}
