import { NormalizedPair, NormalizedResponse } from '../api/providers/BaseProvider.js';
import { logger } from '../utils/logger.js';

/**
 * Merged pair tracking the sources it came from.
 */
export interface MergedPair extends NormalizedPair {
  sources: string[]; // provider IDs
  sourceCount: number;
}

/**
 * Merges pair data from multiple providers.
 * Deduplicates by address and retains provider coverage info.
 */
export class ProviderMerger {
  /**
   * Merge multiple provider responses into a single normalized list.
   * Deduplicates by pair address and tracks which providers provided each pair.
   */
  static merge(responses: NormalizedResponse[]): MergedPair[] {
    const merged = new Map<string, MergedPair>();

    for (const response of responses) {
      for (const pair of response.pairs) {
        const key = this.getPairKey(pair);
        const existing = merged.get(key);

        if (!existing) {
          // First time seeing this pair
          merged.set(key, {
            ...pair,
            sources: [response.providerId],
            sourceCount: 1
          });
        } else {
          // Add this provider as a source
          if (!existing.sources.includes(response.providerId)) {
            existing.sources.push(response.providerId);
            existing.sourceCount += 1;
          }

          // Update fields with more recent/accurate data if available
          existing.liquidity = Math.max(existing.liquidity, pair.liquidity);
          existing.volumeUsd = Math.max(existing.volumeUsd, pair.volumeUsd);
          existing.priceUsd = pair.priceUsd > 0 ? pair.priceUsd : existing.priceUsd;
          existing.txns24h = Math.max(existing.txns24h, pair.txns24h);
        }
      }
    }

    const result = Array.from(merged.values());
    logger.debug(
      { totalPairs: result.length, uniquePairs: merged.size, providers: responses.length },
      'Provider merge completed'
    );

    return result;
  }

  /**
   * Get a unique key for a pair.
   */
  private static getPairKey(pair: NormalizedPair): string {
    return `${pair.chainId}:${pair.pairAddress.toLowerCase()}`;
  }

  /**
   * Filter merged pairs by minimum provider coverage.
   * Useful for detecting pairs only from one or two sources.
   */
  static filterBySourceCount(pairs: MergedPair[], minSources: number): MergedPair[] {
    return pairs.filter((pair) => pair.sourceCount >= minSources);
  }

  /**
   * Identify newly discovered pairs (single source only).
   */
  static getNewlyDiscovered(pairs: MergedPair[]): MergedPair[] {
    return this.filterBySourceCount(pairs, 1);
  }

  /**
   * Identify well-verified pairs (multiple sources).
   */
  static getVerified(pairs: MergedPair[], minSources: number = 2): MergedPair[] {
    return this.filterBySourceCount(pairs, minSources);
  }
}
