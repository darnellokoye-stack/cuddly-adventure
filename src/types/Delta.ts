import { Pair } from './Pair.js';
import { Token } from './Token.js';

export type DeltaChangeType =
  | 'NEW_POOL'
  | 'REMOVED_POOL'
  | 'LIQUIDITY_CHANGED'
  | 'VOLUME_CHANGED'
  | 'SCORE_CHANGED'
  | 'HOLDER_CHANGED'
  | 'SECURITY_CHANGED'
  | 'METADATA_CHANGED';

export interface DeltaChange {
  type: DeltaChangeType;
  pairAddress?: string;
  tokenAddress?: string;
  previousValue?: number;
  currentValue?: number;
  percentChange?: number;
  metadata?: Record<string, unknown>;
}

export interface DeltaSnapshot {
  timestamp: string;
  changes: DeltaChange[];
  newPairs: Pair[];
  removedPairs: Pair[];
  updatedPairs: Pair[];
  newTokens: Token[];
  updatedTokens: Token[];
}
