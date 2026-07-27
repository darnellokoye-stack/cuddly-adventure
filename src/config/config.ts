import dotenv from 'dotenv';
import { z } from 'zod';
import {
  DEFAULT_CACHE_INTERVAL,
  DEFAULT_LOG_LEVEL,
  DEFAULT_MIN_LIQUIDITY,
  DEFAULT_MIN_VOLUME,
  DEFAULT_PORT
} from './constants.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional(),
  CACHE_INTERVAL: z.string().optional(),
  MIN_LIQUIDITY: z.string().optional(),
  MIN_VOLUME: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  DEXSCREENER_BASE_URL: z.string().url()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const env = parsed.data;

export const config = {
  port: Number(env.PORT ?? DEFAULT_PORT),
  cacheInterval: Number(env.CACHE_INTERVAL ?? DEFAULT_CACHE_INTERVAL),
  minLiquidity: Number(env.MIN_LIQUIDITY ?? DEFAULT_MIN_LIQUIDITY),
  minVolume: Number(env.MIN_VOLUME ?? DEFAULT_MIN_VOLUME),
  logLevel: env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
  coingeckoApiKey: env.COINGECKO_API_KEY ?? '',
  dexscreenerBaseUrl: env.DEXSCREENER_BASE_URL
};

export type AppConfig = typeof config;
