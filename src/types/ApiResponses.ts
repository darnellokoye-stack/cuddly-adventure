/**
 * DexScreener pair response.
 */
export interface DexScreenerPair {
  pairAddress: string;
  baseToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  quoteToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  dexId: string;
  chainId: string;
  liquidity: number;
  liquidityUsd: number;
  priceUsd: number;
  priceNative: number;
  volumeUsd: number;
  txns24h: number;
  fdv: number;
  marketCap: number;
  poolCount: number;
  poolCount7d: number;
  pairCreatedAt: string;
}

export interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  platforms: Record<string, string>;
  market_data: {
    current_price: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap: Record<string, number>;
    fdv: number | null;
  };
  last_updated: string;
}
