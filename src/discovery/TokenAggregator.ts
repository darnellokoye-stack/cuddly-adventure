import { Token } from '../types/Token.js';
import { Pair } from '../types/Pair.js';

/**
 * Builds token-level objects from discovered pair data.
 */
export class TokenAggregator {
  aggregate(pairs: Pair[]): Token[] {
    const tokenIndex = new Map<string, Token>();

    for (const pair of pairs) {
      this.addToken(pair.baseToken, pair, tokenIndex);
      this.addToken(pair.quoteToken, pair, tokenIndex);
    }

    return Array.from(tokenIndex.values());
  }

  private addToken(address: string, pair: Pair, index: Map<string, Token>): void {
    const normalizedAddress = address.toLowerCase();
    const existing = index.get(normalizedAddress);
    const now = new Date().toISOString();

    const candidate: Token = {
      symbol: '',
      name: '',
      address,
      chain: 'base',
      decimals: 18,
      priceUsd: pair.priceUsd,
      liquidityUsd: pair.liquidity,
      volume24h: pair.volume24h,
      fdv: 0,
      marketCap: 0,
      exchanges: [pair.dex],
      pairs: [pair.pairAddress],
      score: pair.score,
      lastUpdated: now
    };

    if (!existing) {
      index.set(normalizedAddress, candidate);
      return;
    }

    existing.priceUsd = Math.max(existing.priceUsd, pair.priceUsd);
    existing.liquidityUsd += pair.liquidity;
    existing.volume24h += pair.volume24h;
    existing.score = Math.max(existing.score, pair.score);
    existing.exchanges = Array.from(new Set([...existing.exchanges, pair.dex]));
    existing.pairs = Array.from(new Set([...existing.pairs, pair.pairAddress]));
    existing.lastUpdated = now;
  }
}
