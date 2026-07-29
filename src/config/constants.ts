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
export const DEFAULT_CACHE_PROVIDER = 'file';
export const DEFAULT_CACHE_NAMESPACE = 'base-market-intel';
export const DEFAULT_CACHE_VERSION = '1.0';
export const DEFAULT_CACHE_TTL_SECONDS = 3600;
export const DEFAULT_REDIS_HOST = '127.0.0.1';
export const DEFAULT_REDIS_PORT = 6379;
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_SERVICE_ROLE = 'all';
export const DEFAULT_WORKER_CONCURRENCY = 2;
export const DEFAULT_DISCOVERY_CRON = '*/10 * * * *';
export const DEFAULT_PORT = 4000;
export const DEFAULT_DEXSCREENER_BASE_URL = 'https://api.dexscreener.com';
export const DEFAULT_MIN_LIQUIDITY = 5000;
export const DEFAULT_MIN_VOLUME = 1000;
export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_LIQUIDITY_THRESHOLD_PCT = 15;
export const DEFAULT_VOLUME_THRESHOLD_PCT = 20;
export const DEFAULT_SCORE_THRESHOLD = 5;
export const DEFAULT_HOLDER_THRESHOLD_PCT = 20;
export const DEFAULT_EVENT_STREAM_PORT = 4100;

export const SCORE_WEIGHTS = {
  liquidity: 0.35,
  volume: 0.30,
  age: 0.15,
  exchanges: 0.10,
  transactions: 0.10
} as const;
