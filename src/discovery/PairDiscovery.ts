import { DexScreenerPair } from '../types/ApiResponses.js';
import { Pair } from '../types/Pair.js';
import { DexStrategyRegistry } from './DexStrategyRegistry.js';

const registry = new DexStrategyRegistry();

/**
 * Converts raw pair response data into normalized discovery pairs.
 */
export class PairDiscovery {
  static transform(input: DexScreenerPair): Pair {
    return {
      pairAddress: input.pairAddress,
      dex: registry.recognize(input.dexId),
      baseToken: input.baseToken.address,
      quoteToken: input.quoteToken.address,
      chain: input.chainId ?? 'base',
      liquidity: input.liquidityUsd ?? input.liquidity,
      volume24h: input.volumeUsd,
      priceUsd: input.priceUsd,
      txns24h: input.txns24h,
      score: 0,
      lastUpdated: input.pairCreatedAt || new Date().toISOString()
    };
  }
}
