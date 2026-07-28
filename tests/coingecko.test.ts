import { describe, expect, it } from 'vitest';

describe('CoinGecko client', () => {
  it('sends API key header when configured', async () => {
    process.env.COINGECKO_API_KEY = 'demo-key';
    const { CoinGeckoClient } = await import('../src/api/CoinGeckoClient.ts');

    let capturedHeaders: Record<string, string> | undefined;
    const mockHttpClient = {
      get: async <T>(_url: string, _params?: Record<string, unknown>, headers?: Record<string, string>) => {
        capturedHeaders = headers;
        return { market_data: { current_price: { usd: 1 }, market_cap: { usd: 2 }, fdv: 3 } } as unknown as T;
      }
    };

    const client = new CoinGeckoClient(mockHttpClient as any);
    await client.fetchTokenMetadata('0x2222222222222222222222222222222222222222');

    expect(capturedHeaders).toBeDefined();
    expect(capturedHeaders?.['x-cg-pro-api-key']).toBe('demo-key');
  });

  it('returns zeros when CoinGecko request fails', async () => {
    const { CoinGeckoClient } = await import('../src/api/CoinGeckoClient.ts');
    const mockHttpClient = {
      get: async <T>() => {
        throw new Error('HTTP failure');
      }
    };

    const client = new CoinGeckoClient(mockHttpClient as any);
    const result = await client.fetchTokenMetadata('0x2222222222222222222222222222222222222222');

    expect(result).toEqual({ priceUsd: 0, marketCap: 0, fdv: 0 });
  });
});
