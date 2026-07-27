import { DexScreenerResponse } from '../types/ApiResponses.js';
import { HttpClient } from './HttpClient.js';
import { config } from '../config/config.js';
import { DiscoveryProvider } from './DiscoveryProvider.js';

/**
 * Client for DexScreener Base chain discovery.
 */
export class DexScreenerClient implements DiscoveryProvider {
  private readonly httpClient = new HttpClient();

  async fetchPairs(): Promise<DexScreenerResponse> {
    const response = await this.httpClient.get<DexScreenerResponse>(config.dexscreenerBaseUrl);
    return response;
  }
}
