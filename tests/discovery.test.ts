import { describe, expect, it } from 'vitest';
import { PairDiscovery } from '../src/discovery/PairDiscovery.js';
import { TokenAggregator } from '../src/discovery/TokenAggregator.js';
import { DexScreenerPair } from '../src/types/ApiResponses.js';

const sampleRawPair: DexScreenerPair = {
  pairAddress: '0x1111111111111111111111111111111111111111',
  baseToken: {
    address: '0x2222222222222222222222222222222222222222',
    symbol: 'BASE',
    name: 'Base Token',
    decimals: 18
  },
  quoteToken: {
    address: '0x3333333333333333333333333333333333333333',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  dexId: 'uniswap v3',
  chainId: 'base',
  liquidity: 15000,
  liquidityUsd: 15000,
  priceUsd: 0.45,
  priceNative: 0,
  volumeUsd: 4000,
  txns24h: 50,
  fdv: 0,
  marketCap: 0,
  poolCount: 1,
  poolCount7d: 1,
  pairCreatedAt: '2025-03-01T00:00:00.000Z'
};

describe('Discovery transformation', () => {
  it('transforms raw DexScreener pair into normalized pair', () => {
    const pair = PairDiscovery.transform(sampleRawPair);
    expect(pair.dex).toBe('Uniswap V3');
    expect(pair.liquidity).toBe(15000);
    expect(pair.volume24h).toBe(4000);
    expect(pair.pairAddress).toBe(sampleRawPair.pairAddress);
  });

  it('aggregates tokens from discovered pairs', () => {
    const pair = PairDiscovery.transform(sampleRawPair);
    const aggregator = new TokenAggregator();
    const tokens = aggregator.aggregate([pair]);
    expect(tokens.length).toBe(2);
    expect(tokens.map((token) => token.address).sort()).toEqual([
      sampleRawPair.baseToken.address,
      sampleRawPair.quoteToken.address
    ]);
  });
});
