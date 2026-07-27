import { DexScreenerResponse } from '../types/ApiResponses.js';
import { CoinGeckoClient } from '../api/CoinGeckoClient.js';
import { DiscoveryProvider } from '../api/DiscoveryProvider.js';
import { DexScreenerClient } from '../api/DexScreenerClient.js';
import { PairDiscovery } from './PairDiscovery.js';
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
import { config } from '../config/config.js';

export interface DiscoveryPayload {
  tokens: Token[];
  pairs: Pair[];
  stats: Record<string, number | string>;
}

/**
 * Orchestrates Base token and pair discovery.
 */
export class DiscoveryEngine {
  private readonly dexClient: DiscoveryProvider;
  private readonly geckoClient = new CoinGeckoClient();
  private readonly cacheManager = new CacheManager(new FileCache());
  private readonly filters = [
    new ValidationFilter(),
    new LiquidityFilter(),
    new ScamFilter()
  ];
  private readonly rankingEngine = new RankingEngine();
  private readonly tokenAggregator = new TokenAggregator();

  constructor(discoveryProvider: DiscoveryProvider = new DexScreenerClient()) {
    this.dexClient = discoveryProvider;
  }

  async refresh(): Promise<DiscoveryPayload> {
    logger.info('Discovery refresh started');

    const rawPairs = await this.fetchPrimaryPairs();
    const transformedPairs = await this.enrichPairs(rawPairs.pairs);
    const deduplicated = deduplicatePairs(transformedPairs);
    const filtered = deduplicated.filter((pair) => this.filters.every((filter) => filter.filter(pair)));
    const ranked = this.rankingEngine.rankPairs(filtered);
    const tokens = this.tokenAggregator.aggregate(ranked);
    const uniqueTokens = deduplicateTokens(tokens);
    const stats = this.generateStats(ranked, uniqueTokens);

    await this.cacheManager.savePairs(ranked);
    await this.cacheManager.saveTokens(uniqueTokens);
    await this.cacheManager.saveStats(stats);
    await this.cacheManager.saveLastUpdate(nowIso());

    logger.info({ discovered: ranked.length, tokens: uniqueTokens.length }, 'Discovery refresh completed');
    return { pairs: ranked, tokens: uniqueTokens, stats };
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

  private async fetchPrimaryPairs(): Promise<DexScreenerResponse> {
    try {
      return await this.dexClient.fetchPairs();
    } catch (error) {
      logger.warn({ error }, 'DexScreener fetch failed');
      throw new Error('Primary discovery source unavailable');
    }
  }

  private async enrichPairs(pairs: DexScreenerResponse['pairs']): Promise<Pair[]> {
    const transformed = pairs.map(PairDiscovery.transform);
    return Promise.all(transformed.map((pair) => this.enrichPair(pair)));
  }

  private async enrichPair(pair: Pair): Promise<Pair> {
    try {
      const tokenMetadata = await this.geckoClient.fetchTokenMetadata(pair.baseToken);
      if (tokenMetadata.priceUsd > 0) {
        pair.priceUsd = tokenMetadata.priceUsd;
      }
      return pair;
    } catch {
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
}
