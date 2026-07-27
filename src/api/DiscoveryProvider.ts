/**
 * Discovery provider contract for fetching chain pair data.
 */
import { DexScreenerResponse } from '../types/ApiResponses.js';

export interface DiscoveryProvider {
  fetchPairs(): Promise<DexScreenerResponse>;
}
