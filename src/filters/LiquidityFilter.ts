import { Pair } from '../types/Pair.js';
import { PairFilter } from './PairFilter.js';
import { config } from '../config/config.js';

/**
 * Filters pairs by liquidity and volume thresholds.
 */
export class LiquidityFilter implements PairFilter {
  filter(pair: Pair): boolean {
    if (pair.liquidity <= 0) {
      return false;
    }

    if (pair.liquidity < config.minLiquidity) {
      return false;
    }

    if (pair.volume24h < config.minVolume) {
      return false;
    }

    return true;
  }
}
