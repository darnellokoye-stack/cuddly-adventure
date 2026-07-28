import { CoinGeckoClient } from '../api/CoinGeckoClient.js';
import { DexStrategyRegistry } from './DexStrategyRegistry.js';
import { TokenAggregator } from './TokenAggregator.js';
import { LiquidityFilter } from '../filters/LiquidityFilter.js';
import { ScamFilter } from '../filters/ScamFilter.js';
import { ValidationFilter } from '../filters/ValidationFilter.js';
import { RankingEngine } from '../ranking/RankingEngine.js';
import { CacheManager } from '../cache/CacheManager.js';
import { FileCache } from '../cache/FileCache.js';
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
  private readonly cacheManager = new CacheManager(new FileCache());
  private readonly filters = [
    new ValidationFilter(),
    new LiquidityFilter(),
    new ScamFilter()
  ];
  private readonly rankingEngine = new RankingEngine();
  private readonly tokenAggregator = new TokenAggregator();
  
  // Phase 2: Detection and metrics
  private readonly eventBus = DiscoveryEventBus.getInstance();
  private lastRefreshAt?: string;
  private lastRunDurationMs = 0;
  private previousPairs: Map<string, Pair> = new Map();
  private previousTokens: Map<string, Token> = new Map();
  private eventCounts: Record<DiscoveryEventType, number> = {
    [DiscoveryEventType.NEW_PAIR]: 0,
    [DiscoveryEventType.NEW_TOKEN]: 0,
    [DiscoveryEventType.LIQUIDITY_SPIKE]: 0,
    [DiscoveryEventType.LIQUIDITY_DROP]: 0,
    [DiscoveryEventType.VOLUME_SPIKE]: 0,
    [DiscoveryEventType.HOLDER_GROWTH]: 0,
    [DiscoveryEventType.SCORE_CHANGED]: 0,
    [DiscoveryEventType.SECURITY_WARNING]: 0,
    [DiscoveryEventType.PROVIDER_FAILURE]: 0
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
      // Core identification
      pairAddress: mp.pairAddress,
      dex: registry.recognize(mp.dexId),
      baseToken: mp.baseToken.address,
      quoteToken: mp.quoteToken.address,
      chain: mp.chainId ?? 'base',

      // Liquidity and volume metrics
      liquidity: mp.liquidityUsd ?? mp.liquidity,
      volume24h: mp.volumeUsd,
      priceUsd: mp.priceUsd,
      txns24h: mp.txns24h,

      // Scoring and tracking
      score: 0,
      lastUpdated: mp.pairCreatedAt ?? nowIso(),

      // Phase 2: Protocol and exchange details
      router: mp.router,
      factory: mp.factory,
      poolAddress: mp.poolAddress,
      reserve0: mp.reserve0,
      reserve1: mp.reserve1,
      feeTier: mp.feeTier,
      protocol: mp.protocol ?? 'dex',
      liquiditySource: mp.liquiditySource,
      createdAtBlock: mp.createdAtBlock,

      // Phase 2: Discovery and change tracking
      discoveredAt: mp.pairCreatedAt ?? nowIso()
    }));

    const filteredPairs = transformedPairs.filter((pair) => this.filters.every((filter) => filter.filter(pair)));
    const enrichedPairs = await this.enrichPairs(filteredPairs);
    const rankedPairs = this.rankingEngine.rankPairs(enrichedPairs);
    const uniquePairs = deduplicatePairs(rankedPairs);
    const tokens = this.tokenAggregator.aggregate(uniquePairs);
    const uniqueTokens = deduplicateTokens(tokens);
    const stats = this.generateStats(uniquePairs, uniqueTokens);

    // Phase 2: Emit detection and change events
    this.emitPairChanges(uniquePairs);
    this.emitTokenChanges(uniqueTokens);

    // Update snapshots for next comparison
    this.previousPairs = new Map(uniquePairs.map((p) => [p.pairAddress, p]));
    this.previousTokens = new Map(uniqueTokens.map((t) => [t.address, t]));

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
    const [pairs, tokens, stats] = await Promise.all([
      this.cacheManager.loadPairs(),
      this.cacheManager.loadTokens(),
      this.cacheManager.loadStats()
    ]);

    if (!pairs || !tokens || !stats) {
      return null;
    }

    return {
      pairs: pairs as Pair[],
      tokens: tokens as Token[],
      stats: stats as Record<string, number | string>
    };
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
      eventCounts: this.eventCounts
    };
  }

  private emitPairChanges(pairs: Pair[]): void {
    for (const pair of pairs) {
      const key = pair.pairAddress.toLowerCase();
      const previous = this.previousPairs.get(key);

      if (!previous) {
        // New pair detected
        this.eventBus.emit({
          type: DiscoveryEventType.NEW_PAIR,
          timestamp: nowIso(),
          data: {
            pair,
            sources: []
          }
        });
        this.eventCounts[DiscoveryEventType.NEW_PAIR]++;
      } else {
        // Compare metrics for changes
        const liquidityChange = ((pair.liquidity - previous.liquidity) / (previous.liquidity || 1)) * 100;
        const volumeChange = ((pair.volume24h - previous.volume24h) / (previous.volume24h || 1)) * 100;

        if (Math.abs(liquidityChange) > 25) {
          // 25% change threshold
          if (liquidityChange > 0) {
            this.eventBus.emit({
              type: DiscoveryEventType.LIQUIDITY_SPIKE,
              timestamp: nowIso(),
              data: {
                pairAddress: pair.pairAddress,
                previousLiquidity: previous.liquidity,
                currentLiquidity: pair.liquidity,
                percentChange: liquidityChange
              }
            });
            this.eventCounts[DiscoveryEventType.LIQUIDITY_SPIKE]++;
          } else {
            this.eventBus.emit({
              type: DiscoveryEventType.LIQUIDITY_DROP,
              timestamp: nowIso(),
              data: {
                pairAddress: pair.pairAddress,
                previousLiquidity: previous.liquidity,
                currentLiquidity: pair.liquidity,
                percentChange: liquidityChange
              }
            });
            this.eventCounts[DiscoveryEventType.LIQUIDITY_DROP]++;
          }
        }

        if (volumeChange > 50) {
          // 50% up threshold
          this.eventBus.emit({
            type: DiscoveryEventType.VOLUME_SPIKE,
            timestamp: nowIso(),
            data: {
              pairAddress: pair.pairAddress,
              volume: pair.volume24h,
              percentChange: volumeChange
            }
          });
          this.eventCounts[DiscoveryEventType.VOLUME_SPIKE]++;
        }

        if (pair.score !== previous.score && pair.score > previous.score) {
          this.eventBus.emit({
            type: DiscoveryEventType.SCORE_CHANGED,
            timestamp: nowIso(),
            data: {
              pairAddress: pair.pairAddress,
              previousScore: previous.score,
              currentScore: pair.score,
              reason: 'Ranking updated'
            }
          });
          this.eventCounts[DiscoveryEventType.SCORE_CHANGED]++;
        }
      }
    }
  }

  private emitTokenChanges(tokens: Token[]): void {
    for (const token of tokens) {
      const key = token.address.toLowerCase();
      const previous = this.previousTokens.get(key);

      if (!previous) {
        // New token detected
        this.eventBus.emit({
          type: DiscoveryEventType.NEW_TOKEN,
          timestamp: nowIso(),
          data: {
            token,
            pairCount: 1
          }
        });
        this.eventCounts[DiscoveryEventType.NEW_TOKEN]++;
      } else if (token.holderCount && previous.holderCount) {
        const holderChange = ((token.holderCount - previous.holderCount) / (previous.holderCount || 1)) * 100;
        if (holderChange > 50) {
          // 50% growth threshold
          this.eventBus.emit({
            type: DiscoveryEventType.HOLDER_GROWTH,
            timestamp: nowIso(),
            data: {
              tokenAddress: token.address,
              previousHolders: previous.holderCount,
              currentHolders: token.holderCount,
              percentChange: holderChange
            }
          });
          this.eventCounts[DiscoveryEventType.HOLDER_GROWTH]++;
        }
      }
    }
  }
}
