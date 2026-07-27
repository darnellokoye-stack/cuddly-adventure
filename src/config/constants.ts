export const BASE_CHAIN = 'base';

export const SUPPORTED_DEXS = [
  'aerodrome',
  'uniswap v3',
  'pancakeswap',
  'sushiswap',
  'baseswap',
  'alien base'
] as const;

export const DEFAULT_CACHE_INTERVAL = 600000;
export const DEFAULT_PORT = 4000;
export const DEFAULT_MIN_LIQUIDITY = 5000;
export const DEFAULT_MIN_VOLUME = 1000;
export const DEFAULT_LOG_LEVEL = 'info';

export const SCORE_WEIGHTS = {
  liquidity: 0.35,
  volume: 0.30,
  age: 0.15,
  exchanges: 0.10,
  transactions: 0.10
} as const;
