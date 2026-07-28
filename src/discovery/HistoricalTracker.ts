import { Pair } from '../types/Pair.js';
import { Token } from '../types/Token.js';
import { FileCache } from '../cache/FileCache.js';
import { logger } from '../utils/logger.js';

/**
 * Snapshot of discovery state at a point in time.
 */
export interface DiscoverySnapshot {
  timestamp: string;
  epoch: number; // milliseconds since epoch
  pairs: Pair[];
  tokens: Token[];
  stats: Record<string, number | string>;
}

/**
 * Historical tracking of discovery snapshots.
 * Stores snapshots and enables comparison over time.
 */
export class HistoricalTracker {
  private cache: FileCache;
  private snapshots: DiscoverySnapshot[] = [];
  private maxSnapshots: number;
  private snapshotDir = '.data/snapshots';

  constructor(cache?: FileCache, maxSnapshots: number = 24) {
    this.cache = cache ?? new FileCache();
    this.maxSnapshots = maxSnapshots; // Keep last 24 snapshots (hourly = 1 day)
  }

  /**
   * Record current discovery state as a snapshot.
   */
  async recordSnapshot(
    pairs: Pair[],
    tokens: Token[],
    stats: Record<string, number | string>
  ): Promise<DiscoverySnapshot> {
    const now = new Date();
    const snapshot: DiscoverySnapshot = {
      timestamp: now.toISOString(),
      epoch: now.getTime(),
      pairs: JSON.parse(JSON.stringify(pairs)), // Deep copy
      tokens: JSON.parse(JSON.stringify(tokens)),
      stats
    };

    this.snapshots.push(snapshot);

    // Keep only the last maxSnapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    logger.debug({ snapshotCount: this.snapshots.length, pairCount: pairs.length }, 'Snapshot recorded');
    return snapshot;
  }

  /**
   * Get the most recent snapshot.
   */
  getLatestSnapshot(): DiscoverySnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  /**
   * Get snapshot from N steps back (0 = latest, 1 = previous, etc).
   */
  getSnapshotByOffset(offset: number = 1): DiscoverySnapshot | null {
    const index = this.snapshots.length - 1 - offset;
    return index >= 0 ? this.snapshots[index] : null;
  }

  /**
   * Compare two snapshots and identify changes.
   */
  compare(
    current: DiscoverySnapshot,
    previous: DiscoverySnapshot
  ): {
    newPairs: Pair[];
    removedPairs: Pair[];
    modifiedPairs: { current: Pair; previous: Pair }[];
    newTokens: Token[];
    removedTokens: Token[];
  } {
    const currentPairKeys = new Set(current.pairs.map((p) => `${p.chain}:${p.pairAddress}`));
    const previousPairKeys = new Set(previous.pairs.map((p) => `${p.chain}:${p.pairAddress}`));

    const currentTokenAddrs = new Set(current.tokens.map((t) => t.address));
    const previousTokenAddrs = new Set(previous.tokens.map((t) => t.address));

    // New pairs (in current but not in previous)
    const newPairs = current.pairs.filter((p) => !previousPairKeys.has(`${p.chain}:${p.pairAddress}`));

    // Removed pairs
    const removedPairs = previous.pairs.filter((p) => !currentPairKeys.has(`${p.chain}:${p.pairAddress}`));

    // Modified pairs
    const modifiedPairs: { current: Pair; previous: Pair }[] = [];
    for (const currentPair of current.pairs) {
      const key = `${currentPair.chain}:${currentPair.pairAddress}`;
      const prevPair = previous.pairs.find((p) => `${p.chain}:${p.pairAddress}` === key);
      if (prevPair && this.hasPairChanged(currentPair, prevPair)) {
        modifiedPairs.push({ current: currentPair, previous: prevPair });
      }
    }

    // New tokens
    const newTokens = current.tokens.filter((t) => !previousTokenAddrs.has(t.address));

    // Removed tokens
    const removedTokens = previous.tokens.filter((t) => !currentTokenAddrs.has(t.address));

    return { newPairs, removedPairs, modifiedPairs, newTokens, removedTokens };
  }

  /**
   * Check if pair data has changed significantly.
   */
  private hasPairChanged(current: Pair, previous: Pair): boolean {
    if (current.liquidity !== previous.liquidity) return true;
    if (current.volume24h !== previous.volume24h) return true;
    if (current.priceUsd !== previous.priceUsd) return true;
    if (current.txns24h !== previous.txns24h) return true;
    if (current.score !== previous.score) return true;
    return false;
  }

  /**
   * Get all recorded snapshots.
   */
  getSnapshots(): DiscoverySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get snapshot count.
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  /**
   * Clear all snapshots.
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Analyze pair evolution over time.
   */
  analyzePairEvolution(
    pairKey: string
  ): {
    found: boolean;
    firstSeen: string | null;
    lastSeen: string | null;
    snapshotCount: number;
    liquidityTrend: ('increasing' | 'decreasing' | 'stable')[];
    volumeTrend: ('increasing' | 'decreasing' | 'stable')[];
  } {
    const evolution = {
      found: false,
      firstSeen: null as string | null,
      lastSeen: null as string | null,
      snapshotCount: 0,
      liquidityTrend: [] as ('increasing' | 'decreasing' | 'stable')[],
      volumeTrend: [] as ('increasing' | 'decreasing' | 'stable')[]
    };

    const pairHistory: Pair[] = [];

    for (const snapshot of this.snapshots) {
      const pair = snapshot.pairs.find((p) => `${p.chain}:${p.pairAddress}` === pairKey);
      if (pair) {
        if (!evolution.found) {
          evolution.found = true;
          evolution.firstSeen = snapshot.timestamp;
        }
        evolution.lastSeen = snapshot.timestamp;
        evolution.snapshotCount += 1;
        pairHistory.push(pair);
      }
    }

    // Calculate trends
    for (let i = 1; i < pairHistory.length; i++) {
      const curr = pairHistory[i];
      const prev = pairHistory[i - 1];

      if (curr.liquidity > prev.liquidity * 1.05) {
        evolution.liquidityTrend.push('increasing');
      } else if (curr.liquidity < prev.liquidity * 0.95) {
        evolution.liquidityTrend.push('decreasing');
      } else {
        evolution.liquidityTrend.push('stable');
      }

      if (curr.volume24h > prev.volume24h * 1.05) {
        evolution.volumeTrend.push('increasing');
      } else if (curr.volume24h < prev.volume24h * 0.95) {
        evolution.volumeTrend.push('decreasing');
      } else {
        evolution.volumeTrend.push('stable');
      }
    }

    return evolution;
  }
}
