import { Pair } from '../types/Pair.js';
import { Token } from '../types/Token.js';

/**
 * Deduplicate discovery entries by address and retain the highest score.
 */
export function deduplicatePairs(pairs: Pair[]): Pair[] {
  const seen = new Map<string, Pair>();

  for (const pair of pairs) {
    const existing = seen.get(pair.pairAddress.toLowerCase());

    if (!existing || pair.score > existing.score) {
      seen.set(pair.pairAddress.toLowerCase(), pair);
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicate token entries by address and retain the highest score.
 */
export function deduplicateTokens(tokens: Token[]): Token[] {
  const seen = new Map<string, Token>();

  for (const token of tokens) {
    const existing = seen.get(token.address.toLowerCase());

    if (!existing || token.score > existing.score) {
      seen.set(token.address.toLowerCase(), token);
    }
  }

  return Array.from(seen.values());
}
