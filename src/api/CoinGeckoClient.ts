import { HttpClient } from './HttpClient.js';
import { CoinGeckoToken } from '../types/ApiResponses.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const DEFAULT_PLATFORM = 'base';

/**
 * Client for CoinGecko fallback data retrieval.
 */
export class CoinGeckoClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    this.httpClient = httpClient ?? new HttpClient({ timeoutMs: 12000 });
  }

  async fetchTokenByPlatform(platform: string, contractAddress: string): Promise<CoinGeckoToken> {
    const params = {
      contract_address: contractAddress,
      include_platform: true
    };

    const headers = config.coingeckoApiKey
      ? { 'x-cg-pro-api-key': config.coingeckoApiKey }
      : undefined;

    return this.httpClient.get<CoinGeckoToken>(
      `${BASE_URL}/coins/${platform}/contract/${contractAddress}`,
      params,
      headers
    );
  }

  async fetchTokenMetadata(contractAddress: string): Promise<{ priceUsd: number; marketCap: number; fdv: number }> {
    try {
      const token = await this.fetchTokenByPlatform(DEFAULT_PLATFORM, contractAddress);
      return {
        priceUsd: token.market_data.current_price.usd ?? 0,
        marketCap: token.market_data.market_cap.usd ?? 0,
        fdv: token.market_data.fdv ?? 0
      };
    } catch (error) {
      logger.debug({ contractAddress, error }, 'CoinGecko metadata fetch failed');
      return { priceUsd: 0, marketCap: 0, fdv: 0 };
    }
  }
}
