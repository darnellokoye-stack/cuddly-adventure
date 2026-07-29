import dotenv from 'dotenv';
import { z } from 'zod';
import {
  DEFAULT_CACHE_INTERVAL,
  DEFAULT_CACHE_PROVIDER,
  DEFAULT_CACHE_NAMESPACE,
  DEFAULT_CACHE_VERSION,
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_REDIS_HOST,
  DEFAULT_REDIS_PORT,
  DEFAULT_REDIS_DB,
  DEFAULT_LOG_LEVEL,
  DEFAULT_MIN_LIQUIDITY,
  DEFAULT_MIN_VOLUME,
  DEFAULT_PORT,
  DEFAULT_LIQUIDITY_THRESHOLD_PCT,
  DEFAULT_VOLUME_THRESHOLD_PCT,
  DEFAULT_SCORE_THRESHOLD,
  DEFAULT_HOLDER_THRESHOLD_PCT,
  DEFAULT_EVENT_STREAM_PORT,
  DEFAULT_SERVICE_ROLE,
  DEFAULT_WORKER_CONCURRENCY,
  DEFAULT_DISCOVERY_CRON,
  DEFAULT_DEXSCREENER_BASE_URL
} from './constants.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional(),
  CACHE_PROVIDER: z.enum(['file', 'redis']).optional(),
  CACHE_NAMESPACE: z.string().optional(),
  CACHE_VERSION: z.string().optional(),
  CACHE_TTL_SECONDS: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_DB: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  CACHE_INTERVAL: z.string().optional(),
  MIN_LIQUIDITY: z.string().optional(),
  MIN_VOLUME: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  LIQUIDITY_THRESHOLD_PCT: z.string().optional(),
  VOLUME_THRESHOLD_PCT: z.string().optional(),
  SCORE_THRESHOLD: z.string().optional(),
  HOLDER_THRESHOLD_PCT: z.string().optional(),
  EVENT_STREAM_PORT: z.string().optional(),
  SERVICE_ROLE: z.enum(['api', 'worker', 'all']).optional(),
  WORKER_CONCURRENCY: z.string().optional(),
  DISCOVERY_CRON: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  DEXSCREENER_BASE_URL: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const env = parsed.data;

export const config = {
  port: Number(env.PORT ?? DEFAULT_PORT),
  cacheProvider: (env.CACHE_PROVIDER ?? DEFAULT_CACHE_PROVIDER) as 'file' | 'redis',
  cacheNamespace: env.CACHE_NAMESPACE ?? DEFAULT_CACHE_NAMESPACE,
  cacheVersion: env.CACHE_VERSION ?? DEFAULT_CACHE_VERSION,
  cacheTtlSeconds: Number(env.CACHE_TTL_SECONDS ?? DEFAULT_CACHE_TTL_SECONDS),
  redisHost: env.REDIS_HOST ?? DEFAULT_REDIS_HOST,
  redisPort: Number(env.REDIS_PORT ?? DEFAULT_REDIS_PORT),
  redisDb: Number(env.REDIS_DB ?? DEFAULT_REDIS_DB),
  redisPassword: env.REDIS_PASSWORD ?? '',
  cacheInterval: Number(env.CACHE_INTERVAL ?? DEFAULT_CACHE_INTERVAL),
  minLiquidity: Number(env.MIN_LIQUIDITY ?? DEFAULT_MIN_LIQUIDITY),
  minVolume: Number(env.MIN_VOLUME ?? DEFAULT_MIN_VOLUME),
  logLevel: env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
  liquidityThresholdPct: Number(env.LIQUIDITY_THRESHOLD_PCT ?? DEFAULT_LIQUIDITY_THRESHOLD_PCT),
  volumeThresholdPct: Number(env.VOLUME_THRESHOLD_PCT ?? DEFAULT_VOLUME_THRESHOLD_PCT),
  scoreThreshold: Number(env.SCORE_THRESHOLD ?? DEFAULT_SCORE_THRESHOLD),
  holderThresholdPct: Number(env.HOLDER_THRESHOLD_PCT ?? DEFAULT_HOLDER_THRESHOLD_PCT),
  eventStreamPort: Number(env.EVENT_STREAM_PORT ?? DEFAULT_EVENT_STREAM_PORT),
  serviceRole: (env.SERVICE_ROLE ?? DEFAULT_SERVICE_ROLE) as 'api' | 'worker' | 'all',
  workerConcurrency: Number(env.WORKER_CONCURRENCY ?? DEFAULT_WORKER_CONCURRENCY),
  discoveryCron: env.DISCOVERY_CRON ?? DEFAULT_DISCOVERY_CRON,
  coingeckoApiKey: env.COINGECKO_API_KEY ?? '',
  dexscreenerBaseUrl: env.DEXSCREENER_BASE_URL ?? DEFAULT_DEXSCREENER_BASE_URL
};

export type AppConfig = typeof config;
