import Redis from 'ioredis';
import { getRedisConnectionOptions } from './redisClient.js';
import { PubSubChannels } from '../events/PubSubChannels.js';
import { logger } from './logger.js';
import { pubsubMetrics } from '../metrics/PrometheusMetrics.js';

const publisher = new Redis({ ...getRedisConnectionOptions(), lazyConnect: true, enableAutoPipelining: true });
const subscriber = new Redis({ ...getRedisConnectionOptions(), lazyConnect: true, enableAutoPipelining: true });

publisher.on('error', (error: unknown) => logger.error({ error }, 'Redis publisher error'));
subscriber.on('error', (error: unknown) => logger.error({ error }, 'Redis subscriber error'));

export interface RedisPubSubMessage {
  sourceInstanceId: string;
  payload: unknown;
}

export async function publishRedisMessage(channel: string, payload: unknown): Promise<void> {
  try {
    await publisher.connect();
    await publisher.publish(channel, JSON.stringify(payload));
    pubsubMetrics.messagesPublished.inc();
  } catch (error) {
    logger.warn({ channel, error }, 'Failed to publish Redis pub/sub message');
  }
}

export async function publishCacheInvalidation(key: string): Promise<void> {
  const message = createRedisPubSubMessage({ key, timestamp: new Date().toISOString() });
  await publishRedisMessage(PubSubChannels.CACHE_INVALIDATION, message);
}

export async function subscribeRedisChannels(
  channels: string[],
  onMessage: (channel: string, payload: unknown) => void
): Promise<void> {
  try {
    await subscriber.connect();
    await subscriber.subscribe(channels, (message, channel) => {
      try {
        const parsed = JSON.parse(message) as RedisPubSubMessage;
        pubsubMetrics.messagesReceived.inc();
        onMessage(channel, parsed.payload);
      } catch (error) {
        logger.warn({ channel, message, error }, 'Invalid pub/sub payload received');
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to subscribe to Redis channels');
  }
}

export async function closeRedisPubSub(): Promise<void> {
  try {
    await subscriber.quit();
    await publisher.quit();
  } catch (error) {
    logger.warn({ error }, 'Error closing Redis Pub/Sub clients');
  }
}

export function createRedisPubSubMessage(payload: unknown): RedisPubSubMessage {
  return {
    sourceInstanceId: process.env.INSTANCE_ID ?? 'local',
    payload
  };
}
