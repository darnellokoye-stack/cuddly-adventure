import { Pair } from '../types/Pair.js';

/**
 * Filter rule contract for discovery pairs.
 */
export interface PairFilter {
  filter(pair: Pair): boolean;
}
