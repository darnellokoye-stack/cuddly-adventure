import { Pair } from '../types/Pair.js';
import { DiscoveryEventBus } from '../events/DiscoveryEventBus.js';
import { logger } from '../utils/logger.js';

/**
 * Market opportunity detection engine.
 * Identifies new pools, liquidity changes, volume anomalies, and price movements.
 */
export class DetectionEngine {
  private eventBus: DiscoveryEventBus;
  private historicalPairs = new Map<string, Pair>();

  constructor(eventBus: DiscoveryEventBus = new DiscoveryEventBus()) {
    this.eventBus = eventBus;
  }

  /**
   * Analyze current pairs against historical snapshot.
   * Emits events for detected changes.
   */
  async analyze(currentPairs: Pair[]): Promise<void> {
    logger.debug({ pairCount: currentPairs.length }, 'Detection analysis starting');

    for (const pair of currentPairs) {
      const key = this.getPairKey(pair);
      const previous = this.historicalPairs.get(key);

      if (!previous) {
        // New pool detected
        this.eventBus.emit('NEW_POOL', {
          pair,
          detectionTimestamp: new Date().toISOString()
        });
        logger.info({ pairAddress: pair.pairAddress, dex: pair.dex }, 'New pool detected');
      } else {
        // Check for changes in existing pair
        this.detectLiquidityChange(pair, previous, key);
        this.detectVolumeAnomaly(pair, previous, key);
        this.detectPriceMovement(pair, previous, key);
      }
    }

    // Update historical snapshot
    this.updateSnapshot(currentPairs);

    logger.debug('Detection analysis completed');
  }

  /**
   * Detect significant liquidity changes.
   */
  private detectLiquidityChange(current: Pair, previous: Pair, key: string): void {
    const liquidityChangePercent = ((current.liquidity - previous.liquidity) / previous.liquidity) * 100;
    const threshold = 10; // 10% change threshold

    if (liquidityChangePercent >= threshold) {
      this.eventBus.emit('LIQUIDITY_SPIKE', {
        pair: current,
        previousLiquidity: previous.liquidity,
        currentLiquidity: current.liquidity,
        changePercent: liquidityChangePercent,
        detectionTimestamp: new Date().toISOString()
      });
      logger.info(
        { pairAddress: current.pairAddress, changePercent: liquidityChangePercent.toFixed(2) },
        'Liquidity spike detected'
      );
    } else if (liquidityChangePercent <= -threshold) {
      this.eventBus.emit('LIQUIDITY_DROP', {
        pair: current,
        previousLiquidity: previous.liquidity,
        currentLiquidity: current.liquidity,
        changePercent: liquidityChangePercent,
        detectionTimestamp: new Date().toISOString()
      });
      logger.info(
        { pairAddress: current.pairAddress, changePercent: liquidityChangePercent.toFixed(2) },
        'Liquidity drop detected'
      );
    }
  }

  /**
   * Detect volume anomalies.
   */
  private detectVolumeAnomaly(current: Pair, previous: Pair, key: string): void {
    const volumeChangePercent = ((current.volume24h - previous.volume24h) / previous.volume24h) * 100;
    const threshold = 50; // 50% volume change threshold

    if (volumeChangePercent >= threshold) {
      logger.debug(
        { pairAddress: current.pairAddress, changePercent: volumeChangePercent.toFixed(2) },
        'Volume spike detected'
      );
    }

    if (current.txns24h > 0 && previous.txns24h > 0) {
      const txnChangePercent = ((current.txns24h - previous.txns24h) / previous.txns24h) * 100;
      if (txnChangePercent >= 100) {
        logger.debug(
          { pairAddress: current.pairAddress, changePercent: txnChangePercent.toFixed(2) },
          'Transaction activity spike detected'
        );
      }
    }
  }

  /**
   * Detect price movements.
   */
  private detectPriceMovement(current: Pair, previous: Pair, key: string): void {
    if (previous.priceUsd <= 0 || current.priceUsd <= 0) {
      return;
    }

    const priceChangePercent = ((current.priceUsd - previous.priceUsd) / previous.priceUsd) * 100;
    const threshold = 25; // 25% price change threshold

    if (Math.abs(priceChangePercent) >= threshold) {
      logger.debug(
        { pairAddress: current.pairAddress, changePercent: priceChangePercent.toFixed(2) },
        `Price ${priceChangePercent > 0 ? 'surge' : 'drop'} detected`
      );
    }
  }

  /**
   * Check if pair is newly discovered (single provider source).
   */
  isNewlyDiscovered(pair: Pair, sourceCount?: number): boolean {
    return (sourceCount ?? 1) === 1;
  }

  /**
   * Check if pair is well-verified (multiple providers).
   */
  isVerified(pair: Pair, sourceCount?: number): boolean {
    return (sourceCount ?? 1) >= 2;
  }

  /**
   * Filter pairs by scoring thresholds.
   */
  filterByOpportunityScore(pairs: Pair[], minScore: number = 0.7): Pair[] {
    return pairs.filter((p) => p.score >= minScore);
  }

  /**
   * Get unique key for pair.
   */
  private getPairKey(pair: Pair): string {
    return `${pair.chain}:${pair.pairAddress.toLowerCase()}`;
  }

  /**
   * Update historical snapshot with current pairs.
   */
  private updateSnapshot(currentPairs: Pair[]): void {
    this.historicalPairs.clear();
    for (const pair of currentPairs) {
      const key = this.getPairKey(pair);
      this.historicalPairs.set(key, { ...pair });
    }
  }

  /**
   * Get historical snapshot size.
   */
  getSnapshotSize(): number {
    return this.historicalPairs.size;
  }

  /**
   * Clear detection history (for testing or reset).
   */
  clearHistory(): void {
    this.historicalPairs.clear();
  }
}
