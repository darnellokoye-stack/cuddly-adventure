import Redis from 'ioredis';
import { config } from '../config/config.js';
import { logger } from './logger.js';

const redisOptions = {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  db: config.redisDb,
  lazyConnect: true,
  enableAutoPipelining: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000
};

const client = new Redis(redisOptions);

client.on('error', (error: unknown) => logger.error({ error }, 'Redis client error'));
client.on('connect', () => logger.info('Redis client connecting'));
client.on('ready', () => logger.info('Redis client ready'));
client.on('close', () => logger.warn('Redis client closed'));
client.on('end', () => logger.warn('Redis client connection ended'));

export function getRedisClient(): Redis {
  return client;
}

export function getRedisConnectionOptions() {
  return {
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword || undefined,
    db: config.redisDb,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000
  };
}

export async function ensureRedisConnected(): Promise<void> {
  if (config.cacheProvider !== 'redis') {
    return;
  }

  if (client.status === 'ready') {
    return;
  }

  try {
    await client.connect();
  } catch (error) {
    logger.warn({ error }, 'Failed to connect to Redis during startup');
  }
}
