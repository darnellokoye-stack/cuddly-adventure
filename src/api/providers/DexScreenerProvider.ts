import { HttpClient } from '../HttpClient.js';
import { config } from '../../config/config.js';
import { BaseProvider, NormalizedResponse, NormalizedPair } from './BaseProvider.js';
import { DexScreenerResponse } from '../../types/ApiResponses.js';
import { logger } from '../../utils/logger.js';

/**
 * DexScreener provider implementing BaseProvider interface.
 * Fetches Base chain pair data from DexScreener API.
 */
export class DexScreenerProvider extends BaseProvider {
  private readonly httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    super('dexscreener', 'DexScreener');
    this.httpClient = httpClient ?? new HttpClient({ timeoutMs: 12000 });
  }

  async fetchPairs(): Promise<NormalizedResponse> {
    try {
      const response = await this.httpClient.get<DexScreenerResponse>(config.dexscreenerBaseUrl);
      
      const normalized: NormalizedPair[] = response.pairs.map((pair) => ({
        pairAddress: pair.pairAddress,
        baseToken: pair.baseToken,
        quoteToken: pair.quoteToken,
        dexId: pair.dexId,
        chainId: pair.chainId,
        liquidity: pair.liquidityUsd ?? pair.liquidity,
        liquidityUsd: pair.liquidityUsd,
        priceUsd: pair.priceUsd,
        priceNative: pair.priceNative,
        volumeUsd: pair.volumeUsd,
        txns24h: pair.txns24h,
        fdv: pair.fdv,
        marketCap: pair.marketCap,
        pairCreatedAt: pair.pairCreatedAt || new Date().toISOString(),
        poolAddress: pair.pairAddress,
        protocol: 'dex'
      }));

      return {
        pairs: normalized,
        providerId: this.providerId,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.warn({ providerId: this.providerId, error }, 'DexScreener provider fetch failed');
      throw error;
    }
  }
}
