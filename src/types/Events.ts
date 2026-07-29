import { Pair } from './Pair.js';
import { Token } from './Token.js';

/**
 * Internal event types for market discoveries and changes.
 */

export enum DiscoveryEventType {
  NEW_PAIR = 'NEW_PAIR',
  NEW_TOKEN = 'NEW_TOKEN',
  LIQUIDITY_SPIKE = 'LIQUIDITY_SPIKE',
  LIQUIDITY_DROP = 'LIQUIDITY_DROP',
  VOLUME_SPIKE = 'VOLUME_SPIKE',
  HOLDER_GROWTH = 'HOLDER_GROWTH',
  SCORE_CHANGED = 'SCORE_CHANGED',
  SECURITY_WARNING = 'SECURITY_WARNING',
  PROVIDER_FAILURE = 'PROVIDER_FAILURE',
  MARKET_ALERT = 'MARKET_ALERT'
}

/**
 * Base event structure.
 */
export interface DiscoveryEvent {
  type: DiscoveryEventType;
  timestamp: string;
  data: unknown;
}

/**
 * Event: New pair discovered.
 */
export interface NewPairEvent extends DiscoveryEvent {
  type: DiscoveryEventType.NEW_PAIR;
  data: {
    pair: Pair;
    sources: string[]; // provider IDs
  };
}

/**
 * Event: New token discovered.
 */
export interface NewTokenEvent extends DiscoveryEvent {
  type: DiscoveryEventType.NEW_TOKEN;
  data: {
    token: Token;
    pairCount: number;
  };
}

/**
 * Event: Liquidity increased significantly.
 */
export interface LiquiditySpikeEvent extends DiscoveryEvent {
  type: DiscoveryEventType.LIQUIDITY_SPIKE;
  data: {
    pairAddress: string;
    previousLiquidity: number;
    currentLiquidity: number;
    percentChange: number;
  };
}

/**
 * Event: Liquidity decreased significantly.
 */
export interface LiquidityDropEvent extends DiscoveryEvent {
  type: DiscoveryEventType.LIQUIDITY_DROP;
  data: {
    pairAddress: string;
    previousLiquidity: number;
    currentLiquidity: number;
    percentChange: number;
  };
}

/**
 * Event: Volume spiked.
 */
export interface VolumeSpikeEvent extends DiscoveryEvent {
  type: DiscoveryEventType.VOLUME_SPIKE;
  data: {
    pairAddress: string;
    volume: number;
    percentChange: number;
  };
}

/**
 * Event: Holder count grew rapidly.
 */
export interface HolderGrowthEvent extends DiscoveryEvent {
  type: DiscoveryEventType.HOLDER_GROWTH;
  data: {
    tokenAddress: string;
    previousHolders: number;
    currentHolders: number;
    percentChange: number;
  };
}

/**
 * Event: Opportunity score changed.
 */
export interface ScoreChangedEvent extends DiscoveryEvent {
  type: DiscoveryEventType.SCORE_CHANGED;
  data: {
    pairAddress: string;
    previousScore: number;
    currentScore: number;
    reason: string;
  };
}

/**
 * Event: Security issue detected.
 */
export interface SecurityWarningEvent extends DiscoveryEvent {
  type: DiscoveryEventType.SECURITY_WARNING;
  data: {
    tokenAddress?: string;
    pairAddress?: string;
    severity: 'low' | 'medium' | 'high';
    issue: string;
  };
}

/**
 * Event: Provider failure.
 */
export interface ProviderFailureEvent extends DiscoveryEvent {
  type: DiscoveryEventType.PROVIDER_FAILURE;
  data: {
    providerId: string;
    reason: string;
  };
}

/**
 * Event: Market-alert summary from delta/opportunity analysis.
 */
export interface MarketAlertEvent extends DiscoveryEvent {
  type: DiscoveryEventType.MARKET_ALERT;
  data: {
    title: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    source: string;
  };
}

/**
 * Union of all events.
 */
export type AnyDiscoveryEvent =
  | NewPairEvent
  | NewTokenEvent
  | LiquiditySpikeEvent
  | LiquidityDropEvent
  | VolumeSpikeEvent
  | HolderGrowthEvent
  | ScoreChangedEvent
  | SecurityWarningEvent
  | ProviderFailureEvent
  | MarketAlertEvent;
