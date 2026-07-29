import { Pair } from '../types/Pair.js';
import { Token } from '../types/Token.js';
import { DeltaChange, DeltaSnapshot } from '../types/Delta.js';
import { nowIso } from '../utils/dates.js';

export interface DeltaEngineOptions {
  liquidityThresholdPct?: number;
  volumeThresholdPct?: number;
  scoreThreshold?: number;
  holderThresholdPct?: number;
}

export class DeltaEngine {
  constructor(private readonly options: DeltaEngineOptions = {}) {}

  detect(previousPairs: Pair[], currentPairs: Pair[], previousTokens: Token[], currentTokens: Token[]): DeltaSnapshot {
    const previousPairMap = new Map(previousPairs.map((pair) => [pair.pairAddress.toLowerCase(), pair]));
    const currentPairMap = new Map(currentPairs.map((pair) => [pair.pairAddress.toLowerCase(), pair]));
    const previousTokenMap = new Map(previousTokens.map((token) => [token.address.toLowerCase(), token]));

    const changes: DeltaChange[] = [];
    const newPairs = currentPairs.filter((pair) => !previousPairMap.has(pair.pairAddress.toLowerCase()));
    const removedPairs = previousPairs.filter((pair) => !currentPairMap.has(pair.pairAddress.toLowerCase()));
    const updatedPairs = currentPairs.filter((pair) => previousPairMap.has(pair.pairAddress.toLowerCase()));
    const newTokens = currentTokens.filter((token) => !previousTokenMap.has(token.address.toLowerCase()));
    const updatedTokens = currentTokens.filter((token) => previousTokenMap.has(token.address.toLowerCase()));

    for (const pair of newPairs) {
      changes.push({ type: 'NEW_POOL', pairAddress: pair.pairAddress, metadata: { dex: pair.dex } });
    }

    for (const pair of removedPairs) {
      changes.push({ type: 'REMOVED_POOL', pairAddress: pair.pairAddress });
    }

    for (const pair of updatedPairs) {
      const previous = previousPairMap.get(pair.pairAddress.toLowerCase());
      if (!previous) continue;

      const liquidityChange = this.computePercentChange(previous.liquidity, pair.liquidity);
      if (Math.abs(liquidityChange) >= (this.options.liquidityThresholdPct ?? 15)) {
        changes.push({
          type: 'LIQUIDITY_CHANGED',
          pairAddress: pair.pairAddress,
          previousValue: previous.liquidity,
          currentValue: pair.liquidity,
          percentChange: liquidityChange
        });
      }

      const volumeChange = this.computePercentChange(previous.volume24h, pair.volume24h);
      if (Math.abs(volumeChange) >= (this.options.volumeThresholdPct ?? 20)) {
        changes.push({
          type: 'VOLUME_CHANGED',
          pairAddress: pair.pairAddress,
          previousValue: previous.volume24h,
          currentValue: pair.volume24h,
          percentChange: volumeChange
        });
      }

      if (Math.abs(pair.score - previous.score) >= (this.options.scoreThreshold ?? 5)) {
        changes.push({
          type: 'SCORE_CHANGED',
          pairAddress: pair.pairAddress,
          previousValue: previous.score,
          currentValue: pair.score,
          percentChange: pair.score - previous.score
        });
      }
    }

    for (const token of updatedTokens) {
      const previous = previousTokenMap.get(token.address.toLowerCase());
      if (!previous) continue;

      const holderChange = this.computePercentChange(previous.holderCount ?? 0, token.holderCount ?? 0);
      if (Math.abs(holderChange) >= (this.options.holderThresholdPct ?? 20)) {
        changes.push({
          type: 'HOLDER_CHANGED',
          tokenAddress: token.address,
          previousValue: previous.holderCount,
          currentValue: token.holderCount,
          percentChange: holderChange
        });
      }
    }

    return {
      timestamp: nowIso(),
      changes,
      newPairs,
      removedPairs,
      updatedPairs,
      newTokens,
      updatedTokens
    };
  }

  private computePercentChange(previousValue: number, currentValue: number): number {
    if (!previousValue) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }
}
