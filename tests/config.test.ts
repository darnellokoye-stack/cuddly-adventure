import { describe, expect, it } from 'vitest';

describe('Configuration', () => {
  it('reads environment variables and applies defaults', async () => {
    process.env.PORT = '5000';
    process.env.CACHE_INTERVAL = '10000';
    process.env.MIN_LIQUIDITY = '2500';
    process.env.MIN_VOLUME = '500';
    process.env.LOG_LEVEL = 'debug';
    process.env.DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex/pairs/base';

    const configModule = await import('../src/config/config.ts');
    expect(configModule.config.port).toBe(5000);
    expect(configModule.config.cacheInterval).toBe(10000);
    expect(configModule.config.minLiquidity).toBe(2500);
    expect(configModule.config.minVolume).toBe(500);
    expect(configModule.config.logLevel).toBe('debug');
    expect(configModule.config.dexscreenerBaseUrl).toBe('https://api.dexscreener.com/latest/dex/pairs/base');
  });
});
