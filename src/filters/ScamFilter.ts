import { Pair } from '../types/Pair.js';
import { PairFilter } from './PairFilter.js';

const scamKeywords = ['rug', 'honeypot', 'fraud', 'scam', 'fake', 'shit'];

/**
 * Filters obvious scam or fake token pairs.
 */
export class ScamFilter implements PairFilter {
  filter(pair: Pair): boolean {
    const target = `${pair.baseToken}:${pair.quoteToken}`.toLowerCase();
    const description = `${pair.dex}`.toLowerCase();

    const hasScamContent = scamKeywords.some((keyword) =>
      target.includes(keyword) || description.includes(keyword)
    );

    return !hasScamContent;
  }
}
